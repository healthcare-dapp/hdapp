import { AsyncAction } from "@hdapp/shared/web2-common/utils/async-action";
import { makeAutoObservable, runInAction } from "mobx";
import { DataPermissions } from "../../managers/access-control.manager";
import { SessionManager } from "../../managers/session.manager";
import { ProfileEntry } from "../../services/profile.service";
import { RecordsViewModel } from "./records.vm";

export class PatientsViewModel {
    private _profiles: (ProfileEntry & {
        vm: RecordsViewModel
        avatar_url?: string
    })[] = [];
    private _permissions: DataPermissions[] = [];

    constructor(private _sm: SessionManager) {
        makeAutoObservable(this);

        window.setInterval(() => {
            void this.loadPermissions.tryRun();
        }, 60 * 1000);
        void this.loadPermissions.tryRun();
    }

    get profiles() {
        const { web3 } = this._sm;

        return this._profiles.map(profile => ({
            ...profile,
            is_full_access: this._permissions
                .some(pp => `0x${pp.hash.toString(16)}` === web3.address && pp.user === profile.address),
        }));
    }

    readonly loadPermissions = new AsyncAction(async () => {
        const perms = await this._sm.accessControl.getDataPermissionsForOwner(this._sm.web3.address);
        runInAction(() => this._permissions = perms);
    });

    readonly loadProfiles = new AsyncAction(async () => {
        const { db, encryption, web3 } = this._sm;

        const entities = await db.profiles.searchProfiles({}, encryption);

        const profiles = await Promise.all(
            entities.filter(p => p.address !== web3.address)
                .map(async p => {
                    return {
                        ...p,
                        vm: new RecordsViewModel(p.address),
                        avatar_url: p.avatar_hash
                            ? URL.createObjectURL(
                                await db.files.getFileBlob(p.avatar_hash, encryption)
                            )
                            : void 0
                    };
                })
        );

        runInAction(() => { this._profiles = profiles; });

        await Promise.all(profiles.map(p => p.vm.loadRecords.tryRun()));
    });
}
