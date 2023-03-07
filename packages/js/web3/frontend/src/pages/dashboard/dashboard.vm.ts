import { AsyncAction, Logger } from "@hdapp/shared/web2-common/utils";
import { LocalDateTime } from "@js-joda/core";
import { makeAutoObservable, runInAction } from "mobx";
import { sessionManager } from "../../managers/session.manager";
import { BlockEntry, blockService } from "../../services/block.service";
import { RecordEntry, RecordSearchRequest, recordService } from "../../services/record.service";

export enum RecordGroupType {
    None,
    ByCreator,
    ByBlock
}

export interface RecordGroup {
    type: RecordGroupType
    key: string
    title: string
    records: RecordEntry[]
    aggregated_updated_at: LocalDateTime
    shared_with: { full_name: string; address: string; avatar: string }[]
}

const { warn } = new Logger("dashboard-vm");

export class DashboardViewModel {
    constructor() {
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

    private async _groupByBlock(records: RecordEntry[]): Promise<RecordGroup[]> {
        const blocks: BlockEntry[] = await blockService.getBlocks();
        const groups: RecordGroup[] = blocks.map(block => (
            {
                key: block.hash,
                title: block.friendly_name,
                aggregated_updated_at: block.created_at,
                records: [],
                shared_with: [],
                type: RecordGroupType.ByBlock
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

        return [...groups].sort(
            (a, b) => a.aggregated_updated_at.compareTo(b.aggregated_updated_at)
        );
    }

    readonly loadRecords = new AsyncAction(async () => {
        if (!sessionManager.encryption)
            throw new Error("Can't load records without encryption provider.");

        const records = await recordService.searchRecords(
            this._recordSearchRequest,
            sessionManager.encryption
        );

        const groups = await this._groupByBlock(records);

        runInAction(() => {
            this._records = records;
            this._groups = groups;
        });
    });
}
