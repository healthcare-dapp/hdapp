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
import { sessionManager } from "../managers/session.manager";
import { SendConnectionConfirmationDialog } from "./send-connection-confirmation.dialog";
import { WaitingForConnectionDialog } from "./waiting-for-connection.dialog";

export const ScanQrCodeDialog: FC<{ onClose(): void }> = x => {
    const theme = useTheme();
    const videoRef = useRef<HTMLVideoElement>(null);
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));

    useEffect(() => {
        // let mediaStream: MediaStream;
        let qr: QrScanner | undefined;
        let isLocked = false;
        let timeout: number;

        async function confirmConnection(result: QrScanner.ScanResult) {
            if (isLocked)
                return;
            isLocked = true;
            const url = new URL(result.data);
            const search = url.searchParams;
            if (url.host === "hdapp.ruslang.xyz" && search.has("connect")) {
                const address = search.get("connect")!;
                const key = search.get("key")!;
                const isConfirmed = await ModalProvider.show(SendConnectionConfirmationDialog, {
                    address
                });
                if (!isConfirmed) {
                    await qr?.start();
                    return;
                }

                await sessionManager.accessControl.requestUserConnection
                    .run(address, key);

                console.log("confirmed");
                await ModalProvider.show(WaitingForConnectionDialog, {});
            }
            isLocked = false;
        }

        (async () => {
            timeout = window.setTimeout(async () => {
                if (!videoRef.current)
                    return;

                qr = new QrScanner(
                    videoRef.current,
                    confirmConnection,
                    {
                        preferredCamera: "environment",
                    }
                );
                await qr.start();
            }, 500);
        })();

        return () => {
            try {
                window.clearTimeout(timeout);
                qr?.stop();
            } catch (e) {
                //
            }
        };
    }, []);
    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="lg"
                onClose={() => x.onClose()} open>
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
                <video id="video" style={{ background: "black", flexGrow: 1, minHeight: "500px" }} autoPlay ref={videoRef} />
            </Stack>
        </Dialog>
    );
};
