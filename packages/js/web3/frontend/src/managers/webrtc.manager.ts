import { getRightOrFail } from "@hdapp/shared/web2-common/io-ts-utils/get-right";
import { Logger } from "@hdapp/shared/web2-common/utils";
import * as HDMHandshake from "@hdapp/solidity/webrtc-broker/HDMHandshake";
import { LocalDateTime } from "@js-joda/core";
import { AES, enc } from "crypto-js";
import { ethers, toUtf8Bytes } from "ethers";
import {
    any,
    AnyType,
    array,
    boolean,
    intersection,
    literal,
    Mixed,
    number,
    string,
    type,
    TypeOf,
    union,
} from "io-ts";
import { makeAutoObservable } from "mobx";
import { blockService } from "../services/block.service";
import { chatMessageService } from "../services/chat-message.service";
import { chatService } from "../services/chat.service";
import { dbService } from "../services/db.service";
import { DeviceEntry, deviceService } from "../services/device.service";
import { eventLogService } from "../services/event-log.service";
import { fileService } from "../services/file.service";
import { profileService } from "../services/profile.service";
import { recordNoteService } from "../services/record-note.service";
import { recordService } from "../services/record.service";
import { EncryptionProvider } from "../utils/encryption.provider";
import { trimWeb3Address } from "../utils/trim-web3-address";
import { Web3Manager } from "./web3.manager";

export type BrokerMessageData = {
    type: "ping"
} | {
    type: "candidate"
    candidate: RTCIceCandidateInit
} | {
    type: "description"
    description: RTCSessionDescriptionInit
};

const { debug, error, warn } = new Logger("webrtc-manager");

export const IPeerMessage = <T extends string, D extends Mixed>(
    typeName: T,
    dataType: D
) => type({
    type: literal(typeName),
    data: dataType
});

export const PeerMessageShowCurrentState = IPeerMessage(
    "SHOW_CURRENT_STATE",
    type({
        dbRecords: array(string),
        files: array(string),
    })
);
export type PeerMessageShowCurrentState = TypeOf<typeof PeerMessageShowCurrentState>;

export const PeerMessageSyncSummary = IPeerMessage(
    "SYNC_SUMMARY",
    type({
        dbRecordsCount: number,
        fileRecordsCount: number,
    })
);
export type PeerMessageSyncSummary = TypeOf<typeof PeerMessageSyncSummary>;

export const PeerMessageSyncDbRecordsChunk = IPeerMessage(
    "SYNC_DB_RECORDS_CHUNK",
    type({
        recordsRemainingCount: number,
        records: array(any)
    })
);
export type PeerMessageSyncDbRecordsChunk = TypeOf<typeof PeerMessageSyncDbRecordsChunk>;

export const PeerMessageSyncFileChunk = IPeerMessage(
    "SYNC_FILE_CHUNK",
    type({
        hash: string,
        start: number,
        hasEnded: boolean,
        data: new AnyType()
    })
);
export type PeerMessageSyncFileChunk = TypeOf<typeof PeerMessageSyncFileChunk>;

export const PeerMessageSyncRequested = IPeerMessage(
    "SYNC_REQUESTED",
    type({})
);
export type PeerMessageSyncRequested = TypeOf<typeof PeerMessageSyncRequested>;

export const PeerMessageSyncFinished = IPeerMessage(
    "SYNC_FINISHED",
    type({})
);
export type PeerMessageSyncFinished = TypeOf<typeof PeerMessageSyncFinished>;

export const PeerMessage = union([
    PeerMessageShowCurrentState,
    PeerMessageSyncSummary,
    PeerMessageSyncDbRecordsChunk,
    PeerMessageSyncFileChunk,
    PeerMessageSyncRequested,
    PeerMessageSyncFinished
]);
export type PeerMessage = TypeOf<typeof PeerMessage>;

export const PeerMessageSigned = intersection([
    PeerMessage,
    type({
        signature: string
    })
]);
export type PeerMessageSigned = TypeOf<typeof PeerMessageSigned>;

export class Peer {
    #device: DeviceEntry;
    private _dataChannel: RTCDataChannel | null = null;
    private _peerConnection: RTCPeerConnection | null = null;
    private _isMakingOffer = false;
    private _isIgnoringOffer = false;
    private _isSrdAnswerPending = false;
    private _isSyncing = false;
    private _chatSyncTimeout: number | null = null;

    constructor(
        device: DeviceEntry,
        private _manager: WebRTCManager,
        private readonly _isPolite: boolean
    ) {
        this.#device = device;

        this._initPeerConnection();

        // the polite side initiates the data channel
        if (_isPolite) {
            this._initDataChannel();
        }
    }

    get deviceHash() {
        return this.#device.hash;
    }

    get deviceOwnedBy() {
        return this.#device.owned_by;
    }

    get isConnecting() {
        return this._peerConnection?.connectionState === "connecting";
    }

    dispose() {
        this._dataChannel?.close();
        this._dataChannel = null;

        this._peerConnection?.close();
        this._peerConnection = null;
    }

    async addIceCandidate(candidate: RTCIceCandidateInit) {
        if (!this._peerConnection)
            throw new Error("no peer connection");

        try {
            await this._peerConnection.addIceCandidate(candidate);
        } catch (err) {
            if (!this._isIgnoringOffer) {
                throw err;
            }
        }
    }

    async provideDescription(description: RTCSessionDescriptionInit) {
        if (!this._peerConnection)
            throw new Error("no peer connection");

        const isStable = this._peerConnection.signalingState === "stable"
            || (this._peerConnection.signalingState === "have-local-offer" && this._isSrdAnswerPending);

        this._isIgnoringOffer = !this._isPolite
            && description.type === "offer"
            && (
                this._isMakingOffer
                || !isStable
            );

        if (this._isIgnoringOffer) {
            debug("ignoring offer");
            return;
        }

        this._isSrdAnswerPending = description.type === "offer";

        await this._peerConnection.setRemoteDescription(description);

        this._isSrdAnswerPending = false;

        if (description.type === "offer") {
            await this._peerConnection.setLocalDescription();

            this._manager.send(this.#device, {
                type: "description",
                description: this._peerConnection.localDescription!.toJSON()
            });
        }
    }

    private async _handleMessage(event: MessageEvent<unknown>) {
        debug("Received message", event);
        if (typeof event.data !== "string")
            throw new Error("who?");

        const msg = getRightOrFail(
            PeerMessageSigned.decode(JSON.parse(event.data))
        );

        const dataStr = JSON.stringify(msg.data);

        if (ethers.verifyMessage(dataStr, msg.signature) !== this.#device.owned_by)
            return warn("Attempted to identify with a non-matching signature", msg);

        switch (msg.type) {
            case "SHOW_CURRENT_STATE":
                void this._handleShowCurrentState(msg);
                break;
            case "SYNC_DB_RECORDS_CHUNK":
                void this._handleDbRecordsChunk(msg);
                break;
            case "SYNC_FILE_CHUNK":
                void this._handleFileChunk(msg);
                break;
            case "SYNC_SUMMARY":
                this._isSyncing = true;
                debug("SYNC_SUMMARY", msg.data);
                break;
            case "SYNC_REQUESTED":
                void this.sync();
                debug("SYNC_REQUESTED", msg.data);
                break;
            case "SYNC_FINISHED":
                await eventLogService.addEventLog({
                    created_by: this._manager.web3Address,
                    description: "Sync with user " + trimWeb3Address(this.#device.owned_by) + "has been completed.",
                    title: "Sync complete",
                    related_entities: [
                        {
                            type: "device",
                            value: this.#device.hash
                        },
                        {
                            type: "profile",
                            value: this._manager.web3Address
                        },
                        {
                            type: "profile",
                            value: this.#device.owned_by
                        },
                    ]
                }).catch(() => null);
                window.setTimeout(() => {
                    this._isSyncing = false;
                }, 2000);

                this._chatSyncTimeout && clearTimeout(this._chatSyncTimeout);
                this._chatSyncTimeout = window.setTimeout(async () => {
                    const chats = await chatService.searchChats({});
                    const profiles = await profileService.searchProfiles({}, this._manager.encryption);
                    for (const profile of profiles) {
                        if (profile.address === this._manager.web3Address)
                            return;

                        const chat = chats.find(c => c.participant_ids.length === 2
                            && c.participant_ids.includes(this._manager.web3Address)
                            && c.participant_ids.includes(profile.address));
                        if (!chat)
                            await chatService.addChat({
                                participant_ids: [this._manager.web3Address, profile.address],
                                friendly_name: ""
                            });
                    }
                }, 5000);
                break;
        }
    }

    private _filesInProgress = new Map<string, Uint8Array>();

    private async _handleFileChunk(msg: PeerMessageSyncFileChunk) {
        if (!this._filesInProgress.has(msg.data.hash)) {
            const metadata = await fileService.getFileMetadata(msg.data.hash);
            this._filesInProgress.set(msg.data.hash, new Uint8Array(metadata.byte_length));
        }

        const arr = this._filesInProgress.get(msg.data.hash)!;
        console.log(arr, msg.data);
        arr.set(msg.data.data as number[], msg.data.start);
        this._filesInProgress.set(msg.data.hash, arr);
        if (msg.data.hasEnded) {
            await fileService.upsertFileBlob(msg.data.hash, new Blob([arr]), this._manager.encryption);
        }
    }

    private _handleDbRecordsChunk(msg: PeerMessageSyncDbRecordsChunk) {
        for (const record of msg.data.records) {
            debug("Received db record", record);
            switch (record.__type) {
                case "record":
                    void recordService.upsertRecord(record, this._manager.encryption);
                    break;
                case "device":
                    void deviceService.upsertDevice(record, this._manager.encryption);
                    break;
                case "profile":
                    void profileService.upsertProfile(record, this._manager.encryption);
                    break;
                case "chat":
                    void chatService.upsertChat(record);
                    break;
                case "file":
                    void fileService.upsertFileMetadata(record);
                    this._filesInProgress.set(record.hash, new Uint8Array(record.byte_length));
                    break;
                case "block":
                    void blockService.upsertBlock(record);
                    break;
                case "chatMessage":
                    void chatMessageService.upsertChatMessage(record, this._manager.encryption);
                    break;
                case "recordNote":
                    void recordNoteService.upsertRecordNote(record, this._manager.encryption);
                    break;
                case "eventLog":
                    void eventLogService.upsertEventLog(record);
                    break;
            }
        }
    }

    private async _handleShowCurrentState(msg: PeerMessageShowCurrentState) {
        const devices = await deviceService.getDevicesOwnedBy(this._manager.web3Address, this._manager.encryption);
        const records = await recordService.searchRecords({}, this._manager.encryption);
        const profiles = await profileService.searchProfiles({}, this._manager.encryption);
        const blocks = await blockService.getBlocks();
        const chats = await chatService.searchChats({});
        const chatMessages = await chatMessageService.searchChatMessages({}, this._manager.encryption);
        const recordNotes = await recordNoteService.getRecordNotes(this._manager.encryption);
        const files = await fileService.getFiles();
        const eventLogs = await eventLogService.getEventLogs();

        const dbRecordsToSend = [
            ...devices.map(d => ({ ...d, __type: "device" })),
            ...records.map(d => ({ ...d, __type: "record" }))
                .filter(d => !msg.data.dbRecords.includes(d.hash)),
            ...profiles.map(d => ({ ...d, __type: "profile" })),
            ...chats.map(d => ({ ...d, __type: "chat" }))
                .filter(d => !msg.data.dbRecords.includes(d.hash)),
            ...files.map(d => ({ ...d, __type: "file" }))
                .filter(d => !msg.data.dbRecords.includes(d.hash)),
            ...blocks.map(d => ({ ...d, __type: "block" }))
                .filter(d => !msg.data.dbRecords.includes(d.hash)),
            ...chatMessages.map(d => ({ ...d, __type: "chatMessage" }))
                .filter(d => !msg.data.dbRecords.includes(d.hash)),
            ...recordNotes.map(d => ({ ...d, __type: "recordNote" }))
                .filter(d => !msg.data.dbRecords.includes(d.hash)),
            ...eventLogs.map(d => ({ ...d, __type: "eventLog" }))
                .filter(d => !msg.data.dbRecords.includes(d.hash)),
        ];

        await this._sendMessage("SYNC_SUMMARY", {
            dbRecordsCount: dbRecordsToSend.length,
            fileRecordsCount: files.length,
        });

        const maxChunkSize = 8; // 8 elements
        for (let i = 0; i < Math.ceil(dbRecordsToSend.length / maxChunkSize); i++) {
            const chunk = dbRecordsToSend.slice(maxChunkSize * i, maxChunkSize * (i + 1));

            await this._sendMessage("SYNC_DB_RECORDS_CHUNK", {
                recordsRemainingCount: dbRecordsToSend.length - maxChunkSize * (i + 1),
                records: chunk
            });
        }

        const fileBlobs = files
            .filter(d => !msg.data.files.includes(d.hash));

        for (const file of fileBlobs) {
            const blob = await fileService.getFileBlob(file.hash, this._manager.encryption);
            const ab = await blob.arrayBuffer();
            const maxChunkSize = 8 * 1024; // 8KB
            const chunksCount = Math.ceil(blob.size / maxChunkSize);
            for (let chunkIndex = 0; chunkIndex < chunksCount; chunkIndex++) {
                const chunk = ab.slice(chunkIndex * maxChunkSize, (chunkIndex + 1) * maxChunkSize);

                await this._sendMessage("SYNC_FILE_CHUNK", {
                    data: Array.from(new Uint8Array(chunk)),
                    hasEnded: chunkIndex === chunksCount - 1,
                    hash: file.hash,
                    start: chunkIndex * maxChunkSize
                });
            }
        }

        await this._sendMessage("SYNC_FINISHED", {});
    }

    private _initPeerConnection() {
        const pc = this._peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        "stun:stun.fitauto.ru:3478",
                    ]
                }, {
                    urls: ["stun:fr-turn1.xirsys.com"]
                }, {
                    username: "BmMvwO5UEaaJ_QO5_HEnpVjJ-_0wjaKFatkI14PBirFHB0qvJUGrrpLTs-14oUsXAAAAAGQfN2NydXNsYW5nMDI=",
                    credential: "50b7e4e4-cb37-11ed-8a9e-0242ac120004",
                    urls: [
                        //"turn:fr-turn1.xirsys.com:80?transport=udp",
                        "turn:fr-turn1.xirsys.com:3478?transport=udp",
                        //"turn:fr-turn1.xirsys.com:80?transport=tcp",
                        "turn:fr-turn1.xirsys.com:3478?transport=tcp",
                        //"turns:fr-turn1.xirsys.com:443?transport=tcp",
                        "turns:fr-turn1.xirsys.com:5349?transport=tcp"
                    ]
                }]
        });

        pc.addEventListener("negotiationneeded", async () => {
            debug("negotiationneeded", pc);

            try {
                this._isMakingOffer = true;
                await pc.setLocalDescription();
                if (!pc.localDescription)
                    throw new Error("no local connection?");

                this._manager.send(this.#device, {
                    type: "description",
                    description: pc.localDescription.toJSON()
                });
            } catch (err) {
                error(err);
            } finally {
                this._isMakingOffer = false;
            }
        });

        pc.addEventListener("icecandidate", event => {
            debug("Local ICE candidate: ", event.candidate);

            if (event.candidate === null)
                return;

            this._manager.send(this.#device, {
                type: "candidate",
                candidate: event.candidate.toJSON()
            });
        });
        pc.addEventListener("iceconnectionstatechange", () => {
            debug("iceconnectionstatechange", pc.iceConnectionState);

            if (pc.iceConnectionState === "failed") {
                pc.restartIce();
            }
        });

        pc.addEventListener("datachannel", event => {
            debug("remote initialized datachannel", event.channel);
            this._initDataChannel(event.channel);
        });

        pc.addEventListener("connectionstatechange", event => {
            debug("connectionstatechange", pc.connectionState, event);

            void deviceService.patchDevice(
                this.#device.hash,
                { last_active_at: LocalDateTime.now() },
                this._manager.encryption
            );

            if (pc.connectionState === "disconnected") {
                this._manager.disposePeer(this.#device.hash);
            }
        });

        pc.addEventListener("icecandidateerror", e => {
            debug("icecandidateerror", pc, e);
        });

        pc.addEventListener("track", event => {
            debug("track", pc, event);
        });

        pc.addEventListener("icegatheringstatechange", event => {
            debug("icegatheringstatechange", pc.iceGatheringState, event);
            /*
            if (pc.iceGatheringState === "complete")
                this._manager.dropQueue("candidate"); */
        });

        pc.addEventListener("signalingstatechange", event => {
            debug("signalingstatechange", pc.signalingState, event);

            if (pc.signalingState === "stable")
                this._manager.dropQueue("description");
        });
    }

    private _initDataChannel(channel?: RTCDataChannel) {
        if (!this._peerConnection)
            throw new Error("no peer connection");

        const sendChannel = channel ?? this._peerConnection.createDataChannel("data");
        sendChannel.binaryType = "arraybuffer";

        sendChannel.addEventListener("open", () => {
            debug("data channel opened", sendChannel);
            void this.sync();
        });
        sendChannel.addEventListener(
            "message",
            msg => this._handleMessage(msg)
        );
        sendChannel.addEventListener("close", () => {
            debug("data channel closed", sendChannel);
        });
        sendChannel.addEventListener("error", () => {
            debug("data channel errored", sendChannel);
        });

        this._dataChannel = sendChannel;
    }

    async requestSync() {
        await this._sendMessage("SYNC_REQUESTED", {});
    }

    async sync() {
        if (this._isSyncing)
            return;

        this._isSyncing = true;
        debug("sending showcurrentstate", this.#device);

        const records = await recordService.searchRecords({}, this._manager.encryption);
        const blocks = await blockService.getBlocks();
        const chats = await chatService.searchChats({});
        const chatMessages = await chatMessageService.searchChatMessages({}, this._manager.encryption);
        const recordNotes = await recordNoteService.getRecordNotes(this._manager.encryption);
        const files = await fileService.getFiles();
        const eventLogs = await eventLogService.getEventLogs();

        await this._sendMessage("SHOW_CURRENT_STATE", {
            files: files.map(d => d.hash),
            dbRecords: [
                ...records.map(d => d.hash),
                ...blocks.map(d => d.hash),
                ...chats.map(d => d.hash),
                ...chatMessages.map(d => d.hash),
                ...recordNotes.map(d => d.hash),
                ...eventLogs.map(d => d.hash),
                ...files.map(d => d.hash),
            ],
        });
    }

    private async _sendMessage<T extends PeerMessage["type"]>(typeString: T, data: Extract<PeerMessage, { type: T }>["data"]) {
        if (!this._dataChannel)
            throw new Error("no data channel");

        debug("sending message", typeString, data);

        const signed = {
            type: typeString,
            data,
            signature: await this._manager.signMessage(JSON.stringify(data))
        } as PeerMessageSigned;

        this._dataChannel.send(
            JSON.stringify(signed)
        );
    }
}

export class WebRTCManager {
    private _peers = new Map<string, Peer>();
    private _waitingPongDevices: string[] = [];

    private _web3TransactionQueue: [string, string][] = [];
    private _isProcessingWeb3TransactionQueue = false;

    constructor(
        private _web3: Web3Manager,
        private _encryption: EncryptionProvider
    ) {
        makeAutoObservable(this);

        void this._bindWeb3Events();

        /* dbService.on("txn_completed", (stores: string[]) => {
            if (stores.includes("devices"))
                void this._bindWeb3Events();
        }); */
        let timeout: number | undefined;

        dbService.on("txn_completed", (stores: string[]) => {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => {
                this._peers.forEach(peer => {
                    void peer.requestSync();
                });
            }, 500);
        });
    }

    get encryption() {
        return this._encryption;
    }

    get waitingDevices() {
        return this._waitingPongDevices;
    }

    get onlinePeerAddresses() {
        return this.peers.map(p => p.deviceOwnedBy)
            .filter((a, i, arr) => arr.indexOf(a) === i);
    }

    get onlinePeerDevices() {
        return this.peers.map(p => p.deviceHash)
            .filter((a, i, arr) => arr.indexOf(a) === i);
    }

    get peers() {
        return [...this._peers.values()];
    }

    get web3Address() {
        return this._web3.address;
    }

    disposePeer(hash: string) {
        const peer = this._peers.get(hash);
        if (peer)
            peer.dispose();

        this._peers.delete(hash);
    }

    signMessage(message: string): Promise<string> {
        return this._web3.signer.signMessage(message);
    }

    private async _bindWeb3Events() {
        void this._web3.webRtcBroker.removeAllListeners();

        const devices = await deviceService.getDevicesNotOwnedBy(this._web3.address, this._encryption);

        console.log(devices);

        for (const device of devices) {
            // @ts-ignore
            void this._web3.webRtcBroker.on(
                this._web3.webRtcBroker.filters.Message(void 0, device.hash),
                this._handleBrokerMessage
            );
        }
    }

    private readonly _handleBrokerMessage = async (event: HDMHandshake.MessageEvent.Log) => {
        if (event.args.sender === this._web3.address)
            return;
        debug("received broker message", event);

        const deviceHash = "0x" + event.args.deviceHash.toString(16);
        const device = await deviceService.getDevice(deviceHash, this._encryption)
            .catch(() => null);

        if (!device)
            return warn("could not find device", deviceHash);

        this._waitingPongDevices.splice(this._waitingPongDevices.indexOf(device.hash), 1);

        if (device.owned_by !== event.args.sender)
            return warn("message from broker mentions device hash not owned by the user", { device, event });

        let peer = this._peers.get(deviceHash);

        const txn = await event.getTransaction();
        const txnDescription = this._web3.webRtcBroker.interface.parseTransaction(txn);
        const encryptedChunks: string[] = JSON.parse(ethers.toUtf8String(txnDescription!.args[1]));

        for (const chunk of encryptedChunks) {
            try {
                const json = AES.decrypt(chunk, device.private_key)
                    .toString(enc.Utf8);
                const data: BrokerMessageData = JSON.parse(json);

                if (peer && data.type === "ping") {
                    peer.dispose();
                    this._peers.delete(device.hash);
                }

                if (!peer) {
                    peer = new Peer(device, this, data.type === "ping");
                    this._peers.set(device.hash, peer);
                }

                debug("received broker message", { peer, data });

                switch (data.type) {
                    case "candidate":
                        void peer.addIceCandidate(data.candidate);
                        break;
                    case "description":
                        void peer.provideDescription(data.description);
                        break;
                }
            } catch (e) {
                error(e);
            }
        }
    };
    private async _processWeb3TransactionQueue() {
        this._isProcessingWeb3TransactionQueue = true;
        await new Promise(r => setTimeout(r, 500));
        const [deviceHash] = this._web3TransactionQueue[0]!;
        const groupedData = this._web3TransactionQueue.flatMap(
            ([hash, data]) => deviceHash === hash ? data : []
        );

        this._web3TransactionQueue = this._web3TransactionQueue
            .filter(d => !groupedData.includes(d[1]));

        debug("Sending to handshake SC", { deviceHash, groupedData });
        const response: ethers.TransactionResponse = await this._web3.webRtcBroker.send(
            deviceHash,
            toUtf8Bytes(JSON.stringify(groupedData))
        );
        await response.wait(1);

        this._isProcessingWeb3TransactionQueue = false;

        if (this._web3TransactionQueue.length)
            void this._processWeb3TransactionQueue();
    }

    dropQueue(msgType: BrokerMessageData["type"]) {
        this._web3TransactionQueue = this._web3TransactionQueue
            .filter(([t]) => t !== msgType);
    }

    send(device: DeviceEntry, data: BrokerMessageData) {
        const json = JSON.stringify(data);
        const encoded = AES.encrypt(json, device.private_key).toString();

        this._web3TransactionQueue.push([device.hash, encoded]);

        if (!this._isProcessingWeb3TransactionQueue)
            void this._processWeb3TransactionQueue();
    }

    async start() {
        const devices = await deviceService.getDevicesNotOwnedBy(
            this._web3.address,
            this._encryption
        );

        for (const device of devices) {
            this.send(device, { type: "ping" });
            this._waitingPongDevices.push(device.hash);
        }
    }
}
