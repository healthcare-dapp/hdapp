import { ArrowBack } from "@mui/icons-material";
import {
    Dialog,
    DialogTitle,
    Stack,
    IconButton,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import QrScanner from "qr-scanner";
import { FC, useEffect, useRef } from "react";
import { ModalProvider } from "../App2";
import { SendConnectionConfirmationDialog } from "./send-connection-confirmation.dialog";
import { UserInviteConfirmationDialog } from "./user-invite-confirmation.dialog";

export const ScanQrCodeDialog: FC<{ onClose(): void }> = x => {
    const theme = useTheme();
    const videoRef = useRef<HTMLVideoElement>(null);
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));

    async function confirmConnection(result: QrScanner.ScanResult) {
        const url = new URL(result.data);
        const search = url.searchParams;
        if (url.host === "hdapp.ruslang.xyz" && search.has("connect")) {
            const address = search.get("connect")!;
            const isConfirmed = await ModalProvider.show(SendConnectionConfirmationDialog, {
                address
            });
            if (!isConfirmed)
                return;
            console.log("confirmed");
        }
    }

    useEffect(() => {
        let mediaStream: MediaStream;
        let qr: QrScanner;
        (async () => {
            if (!videoRef.current)
                return;

            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 1280, height: 720,
                    facingMode: { exact: "environment" }
                }
            });

            videoRef.current.srcObject = mediaStream;
            qr = new QrScanner(
                videoRef.current,
                confirmConnection,
                {
                    preferredCamera: "environment"
                }
            );
        })();

        return () => {
            try {
                qr.stop();
                qr.destroy();
                videoRef.current!.srcObject = null;
            } catch (e) {
                //
            }
        };
    }, []);
    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="lg"
                onClose={() => x.onClose()} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose()}>
                    <ArrowBack />
                </IconButton>
                Add contact using QR
            </DialogTitle>
            <Stack spacing={2} alignSelf="stretch" flexGrow={1}>
                <Typography fontWeight="500" fontSize={14} align="center"
                            sx={{ px: 2 }}>
                    Please use your camera to scan the QR code to add a person to Contacts
                </Typography>
                <video id="video" style={{ background: "black", flexGrow: 1, minHeight: "500px" }} autoPlay ref={videoRef}
                       onClick={() => {
                           x.onClose();
                           void ModalProvider.show(UserInviteConfirmationDialog, { onClose() {} });
                       }} />
            </Stack>
        </Dialog>
    );
};
