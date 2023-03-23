import { ArrowBack, Send } from "@mui/icons-material";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    Button,
    Stack,
    IconButton,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { FC } from "react";
import { ModalProvider } from "../App2";

export const SendConnectionConfirmationDialog: FC<{ address: string; onClose(isConfirmed: boolean): void }> = x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="xs"
                onClose={() => x.onClose(false)} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose(false)}>
                    <ArrowBack />
                </IconButton>
                QR code was detected
            </DialogTitle>
            <DialogContent style={{
                margin: "auto",
                flex: "none",
                width: "100%"
            }}>
                <Stack spacing={2} alignItems="center">
                    <DialogContentText fontSize={14} align="center">
                        You are trying to connect with a HDAPP user with address <b>{ x.address }</b><br />
                        Please confirm that the following 4 symbols are the same with the person you are trying to connect with!
                    </DialogContentText>
                    <DialogContentText fontSize={48} fontWeight={600} color="success.dark" align="center">
                        { x.address.slice(-4).toUpperCase() }
                    </DialogContentText>
                    <Button onClick={() => x.onClose(false)}>Cancel</Button>
                    <Button variant="contained"
                            color="success"
                            onClick={() => x.onClose(true)}
                            startIcon={<Send />}>Send connection request</Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
