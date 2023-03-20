import { Instant } from "@js-joda/core";
import { makeAutoObservable } from "mobx";

export enum Urgency {
    LOW = -1,
    NORMAL,
    HIGH
}

interface UserConnectionRequestedNotificationItem {
    type: "user_connection_requested"
    user: string
}

interface NotificationBaseItem {
    created_at: Instant
    urgency: Urgency
}

type NotificationItem = NotificationBaseItem
& UserConnectionRequestedNotificationItem;

export class NotificationsManager {
    private _notifications: NotificationItem[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    get array() {
        return [...this._notifications]
            .sort((a, b) => a.created_at.compareTo(b.created_at));
    }

    push(item: NotificationItem) {
        this._notifications.push(item);
    }
}
