import { AppointmentService } from "../services/appointment.service";
import { BlockService } from "../services/block.service";
import { ChatMessageService } from "../services/chat-message.service";
import { ChatService } from "../services/chat.service";
import { DbService } from "../services/db.service";
import { DeviceService } from "../services/device.service";
import { EventLogService } from "../services/event-log.service";
import { FileService } from "../services/file.service";
import { ProfileService } from "../services/profile.service";
import { RecordNoteService } from "../services/record-note.service";
import { RecordService } from "../services/record.service";
import { Web3Manager } from "./web3.manager";

export class DbManager {
    private _db: DbService;
    private _isReady = false;

    readonly appointments: AppointmentService;
    readonly blocks: BlockService;
    readonly chatMessages: ChatMessageService;
    readonly chats: ChatService;
    readonly devices: DeviceService;
    readonly eventLogs: EventLogService;
    readonly files: FileService;
    readonly profiles: ProfileService;
    readonly recordNotes: RecordNoteService;
    readonly records: RecordService;

    constructor(private _web3: Web3Manager) {
        this._db = new DbService(this._web3.address);

        this.appointments = this._db.addConsumer(new AppointmentService(this._db));
        this.blocks = this._db.addConsumer(new BlockService(this._db));
        this.chatMessages = this._db.addConsumer(new ChatMessageService(this._db));
        this.chats = this._db.addConsumer(new ChatService(this._db));
        this.devices = this._db.addConsumer(new DeviceService(this._db));
        this.eventLogs = this._db.addConsumer(new EventLogService(this._db));
        this.files = this._db.addConsumer(new FileService(this._db));
        this.profiles = this._db.addConsumer(new ProfileService(this._db));
        this.recordNotes = this._db.addConsumer(new RecordNoteService(this._db));
        this.records = this._db.addConsumer(new RecordService(this._db));
    }

    get isReady() {
        return this._isReady;
    }

    get service() {
        return this._db;
    }
}
