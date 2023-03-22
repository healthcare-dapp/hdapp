import { getRightOrFail } from "@hdapp/shared/web2-common/io-ts-utils/get-right";
import { Logger } from "@hdapp/shared/web2-common/utils";
import * as HDMHandshake from "@hdapp/solidity/webrtc-broker/HDMHandshake";
import { Instant } from "@js-joda/core";
import { AES, enc } from "crypto-js";
import { ethers, toUtf8Bytes } from "ethers";
import {
    any,
    array,
    intersection,
    literal,
    Mixed,
    number,
    string,
    type,
    TypeOf,
    union,
    unknown,
} from "io-ts";
import { DeviceEntry, deviceService } from "../services/device.service";
import { fileService } from "../services/file.service";
import { profileService } from "../services/profile.service";
import { recordService } from "../services/record.service";
import { EncryptionProvider } from "../utils/encryption.provider";
import { Web3Manager } from "./web3.manager";

export type BrokerMessageData = {
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
        records: array(string),
        devices: array(string),
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

export const PeerMessageSyncDbRecordsChunk = IPeerMessage(
    "SYNC_DB_RECORDS_CHUNK",
    type({
        recordsRemainingCount: number,
        records: array(any)
    })
);

export const PeerMessageSyncFileChunk = IPeerMessage(
    "SYNC_FILE_CHUNK",
    type({
        hash: string,
        start: number,
        end: number,
        data: unknown
    })
);

export const PeerMessage = union([
    PeerMessageShowCurrentState,
    PeerMessageSyncSummary,
    PeerMessageSyncDbRecordsChunk,
    PeerMessageSyncFileChunk
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

    private _handleMessage(event: MessageEvent<unknown>) {
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
                debug("SYNC_DB_RECORDS_CHUNK", msg.data);
                break;
            case "SYNC_FILE_CHUNK":
                debug("SYNC_FILE_CHUNK", msg.data);
                break;
            case "SYNC_SUMMARY":
                debug("SYNC_SUMMARY", msg.data);
                break;
        }
    }

    private async _handleShowCurrentState(_msg: PeerMessageShowCurrentState) {
        const devices = await deviceService.getDevicesOwnedBy(this._manager.web3Address, this._manager.encryption);
        const records = await recordService.searchRecords({}, this._manager.encryption);
        const profiles = await profileService.searchProfiles({}, this._manager.encryption);
        const files = await fileService.getFiles();

        const dbRecordsToSend = [
            ...devices.map(d => ({ ...d, __type: "device" })),
            ...records.map(d => ({ ...d, __type: "record" })),
            ...profiles.map(d => ({ ...d, __type: "profile" }))
        ];

        await this._sendMessage("SYNC_SUMMARY", {
            dbRecordsCount: dbRecordsToSend.length,
            fileRecordsCount: files.length,
        });

        for (const file of files) {
            const blob = await fileService.getFileBlob(file.hash, this._manager.encryption);
            const ab = await blob.arrayBuffer();
            const maxChunkSize = 8 * 1024; // 8KB
            const chunksCount = Math.ceil(blob.size / maxChunkSize);
            for (let chunkIndex = 0; chunkIndex < chunksCount; chunkIndex++) {
                const chunk = ab.slice(chunkIndex * maxChunkSize, (chunkIndex + 1) * maxChunkSize);

                await this._sendMessage("SYNC_FILE_CHUNK", {
                    data: chunk,
                    end: chunkIndex * maxChunkSize + chunk.byteLength,
                    hash: file.hash,
                    start: chunkIndex * maxChunkSize
                });
            }
        }

        const maxChunkSize = 8; // 8 elements
        for (let i = 0; i < Math.ceil(dbRecordsToSend.length / maxChunkSize); i++) {
            const chunk = dbRecordsToSend.slice(maxChunkSize * i, maxChunkSize * (i + 1));

            await this._sendMessage("SYNC_DB_RECORDS_CHUNK", {
                recordsRemainingCount: dbRecordsToSend.length - maxChunkSize * (i + 1),
                records: chunk
            });
        }
    }

    private _initPeerConnection() {
        const pc = this._peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        "stun:stun.fitauto.ru:3478",
                    ]
                },
            ]
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
            if (pc.connectionState === "connected") {
                void this._showCurrentState();
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

    private async _showCurrentState() {
        debug("sending showcurrentstate", this.#device);

        const devices = await deviceService.getDevicesOwnedBy(this._manager.web3Address, this._manager.encryption);
        const records = await recordService.searchRecords({}, this._manager.encryption);

        await this._sendMessage("SHOW_CURRENT_STATE", {
            devices: devices.map(d => d.hash),
            records: records.map(d => d.hash),
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

    private _web3TransactionQueue: [string, string][] = [];
    private _isProcessingWeb3TransactionQueue = false;

    constructor(
        private _web3: Web3Manager,
        private _encryption: EncryptionProvider
    ) {
        void this._bindWeb3Events();
    }

    get encryption() {
        return this._encryption;
    }

    get web3Address() {
        return this._web3.address;
    }

    signMessage(message: string): Promise<string> {
        return this._web3.signer.signMessage(message);
    }

    private async _bindWeb3Events() {
        const devices = await deviceService.getDevicesNotOwnedBy(this._web3.address, this._encryption);

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

        const deviceHash = "0x" + event.args.deviceHash.toString(16);
        const device = await deviceService.getDevice(deviceHash, this._encryption)
            .catch(() => null);

        if (!device)
            return warn("could not find device", deviceHash);

        if (device.owned_by !== event.args.sender)
            return warn("message from broker mentions device hash not owned by the user", { device, event });

        if (!this._peers.has(deviceHash)) {
            this._peers.set(
                deviceHash,
                new Peer(device, this, false)
            );
        }

        const peer = this._peers.get(deviceHash)!;

        const txn = await event.getTransaction();
        const txnDescription = this._web3.webRtcBroker.interface.parseTransaction(txn);
        const encryptedChunks: string[] = JSON.parse(ethers.toUtf8String(txnDescription!.args[1]));

        for (const chunk of encryptedChunks) {
            try {
                const json = AES.decrypt(chunk, device.private_key)
                    .toString(enc.Utf8);
                const data: BrokerMessageData = JSON.parse(json);

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
            this._peers.set(
                device.hash,
                new Peer(device, this, true)
            );
        }
    }
}
