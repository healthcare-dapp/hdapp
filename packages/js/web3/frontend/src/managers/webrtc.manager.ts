import { Logger } from "@hdapp/shared/web2-common/utils";
import { ethers } from "ethers";
import { makeAutoObservable } from "mobx";
import { HDMHandshakeAddress, HDMHandshakeABI } from "../contract";

export type MessageEventData = {
    type: "candidate"
    candidate: RTCIceCandidate
} | {
    type: "description"
    description: RTCSessionDescription
};

export interface MessageEvent {
    sender: string
    receiver: string
    data: MessageEventData
}

const { debug, error } = new Logger("webrtc-manager");

export class WebRTCManager {
    private _peerConnection: RTCPeerConnection | null = null;
    private _dataChannel: RTCDataChannel | null = null;
    private _isMakingOffer = false;
    private _isIgnoringOffer = false;
    private _isPolitePeer = false;
    private _peer: string | null = null;

    private _web3Contract: ethers.Contract;

    private _web3TransactionQueue: (() => Promise<void>)[] = [];
    private _isProcessingWeb3TransactionQueue = false;

    constructor(
        private _signer: ethers.Signer,
        private _web3Address: string
    ) {
        this._web3Contract = new ethers.Contract(HDMHandshakeAddress, HDMHandshakeABI, this._signer);

        makeAutoObservable(this);

        this._bindWeb3Events();
    }

    private _bindWeb3Events() {
        if (!this._web3Address)
            throw new Error("no web3 address");

        void this._web3Contract.on([
            ethers.id("Message(address,address,bytes)"),
            null!,
            ethers.zeroPadBytes(this._web3Address, 32)
        ], async (sender: string, receiver: string, dataBytes: ethers.BytesLike, event: ethers.EventLog) => {
            const txn = await event.getTransaction();
            const txnDescription = this._web3Contract!.interface.parseTransaction(txn);
            const data = JSON.parse(ethers.toUtf8String(txnDescription!.args[1]));
            await this._handleWeb3Event({ receiver, sender, data });
        });
    }

    private async _handleWeb3Event(event: MessageEvent) {
        if (!this._peer)
            this._peer = event.sender;

        if (!this._peerConnection) {
            this._initPeerConnection();
            this._isPolitePeer = false;
        }

        if (!this._peerConnection)
            throw new Error("no peer connection");

        switch (event.data.type) {
            case "candidate":
                try {
                    await this._peerConnection.addIceCandidate(event.data.candidate);
                } catch (err) {
                    if (!this._isIgnoringOffer) {
                        throw err;
                    }
                }
                break;
            case "description":
                this._isIgnoringOffer = !this._isPolitePeer
                        && event.data.description.type === "offer"
                        && (
                            this._isMakingOffer
                            || this._peerConnection.signalingState !== "stable"
                        );

                if (this._isIgnoringOffer)
                    return;

                await this._peerConnection.setRemoteDescription(event.data.description);
                if (event.data.description.type === "offer") {
                    await this._peerConnection.setLocalDescription();
                    if (!this._peerConnection.localDescription)
                        throw new Error("no local connection?");

                    this._queueWeb3Transaction(this._peer, {
                        type: "description",
                        description: this._peerConnection.localDescription
                    });
                }
                break;
        }
    }

    send(something: string) {
        this._dataChannel?.send(something);
    }

    private async _processWeb3TransactionQueue() {
        this._isProcessingWeb3TransactionQueue = true;
        for (const func of this._web3TransactionQueue)
            await func();
        this._isProcessingWeb3TransactionQueue = false;
    }

    private _queueWeb3Transaction(address: string, data: MessageEventData) {
        const func = async () => {
            if (!this._web3Contract)
                return;
            debug("Sending to handshake SC", { address, data });
            const response: ethers.TransactionResponse = await this._web3Contract.send(
                address,
                Buffer.from(JSON.stringify(data), "utf8")
            );
            await response.wait(1);
        };
        this._web3TransactionQueue.push(func);
        if (!this._isProcessingWeb3TransactionQueue)
            void this._processWeb3TransactionQueue();
    }

    private _initDataChannel(channel?: RTCDataChannel) {
        if (!this._peerConnection)
            throw new Error("no peer connection");

        const sendChannel = channel ?? this._peerConnection.createDataChannel("data");
        sendChannel.binaryType = "arraybuffer";

        sendChannel.addEventListener("open", debug);
        sendChannel.addEventListener("message", debug);
        sendChannel.addEventListener("close", debug);
        sendChannel.addEventListener("error", error);

        this._dataChannel = sendChannel;
    }

    private _initPeerConnection() {
        if (!this._peer)
            throw new Error("no peer address");

        const peerConnection = this._peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        "stun:stun.tagan.ru:3478",
                        "stun:stun.tatneft.ru:3478"
                    ]
                },
            ]
        });

        peerConnection.addEventListener("negotiationneeded", async () => {
            if (!this._peer)
                throw new Error("no peer address");

            try {
                this._isMakingOffer = true;
                await peerConnection.setLocalDescription();
                if (!peerConnection.localDescription)
                    throw new Error("no local connection?");

                this._queueWeb3Transaction(this._peer, {
                    type: "description",
                    description: peerConnection.localDescription
                });
            } catch (err) {
                error(err);
            } finally {
                this._isMakingOffer = false;
            }
        });

        peerConnection.addEventListener("icecandidate", event => {
            if (!this._peer)
                throw new Error("no peer address");

            debug("Local ICE candidate: ", event.candidate);
            if (!event.candidate)
                return;

            this._queueWeb3Transaction(this._peer, {
                type: "candidate",
                candidate: event.candidate
            });
        });
        peerConnection.addEventListener("iceconnectionstatechange", () => {
            if (peerConnection.iceConnectionState === "failed") {
                peerConnection.restartIce();
            }
        });

        peerConnection.addEventListener("datachannel", event => {
            this._initDataChannel(event.channel);
        });
    }

    start(address: string) {
        this._peer = address;
        this._initPeerConnection();
        this._isPolitePeer = true;
        this._initDataChannel();
    }
}
