import { getRightOrFail } from "@hdapp/shared/web2-common/io-ts-utils/get-right";
import { Logger } from "@hdapp/shared/web2-common/utils";
import * as HDMHandshake from "@hdapp/solidity/webrtc-broker/HDMHandshake";
import { Instant } from "@js-joda/core";
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
} from "io-ts";
import { DeviceEntry, deviceService } from "../services/device.service";
import { recordService } from "../services/record.service";
import { EncryptionProvider } from "../utils/encryption.provider";
import { Web3Manager } from "./web3.manager";

export type BrokerMessageData = {
    type: "candidate"
    candidate: RTCIceCandidate
} | {
    type: "description"
    description: RTCSessionDescription
};

const { debug, error, warn } = new Logger("webrtc-manager");

export const IPeerMessage = <T extends string, D extends Mixed>(
    typeName: T,
    dataType: D
) => type({
    type: literal(typeName),
    data: dataType
});

export const PeerMessageIdentify = IPeerMessage(
    "IDENTIFY",
    type({
        address: string,
        timestamp: number,
    })
);
export type PeerMessageIdentify = TypeOf<typeof PeerMessageIdentify>;

export const PeerMessageListDevices = IPeerMessage(
    "LIST_DEVICES",
    array(string)
);
export type PeerMessageListDevices = TypeOf<typeof PeerMessageListDevices>;

export const PeerMessageSelectDevice = IPeerMessage(
    "SELECT_DEVICE",
    string
);
export type PeerMessageSelectDevice = TypeOf<typeof PeerMessageSelectDevice>;

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
        totalLength: number,
        data: string
    })
);

export const PeerMessage = union([
    PeerMessageIdentify,
    PeerMessageListDevices,
    PeerMessageSelectDevice,
    PeerMessageShowCurrentState,
    PeerMessageSyncSummary,
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
    #address: string | null = null;
    #device: DeviceEntry;
    private _dataChannel: RTCDataChannel | null = null;
    private _peerConnection: RTCPeerConnection | null = null;
    private _isMakingOffer = false;
    private _isIgnoringOffer = false;

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

    async sendIdentify() {
        await this._sendMessage("IDENTIFY", {
            address: this._manager.web3Address,
            timestamp: Instant.now().toEpochMilli()
        });
    }

    async addIceCandidate(candidate: RTCIceCandidate) {
        if (!this._peerConnection)
            throw new Error("no peer connection");
        try {
            // @ts-ignore
            candidate.usernameFragment = null;
            await this._peerConnection.addIceCandidate(candidate);
        } catch (err) {
            if (!this._isIgnoringOffer) {
                throw err;
            }

            debug("ignoring ice candidate because ignoring offer", err);
        }
    }

    async provideDescription(description: RTCSessionDescription) {
        if (!this._peerConnection)
            throw new Error("no peer connection");

        this._isIgnoringOffer = !this._isPolite
            && description.type === "offer"
            && (
                this._isMakingOffer
                || this._peerConnection.signalingState !== "stable"
            );

        if (this._isIgnoringOffer)
            return;

        await this._peerConnection.setRemoteDescription(description);

        if (description.type === "offer") {
            await this._peerConnection.setLocalDescription();
            if (!this._peerConnection.localDescription)
                throw new Error("no local connection?");

            this._manager.send(this.#device.hash, {
                type: "description",
                description: this._peerConnection.localDescription
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
        if (msg.type === "IDENTIFY") {
            if (ethers.verifyMessage(dataStr, msg.signature) !== msg.data.address)
                return warn("Attempted to identify with a non-matching signature", msg);
        } else {
            if (ethers.verifyMessage(dataStr, msg.signature) !== this.#address)
                return warn("Attempted to identify with a non-matching signature", msg);
        }

        switch (msg.type) {
            case "IDENTIFY":
                void this._handleIdentifyMessage(msg);
                break;
            case "LIST_DEVICES":
                void this._handleListDevicesMessage(msg);
                break;
            case "SELECT_DEVICE":
                void this._handleSelectDeviceMessage(msg);
                break;
            default:
                warn("cannot process", msg.type);
        }
    }

    private _handleIdentifyMessage(msg: PeerMessageIdentify) {
        this.#address = msg.data.address;
        void this._sendDevicesList();
    }

    private _handleListDevicesMessage(msg: PeerMessageListDevices) {
        void this._selectDevice(msg.data);
    }

    private _handleSelectDeviceMessage(msg: PeerMessageSelectDevice) {
        void this._showCurrentState(msg.data);
    }

    private _initPeerConnection() {
        const pc = this._peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                        "stun:stun.l.google.com:19302",
                        "stun:stun3.l.google.com:19302",
                        "stun:stun4.l.google.com:19302",
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

                this._manager.send(this.#device.hash, {
                    type: "description",
                    description: pc.localDescription
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

            this._manager.send(this.#device.hash, {
                type: "candidate",
                candidate: event.candidate
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

    private async _sendDevicesList() {
        if (!this.#address)
            throw new Error("address");

        const devices = await deviceService.getDevicesOwnedBy(this.#address, this._manager.encryption);

        await this._sendMessage("LIST_DEVICES", devices.map(d => d.hash));
    }

    private async _selectDevice(remoteList: string[]) {
        debug("selecting device", remoteList, this.#device, this.#address);

        if (!this.#address)
            throw new Error("address");

        const devices = await deviceService.getDevicesOwnedBy(this.#address, this._manager.encryption);
        const device = devices.find(d => remoteList.includes(d.hash));
        if (!device)
            return warn("peer does not have a single device id that matches");

        this.#device = device;
        await this._sendMessage("SELECT_DEVICE", device.hash);
    }

    private async _showCurrentState(remoteDeviceHash: string) {
        debug("sending showcurrentstate", remoteDeviceHash, this.#device);

        if (!this.#device) {
            this.#device = await deviceService.getDevice(remoteDeviceHash, this._manager.encryption);
        }

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

    private _web3TransactionQueue: [string, BrokerMessageData][] = [];
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

    get signMessage() {
        return this._web3.signer.signMessage;
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
        const deviceHash = "0x" + event.args.deviceHash.toString(16);

        if (!this._peers.has(deviceHash)) {
            try {
                const device = await deviceService.getDevice(deviceHash, this._encryption);
                if (device.owned_by !== event.args.sender)
                    return warn("message from broker mentions device hash not owned by the user", { device, event });
                this._peers.set(
                    deviceHash,
                    new Peer(device, this, false)
                );
            } catch (e) {
                warn("could not find device", e);
                return;
            }
        }
        const peer = this._peers.get(deviceHash)!;

        const txn = await event.getTransaction();
        const txnDescription = this._web3.webRtcBroker.interface.parseTransaction(txn);
        const chunk: BrokerMessageData[] = JSON.parse(ethers.toUtf8String(txnDescription!.args[1]));

        for (const data of chunk)
            switch (data.type) {
                case "candidate":
                    void peer.addIceCandidate(data.candidate);
                    break;
                case "description":
                    void peer.provideDescription(data.description);
                    break;
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
        console.log("processing queue", this._web3TransactionQueue);
        if (this._web3TransactionQueue.length)
            void this._processWeb3TransactionQueue();
    }

    dropQueue(msgType: BrokerMessageData["type"]) {
        this._web3TransactionQueue = this._web3TransactionQueue
            .filter(([t]) => t !== msgType);
        console.log("dropped queue for", msgType, this._web3TransactionQueue);
    }

    send(deviceHash: string, data: BrokerMessageData) {
        this._web3TransactionQueue.push([deviceHash, data]);

        console.log("adding to queue", this._web3TransactionQueue);
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
