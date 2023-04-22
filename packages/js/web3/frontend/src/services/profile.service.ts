import { UserPublicProfileDto } from "@hdapp/shared/web2-common/dto/user/public-profile.dto";
import { autoBind } from "@hdapp/shared/web2-common/utils";
import { LocalDate, LocalDateTime } from "@js-joda/core";
import { EncryptionProvider } from "../utils/encryption.provider";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { DbService } from "./db.service";

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
    public_profile: UserPublicProfileDto | null
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
    public_profile: UserPublicProfileDto | null
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
    public_profile: UserPublicProfileDto | null
}

export interface ProfileSearchRequest {
    filters?: {
        query?: string | null
        full_name?: string | null
    }
    sort_by?: "full_name" | null
}

export class ProfileNotFoundError extends Error {}

const transformer = (provider: EncryptionProvider) => (dbEntry: ProfileDbEntry): ProfileEntry => {
    const encrypted: ProfileDbEntryEncryptedData = JSON.parse(
        provider.decrypt(dbEntry.encrypted)
    );

    return {
        address: dbEntry.address,
        full_name: encrypted.full_name,
        avatar_hash: encrypted.avatar_hash,
        gender: encrypted.gender,
        height: encrypted.height,
        weight: encrypted.weight,
        medical_organization_name: encrypted.medical_organization_name,
        blood_type: encrypted.blood_type,
        public_profile: encrypted.public_profile,
        birth_date: LocalDate.parse(encrypted.birth_date),
        updated_at: LocalDateTime.parse(encrypted.updated_at)
    };
};

const reverseTransformer = (provider: EncryptionProvider) => (entry: ProfileEntry): ProfileDbEntry => {
    const encrypted: ProfileDbEntryEncryptedData = {
        full_name: entry.full_name,
        avatar_hash: entry.avatar_hash,
        gender: entry.gender,
        height: entry.height,
        weight: entry.weight,
        medical_organization_name: entry.medical_organization_name,
        blood_type: entry.blood_type,
        public_profile: entry.public_profile,
        birth_date: entry.birth_date.toString(),
        updated_at: entry.updated_at.toString()
    };

    return {
        address: entry.address,
        encrypted: provider.encrypt(JSON.stringify(encrypted))
    };
};

export class ProfileService extends DbConsumer {
    protected readonly _storeName = "profiles";

    constructor(protected _db: DbService) {
        super("profile-service");

        autoBind(this);
    }

    async getProfile(hash: string, provider: EncryptionProvider): Promise<ProfileEntry> {
        try {
            const entity = await this._findOne(hash, transformer(provider));
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ProfileNotFoundError("Profile was not found.");

            throw e;
        }
    }

    async searchProfiles(request: ProfileSearchRequest, provider: EncryptionProvider): Promise<ProfileEntry[]> {
        try {
            const devices = await this._findMany(
                transformer(provider),
                entity => {
                    if (request.filters?.full_name && !entity.full_name.toLowerCase().trim()
                        .includes(request.filters.full_name.toLowerCase().trim()))
                        return false;
                    if (request.filters?.query && !entity.full_name.toLowerCase().trim()
                        .includes(request.filters.query.toLowerCase().trim()))
                        return false;
                    return true;
                }
            );
            return devices;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ProfileNotFoundError("Profile was not found.");

            throw e;
        }
    }

    async addProfile(address: string, form: ProfileForm, provider: EncryptionProvider): Promise<void> {
        try {
            await this._add({
                ...form,
                address,
                birth_date: form.birth_date,
                updated_at: LocalDateTime.now()
            }, reverseTransformer(provider));
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ProfileNotFoundError("Profile was not found.");

            throw e;
        }
    }

    async updateProfile(address: string, form: ProfileForm, provider: EncryptionProvider): Promise<void> {
        try {
            await this._patchOne(
                address,
                { ...form, updated_at: LocalDateTime.now() },
                transformer(provider),
                reverseTransformer(provider)
            );
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ProfileNotFoundError("Profile was not found.");

            throw e;
        }
    }

    async upsertProfile(record: ProfileEntry, provider: EncryptionProvider): Promise<void> {
        try {
            await this._upsertOne(record, reverseTransformer(provider));
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ProfileNotFoundError("Profile was not found.");

            throw e;
        }
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
