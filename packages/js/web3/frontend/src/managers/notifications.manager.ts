import { Instant } from "@js-joda/core";
import { MD5 } from "crypto-js";
import { makeAutoObservable } from "mobx";
import { EncryptionProvider } from "../utils/encryption.provider";

export enum Urgency {
    LOW = -1,
    NORMAL,
    HIGH
}

interface ConnectionEstablishedNotificationItem {
    type: "connection_established"
    deviceName: string
    user: string
}

interface RecordPermissionsGrantedNotificationItem {
    type: "record_permissions_granted"
    ownerName: string
    recordHash: string
    expiresIn: number
}

interface UserConnectionRequestedNotificationItem {
    type: "user_connection_requested"
    userAddress: string
}

interface UserConnectionCreatedNotificationItem {
    type: "user_connection_created"
    userAddress: string
}

interface NotificationBaseItem {
    hash?: string
    created_at: Instant
    urgency: Urgency
}

type NotificationItem = NotificationBaseItem
& (
    ConnectionEstablishedNotificationItem
    | RecordPermissionsGrantedNotificationItem
    | UserConnectionRequestedNotificationItem
    | UserConnectionCreatedNotificationItem
);

export class NotificationsManager {
    private _notifications: NotificationItem[] = [];

    constructor(
        private _encryption: EncryptionProvider
    ) {
        makeAutoObservable(this);
    }

    get array() {
        return [...this._notifications]
            .sort((a, b) => a.created_at.compareTo(b.created_at));
    }

    push(item: NotificationItem) {
        const hash = MD5(JSON.stringify(item)).toString();

        this._notifications.push({ ...item, hash });
    }
}
