import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    Button,
    Stack,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { FC } from "react";
import { ModalProvider } from "../App2";

export const WaitingForConnectionDialog: FC<{ onClose(): void }> = x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="xs" {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                Connection request has been sent!
            </DialogTitle>
            <DialogContent style={{
                margin: "auto",
                flex: "none"
            }}>
                <Stack spacing={2} alignItems="center">
                    <DialogContentText fontSize={14} align="center">
                        Your connection request has been successfully sent.<br />
                        You will receive a notification when your request is accepted.
                    </DialogContentText>
                    <Button variant="outlined" onClick={() => x.onClose()}>Okay</Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
