import { ArrowBack } from "@mui/icons-material";
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

export const SuccessfulVerificationDialog: FC<{ onClose(): void }> = x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="xs"
                onClose={() => x.onClose()} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose()}>
                    <ArrowBack />
                </IconButton>
                E-mail verified!
            </DialogTitle>
            <DialogContent style={{
                margin: "auto",
                flex: "none"
            }}>
                <Stack spacing={2} alignItems="center">
                    <DialogContentText fontSize={14} align="center">
                        Thank you for confirming your e-mail address. You should have also received your account sign in details in the e-mail. Please use these details to start using your account.
                    </DialogContentText>
                    <Button variant="contained"
                            color="success"
                            onClick={() => x.onClose()}>Okay</Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
