import { AsyncAction, Logger } from "@hdapp/shared/web2-common/utils";
import { LocalDateTime } from "@js-joda/core";
import { makeAutoObservable, runInAction } from "mobx";
import { sessionManager } from "../../managers/session.manager";
import { BlockEntry } from "../../services/block.service";
import { RecordEntry, RecordSearchRequest } from "../../services/record.service";

export enum RecordGroupType {
    None,
    ByCreator,
    ByBlock,
    ByMonthCreated,
    ByYearCreated,
}

export interface RecordGroup {
    type: RecordGroupType
    key: string
    title: string
    isOwned: boolean
    records: RecordEntry[]
    aggregated_updated_at: LocalDateTime
    shared_with: { full_name: string; address: string; avatar: string }[]
}

const { warn } = new Logger("records-vm");

export class RecordsViewModel {
    constructor(private _ownedBy?: string) {
        makeAutoObservable(this);
    }

    private _recordSearchRequest: RecordSearchRequest = {};
    private _records: RecordEntry[] = [];
    private _groups: RecordGroup[] = [];
    private _groupBy = RecordGroupType.ByBlock;

    get groups() {
        return this._groups;
    }

    get records() {
        return this._records;
    }

    get recordSearchRequest() {
        return this._recordSearchRequest;
    }

    set recordSearchRequest(v: RecordSearchRequest) {
        this._recordSearchRequest = v;
        this.loadRecords.tryRun();
    }

    get groupBy() {
        return this._groupBy;
    }

    set groupBy(v: RecordGroupType) {
        this._groupBy = v;
        this.loadRecords.tryRun();
    }

    private async _groupByBlock(records: RecordEntry[]): Promise<RecordGroup[]> {
        const blocks: BlockEntry[] = (await sessionManager.db.blocks.getBlocks())
            .filter(r => this._ownedBy ? r.owned_by === this._ownedBy : true);
        const groups: RecordGroup[] = blocks.map(block => (
            {
                key: block.hash,
                title: block.friendly_name,
                aggregated_updated_at: block.created_at,
                records: [],
                shared_with: [],
                type: RecordGroupType.ByBlock,
                isOwned: block.owned_by === sessionManager.wallet.address
            }
        ));
        for (const record of records) {
            for (const blockId of record.block_ids) {
                const group = groups.find(g => g.key === blockId);
                if (group) {
                    group.records.push(record);
                } else {
                    warn("Encountered an unexisting block_id.", { blockId, record, blocks });
                }
            }
        }

        for (const group of groups) {
            group.aggregated_updated_at = group.records.reduce(
                (prev, record) => record.created_at.isAfter(prev) ? record.created_at : prev,
                group.aggregated_updated_at
            );
            group.shared_with = []; // TODO
        }

        const ungrouped = records.filter(r => !groups.some(g => g.records.includes(r)));
        if (ungrouped.length) {
            groups.push({
                records: ungrouped,
                title: "Ungrouped",
                aggregated_updated_at: LocalDateTime.now(),
                key: "ungrouped",
                isOwned: false,
                shared_with: [],
                type: RecordGroupType.ByBlock
            });
        }

        return [...groups].sort(
            (a, b) => a.aggregated_updated_at.compareTo(b.aggregated_updated_at)
        );
    }

    readonly loadRecords = new AsyncAction(async () => {
        if (!sessionManager.encryption)
            throw new Error("Can't load records without encryption provider.");

        const records = (await sessionManager.db.records.searchRecords(
            this._recordSearchRequest,
            sessionManager.encryption
        )).filter(r => this._ownedBy ? r.owned_by === this._ownedBy : true);

        const groups = await this._groupByBlock(records);

        runInAction(() => {
            this._records = records;
            this._groups = groups;
        });
    });
}
