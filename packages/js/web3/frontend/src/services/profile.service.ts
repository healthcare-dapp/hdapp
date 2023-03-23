import { Logger } from "@hdapp/shared/web2-common/utils";
import { LocalDate, LocalDateTime } from "@js-joda/core";
import { makeAutoObservable } from "mobx";
import { EncryptionProvider } from "../utils/encryption.provider";
import { dbService, DbService, IDbConsumer } from "./db.service";

interface ProfileDbEntry {
    address: string
    encrypted: string
}

interface ProfileDbEntryEncryptedData {
    full_name: string
    birth_date: string
    updated_at: string
    gender: string | null
    blood_type: string | null
    height: number | null
    weight: number | null
    avatar_hash: string | null
    medical_organization_name: string | null
}

export interface ProfileEntry {
    address: string
    full_name: string
    birth_date: LocalDate
    updated_at: LocalDateTime
    gender: string | null
    blood_type: string | null
    height: number | null
    weight: number | null
    avatar_hash: string | null
    medical_organization_name: string | null
}

export interface ProfileForm {
    full_name: string
    birth_date: LocalDate
    gender: string | null
    blood_type: string | null
    height: number | null
    weight: number | null
    avatar_hash: string | null
    medical_organization_name: string | null
}

export interface ProfileSearchRequest {
    filters?: {
        query?: string | null
        full_name?: string | null
    }
    sort_by?: "full_name" | null
}

export class ProfileNotFoundError extends Error {}

export class ProfileService implements IDbConsumer {
    private readonly _storeName = "profiles";

    private readonly _logger = new Logger("profile-service");

    constructor(private _db: DbService) {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    private _transformDbEntryToEntry(dbEntry: ProfileDbEntry, encrypted: ProfileDbEntryEncryptedData): ProfileEntry {
        return {
            address: dbEntry.address,
            full_name: encrypted.full_name,
            avatar_hash: encrypted.avatar_hash,
            gender: encrypted.gender,
            height: encrypted.height,
            weight: encrypted.weight,
            medical_organization_name: encrypted.medical_organization_name,
            blood_type: encrypted.blood_type,
            birth_date: LocalDate.parse(encrypted.birth_date),
            updated_at: LocalDateTime.parse(encrypted.updated_at)
        };
    }

    getProfile(hash: string, provider: EncryptionProvider): Promise<ProfileEntry> {
        const tsn = this._db.transaction([this._storeName], "readonly");
        const dataStore = tsn.objectStore(this._storeName);
        const request: IDBRequest<ProfileDbEntry> = dataStore.get(hash);
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not find the requested profile's data.", { tsn, hash, request });
                    reject(new ProfileNotFoundError("Profile not found."));
                }
                try {
                    const decryptedResult: ProfileDbEntryEncryptedData = JSON.parse(provider.decrypt(request.result.encrypted));
                    resolve(this._transformDbEntryToEntry(request.result, decryptedResult));
                } catch (cause) {
                    this._logger.debug("Profile data could not be retrieved.", { tsn, hash, cause });
                    reject(
                        new Error("Profile data could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve device data.", { tsn, hash, request });
                reject(new Error("Could not retrieve device data."));
            });
        });
    }

    searchProfiles(sRequest: ProfileSearchRequest, provider: EncryptionProvider): Promise<ProfileEntry[]> {
        const tsn = this._db.transaction([this._storeName], "readonly");
        const dataStore = tsn.objectStore(this._storeName);
        const request = dataStore.openCursor();
        if (!request)
            return Promise.resolve([]);

        const entries: ProfileEntry[] = [];

        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result)
                    return resolve(entries);

                try {
                    const dbEntry: ProfileDbEntry = request.result.value;
                    const encrypted: ProfileDbEntryEncryptedData = JSON.parse(provider.decrypt(dbEntry.encrypted));
                    request.result.continue();
                    if (sRequest.filters?.full_name && !encrypted.full_name.toLowerCase().trim()
                        .includes(sRequest.filters.full_name.toLowerCase().trim()))
                        return;
                    if (sRequest.filters?.query && !encrypted.full_name.toLowerCase().trim()
                        .includes(sRequest.filters.query.toLowerCase().trim()))
                        return;
                    entries.push(this._transformDbEntryToEntry(dbEntry, encrypted));
                } catch (cause) {
                    this._logger.debug("Profile data could not be retrieved.", { tsn, cause });
                    reject(
                        new Error("Profile data could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve device data.", { tsn, request });
                reject(new Error("Could not retrieve device data."));
            });
        });
    }

    addProfile(address: string, form: ProfileForm, provider: EncryptionProvider): Promise<void> {
        const tsn = this._db.transaction([this._storeName], "readwrite");
        const dataStore = tsn.objectStore(this._storeName);
        const dataEntry: ProfileDbEntryEncryptedData = {
            ...form,
            birth_date: form.birth_date.toString(),
            updated_at: LocalDateTime.now().toString()
        };
        const encrypted = provider.encrypt(JSON.stringify(dataEntry));
        const dbEntry: ProfileDbEntry = {
            address,
            encrypted
        };
        const request: IDBRequest<IDBValidKey> = dataStore.add(dbEntry);
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not add a new profile.", { tsn, address, request });
                    reject(new ProfileNotFoundError("Profile not found."));
                    return;
                }

                resolve();
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not add a new profile.", { tsn, address, request });
                reject(new Error("Could not add a new profile."));
            });
        });
    }

    updateProfile(address: string, form: ProfileForm, provider: EncryptionProvider): Promise<void> {
        const tsn = this._db.transaction([this._storeName], "readwrite");
        const dataStore = tsn.objectStore(this._storeName);
        const dataEntry: ProfileDbEntryEncryptedData = {
            ...form,
            birth_date: form.birth_date.toString(),
            updated_at: LocalDateTime.now().toString()
        };
        const encrypted = provider.encrypt(JSON.stringify(dataEntry));
        const dbEntry: ProfileDbEntry = {
            address,
            encrypted
        };
        const request: IDBRequest<IDBValidKey> = dataStore.put(dbEntry);
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not update a new profile.", { tsn, address, request });
                    reject(new ProfileNotFoundError("Profile not found."));
                    return;
                }

                resolve();
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not update a new profile.", { tsn, address, request });
                reject(new Error("Could not update a new profile."));
            });
        });
    }

    onDbUpgrade(db: IDBDatabase): void {
        const metadataStore = db.createObjectStore(
            this._storeName,
            { keyPath: "address" }
        );

        metadataStore.createIndex("address", "address", { unique: true });
        metadataStore.createIndex("encrypted", "encrypted", { unique: false });
    }
}

export const profileService = new ProfileService(dbService);
dbService.addConsumer(profileService);
