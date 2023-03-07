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
import { FC, useEffect, useRef } from "react";
import { ModalProvider } from "../App2";
import { UserInviteConfirmationDialog } from "./user-invite-confirmation.dialog";

export const ScanQrCodeDialog: FC<{ onClose(): void }> = x => {
    const theme = useTheme();
    const videoRef = useRef<HTMLVideoElement>(null);
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({
            video: {
                width: 1280, height: 720,
                facingMode: { exact: "environment" }
            }
        }).then(ms => {
            console.log(ms);
            if (videoRef.current)
                videoRef.current.srcObject = ms;
        }).catch(console.error);
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
                           ModalProvider.show(UserInviteConfirmationDialog, { onClose() {} });
                       }} />
            </Stack>
        </Dialog>
    );
};
