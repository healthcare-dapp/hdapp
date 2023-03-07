import { ArrowBack } from "@mui/icons-material";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    TextField,
    Button,
    Stack,
    IconButton,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { FC, useState } from "react";
import { ModalProvider } from "../App2";

export const SetPasswordDialog: FC<{ onClose(password: string | null): void }> = x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="xs"
                onClose={() => x.onClose(null)} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose(null)}>
                    <ArrowBack />
                </IconButton>
                Set password
            </DialogTitle>
            <DialogContent style={{
                margin: "auto",
                flex: "none"
            }}>
                <Stack spacing={2} alignItems="center">
                    <DialogContentText fontSize={14}>
                        In order to protect the data stored on your device, we need you to set a password. <br />
                        You will enter it every time you enter the app.
                    </DialogContentText>
                    <TextField autoFocus
                               margin="dense"
                               label="New password"
                               type="password"
                               fullWidth
                               variant="outlined"
                               value={password}
                               onChange={e => setPassword(e.target.value)}
                               helperText="Must be 4+ characters long" />
                    <TextField margin="dense"
                               label="Confirm password"
                               type="password"
                               fullWidth
                               variant="outlined"
                               value={passwordConfirmation}
                               onChange={e => setPasswordConfirmation(e.target.value)} />
                    <Button variant="contained"
                            disabled={password !== passwordConfirmation || password.length < 4}
                            onClick={() => x.onClose(password)}>Set password</Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
