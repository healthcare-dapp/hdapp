import { ArrowBack } from "@mui/icons-material";
import { Dialog, DialogTitle, Stack, IconButton, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import { observer } from "mobx-react-lite";
import QrCode from "qrcode";
import { FC, useEffect, useState } from "react";
import { ModalProvider } from "../App2";
import { sessionManager } from "../managers/session.manager";
import { walletService } from "../services/wallet.service";

export const AddDeviceDialog: FC<{ onClose(): void }> = observer(x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [qrUrl, setQrUrl] = useState<string>();
    const { wallet } = sessionManager;
    useEffect(() => {
        (async () => {
            const walletFull = await walletService.getWallet(wallet.address, encryption);
            const connUrl = new URL("https://hdapp.ruslang.xyz/app");
            connUrl.searchParams.set("privateKey", walletFull.private_key!);
            QrCode.toDataURL(connUrl.toString(), { width: 300, margin: 5 })
                .then(setQrUrl);
        })();
    }, []);

    return (
        <Dialog fullScreen={isMobileView} fullWidth maxWidth="xs" disablePortal
                onClose={() => x.onClose()} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose()}>
                    <ArrowBack />
                </IconButton>
                Add a new device
            </DialogTitle>
            <Stack spacing={6} direction="column"
                   justifyContent="flex-end"
                   alignItems="center"
                   sx={{ py: 3, px: 2 }}>
                <Stack spacing={4} alignItems="center">
                    <Paper sx={{ borderRadius: 6, display: "flex", overflow: "hidden" }}>
                        <img alt="qr-code" src={qrUrl} />
                    </Paper>
                    <Stack alignItems="center" spacing={-1}>
                        <Typography color="text.secondary" fontWeight={500} align="center">
                            Confirmation symbols
                        </Typography>
                        <Typography fontSize={48} fontWeight={600} color="success.dark" align="center">
                            { sessionManager.wallet.address.slice(-4).toUpperCase() }
                        </Typography>
                    </Stack>
                </Stack>
                <Typography>
                    To add a new device to this account, please perform the following:
                    <br />
                    <ol>
                        <li>Open Healthcare DApp on your another device</li>
                        <li>When offered to sign in, choose the option "QR code" and give permission to use your device's camera</li>
                        <li>Scan the QR code provided below</li>
                        <li>Compare confirmation symbols on both devices</li>
                    </ol>
                    <br />
                    Scanning the QR code is not an option? <a href="#/settings/account">Add device using a private key</a> instead
                </Typography>
            </Stack>
        </Dialog>
    );
});
