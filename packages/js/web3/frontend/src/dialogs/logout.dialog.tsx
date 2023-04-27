import {
    Dialog,
    DialogTitle,
    Button,
    useMediaQuery,
    useTheme,
    DialogActions,
    DialogContent,
    DialogContentText,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { FC } from "react";
import { ModalProvider } from "../App2";
import { sessionManager } from "../managers/session.manager";
import { walletService } from "../services/wallet.service";

export const LogoutDialog: FC<{ onClose?(): void }> = observer(x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const isBigEnough = useMediaQuery(theme.breakpoints.up("sm"));

    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="sm" fullWidth
                onClose={() => x.onClose?.()}
                {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center" id="alert-dialog-title">
                Are you sure you would like to sign out?
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    You will need to pair this device again next time you log in.
                    <br />
                    <b>Be careful!</b> If this is your only active device, you will <b>lose access to your medical data forever</b>!
                </DialogContentText>
            </DialogContent>
            <DialogActions disableSpacing sx={{ flexDirection: isBigEnough ? "row" : "column", gap: "8px" }}>
                <Button color="error" onClick={async () => {
                    await walletService.removeWallet(sessionManager.wallet.address);
                    await sessionManager.db.service.reset();
                    location.reload();
                    x.onClose?.();
                }}>I'm aware, please sign out</Button>
                <Button onClick={() => x.onClose?.()} variant="contained" disableElevation autoFocus>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
});
