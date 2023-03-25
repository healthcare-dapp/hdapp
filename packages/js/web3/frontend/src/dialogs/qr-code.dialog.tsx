import { ArrowBack, CopyAll, InfoOutlined, QrCodeRounded } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
    Dialog,
    DialogTitle,
    Button,
    Stack,
    IconButton,
    Paper,
    Typography,
    Box,
    useMediaQuery,
    useTheme,
    Card,
    Avatar,
    Fade,
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { observer } from "mobx-react-lite";
import QrCode from "qrcode";
import { FC, useEffect, useState } from "react";
import { ModalProvider } from "../App2";
import { sessionManager } from "../managers/session.manager";
import { ScanQrCodeDialog } from "./scan-qr-code.dialog";

const regenerationTimeout = 5 * 60 * 1000;

export const QrCodeDialog: FC<{ onClose(): void }> = observer(x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [qrUrl, setQrUrl] = useState<string>();
    const [connectionUrl, setConnectionUrl] = useState<string>();
    const [, forceUpdate] = useState(0);
    const { accessControl: ac, wallet } = sessionManager;
    useEffect(() => {
        const timerHandler = window.setInterval(
            () => {
                forceUpdate(n => n + 1);
            },
            1000
        );

        const hasConnectionKey = !!ac.currentConnectionKey;
        const msSinceGeneration = Date.now() - (ac.connectionKeyGeneratedAt ?? 0);
        const hasConnectionKeyExpired = msSinceGeneration > regenerationTimeout;
        if (!hasConnectionKey || hasConnectionKeyExpired) {
            ac.regenerateConnectionKey();
            const handler = window.setInterval(
                () => ac.regenerateConnectionKey(),
                regenerationTimeout
            );
            return () => {
                window.clearInterval(handler);
                window.clearInterval(timerHandler);
            };
        }

        let handler: number | null = null;

        const timeoutHandler = window.setTimeout(() => {
            ac.regenerateConnectionKey();
            handler = window.setInterval(
                () => ac.regenerateConnectionKey(),
                regenerationTimeout
            );
        }, regenerationTimeout - msSinceGeneration);

        return () => {
            handler && window.clearInterval(handler);
            window.clearInterval(timeoutHandler);
            window.clearInterval(timerHandler);
        };

    }, []);
    useEffect(() => {
        if (!ac.currentConnectionKey)
            return;

        const connUrl = new URL("https://hdapp.ruslang.xyz/app");
        connUrl.searchParams.set("connect", wallet.address);
        connUrl.searchParams.set("key", ac.currentConnectionKey);
        setConnectionUrl(connUrl.toString());
        QrCode.toDataURL(connUrl.toString(), { width: 300, margin: 5 })
            .then(setQrUrl);
    }, [ac.currentConnectionKey]);

    const connectionRequests = sessionManager.notifications.array
        .flatMap(n => n.type === "user_connection_requested" ? n : []);

    const secondsUntilRegeneration = Math.floor(
        (regenerationTimeout + (ac.connectionKeyGeneratedAt ?? 0) - Date.now()) / 1000
    );
    return (
        <Dialog fullScreen={isMobileView} disablePortal sx={{ ".MuiDialog-paper": { maxWidth: "1036px" } }}
                onClose={() => x.onClose()} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose()}>
                    <ArrowBack />
                </IconButton>
                Share my profile
            </DialogTitle>
            <Stack spacing={isMobileView ? 6 : 12} direction={isMobileView ? "column-reverse" : "row"}
                   justifyContent={isMobileView ? "flex-end" : void 0}
                   alignItems="center"
                   sx={{ pt: isMobileView ? 3 : 0, pb: isMobileView ? 4 : 4, pl: isMobileView ? 2 : 4, pr: isMobileView ? 2 : 4, minHeight: "500px" }}>
                <Stack spacing={2} alignSelf="stretch">
                    { !(connectionRequests.length && isMobileView) && (
                        <>
                            <Typography fontSize={24} fontWeight="500" align={isMobileView ? "center" : "left"}>
                                Waiting for incoming connections...
                            </Typography>
                            <Box flexGrow={1} pt={isMobileView ? 8 : 0} />
                        </>
                    ) }
                    <div style={{ position: "relative", height: "342px" }}>
                        <Fade in={!!connectionRequests.length} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                            <Stack spacing={2} alignSelf="stretch" justifyContent="center">
                                <Typography fontWeight="500" align="center">
                                    { connectionRequests.length } incoming connection request{ connectionRequests.length > 1 ? "s" : "" }
                                </Typography>
                                <Stack spacing={1} alignItems="center" sx={{ width: "100%" }}>
                                    { connectionRequests.map(r => (
                                        <Card sx={{ maxWidth: "100%" }} key={r.created_at.toString()}>
                                            <Stack direction="column" spacing={1} sx={{ p: 2 }}>
                                                <Stack spacing={1.5} direction="row" alignItems="center" sx={{ pb: 1 }}>
                                                    <Avatar sx={{ width: 40, height: 40, backgroundColor: theme.palette.success.light }} />
                                                    <Stack>
                                                        <Typography variant="subtitle2">
                                                            User
                                                        </Typography>
                                                        <Typography fontSize={12} color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                                            { r.userAddress }
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                                { /* <Box style={{ display: "grid", gap: "4px", gridTemplateColumns: "auto auto" }}>
                                                    <Typography noWrap fontSize={14} sx={{ fontWeight: 400 }}>
                                                        <b>Specialization</b><br />
                                                        Physchiatrist
                                                    </Typography>
                                                    <Typography noWrap fontSize={14} sx={{ fontWeight: 400 }}>
                                                        <b>Account created on</b><br />
                                                        December 6th, 2022
                                                    </Typography>
                                                    <Typography noWrap fontSize={14} sx={{ fontWeight: 400, gridColumn: "span 2" }}>
                                                        <b>Medical organization</b><br />
                                                        State Hospital of St. Petersburg
                                                    </Typography>
                                                </Box> */ }
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Button color="error">Ignore</Button>
                                                    <LoadingButton variant="contained" disableElevation
                                                                   loading={sessionManager.accessControl.addUserConnection.pending}
                                                                   onClick={async () => {
                                                                       await sessionManager.accessControl.addUserConnection.run(r.userAddress);
                                                                       x.onClose();
                                                                   }}>Accept</LoadingButton>
                                                </Stack>
                                            </Stack>
                                        </Card>
                                    )) }
                                </Stack>
                                <Stack color="text.secondary" direction="row" spacing={1}>
                                    <InfoOutlined />
                                    <Typography fontSize={14}>
                                        Please carefully compare doctor's account address and profile details for accuracy to avoid impersonation.
                                        Do not share QR codes with people you don't know!
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Fade>
                        <Fade in={!connectionRequests.length} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                            <Stack spacing={2} alignSelf="stretch" justifyContent="center">
                                <Typography>
                                    To share this profile with another person, perform following steps:
                                    <br />
                                    <ol>
                                        <li>Open Healthcare DApp on other person's device</li>
                                        <li>Tap "Add contact" and give permission to use your device's camera</li>
                                        <li>Scan the QR code provided on the right</li>
                                        <li>Accept connection request when a dialog appears</li>
                                    </ol>
                                </Typography>

                                <Typography>
                                    Or, send the following link:
                                    <Stack spacing={1} alignItems="center" direction="row"
                                           style={{
                                               background: "#eaeaea", marginTop: "4px",
                                               borderRadius: "4px", padding: "8px 8px 8px 16px",
                                               maxWidth: "calc(100vw - 32px)"
                                           }}>
                                        <code style={{
                                            width: "100%",
                                            maxWidth: "450px",
                                            fontSize: "12px",
                                            wordBreak: "break-all"
                                        }}>
                                            { connectionUrl }
                                        </code>
                                        <Box flexGrow={1} />
                                        <IconButton onClick={() => navigator.clipboard.writeText(connectionUrl!)}><CopyAll /></IconButton>
                                    </Stack>

                                </Typography>
                                <Typography>
                                    Looking for a place to scan QR code?
                                    <Button fullWidth variant="outlined" startIcon={<QrCodeRounded />}
                                            sx={{ my: 1 }} size="large"
                                            onClick={() => {
                                                x.onClose();
                                                void ModalProvider.show(ScanQrCodeDialog, { onClose() {} });
                                            }}>Add contact by QR</Button>
                                </Typography>
                            </Stack>
                        </Fade>
                    </div>
                    <Box flexGrow={1} />
                </Stack>
                <Stack spacing={4} alignItems="center">
                    <Paper sx={{ borderRadius: 6, display: "flex", overflow: "hidden" }}>
                        <img alt="qr-code" src={qrUrl} />
                    </Paper>
                    <Grid2 container columnSpacing={2}>
                        <Grid2 xs={6}>
                            <Stack alignItems="center" spacing={-1}>
                                <Typography color="text.secondary" fontWeight={500} align="center">
                                    Confirmation symbols
                                </Typography>
                                <Typography fontSize={48} fontWeight={600} color="success.dark" align="center">
                                    { sessionManager.wallet.address.slice(-4).toUpperCase() }
                                </Typography>
                            </Stack>
                        </Grid2>
                        <Grid2 xs={6}>
                            <Stack alignItems="center" spacing={-1}>
                                <Typography color="text.secondary" fontWeight={500} align="center" noWrap>
                                    QR will refresh in
                                </Typography>
                                <Typography fontSize={48} fontWeight={600}
                                            color={secondsUntilRegeneration > 150 ? "success.dark" : secondsUntilRegeneration > 50 ? "warning.dark" : "error.dark"}
                                            align="center">
                                    { secondsUntilRegeneration }
                                </Typography>
                                <Typography color="text.secondary" fontWeight={500} align="center">seconds</Typography>
                            </Stack>
                        </Grid2>
                    </Grid2>
                </Stack>
            </Stack>
        </Dialog>
    );
});
