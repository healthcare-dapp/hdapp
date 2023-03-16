import { ArrowBack, CopyAll, InfoOutlined, QrCodeRounded } from "@mui/icons-material";
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
import QrCode from "qrcode";
import { FC, useEffect, useState } from "react";
import { ModalProvider } from "../App2";
import { sessionManager } from "../managers/session.manager";
import { ScanQrCodeDialog } from "./scan-qr-code.dialog";

export const QrCodeDialog: FC<{ onClose(): void }> = x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [hasFoundConnections, setHasFoundConnections] = useState(false);
    const [qrUrl, setQrUrl] = useState<string>();
    const [connectionUrl, setConnectionUrl] = useState<string>();
    const { wallet } = sessionManager;
    useEffect(() => {
        const connUrl = new URL("https://hdapp.ruslang.xyz/app");
        connUrl.searchParams.set("connect", wallet.address);
        connUrl.searchParams.set("key", "idk");
        setConnectionUrl(connUrl.toString());
        QrCode.toDataURL(connUrl.toString(), { width: 300, margin: 5 })
            .then(setQrUrl);
    }, []);
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
            <Stack spacing={isMobileView ? 6 : 12} direction={isMobileView ? "column-reverse" : "row"} justifyContent={isMobileView ? "flex-end" : void 0} alignItems="center" sx={{ pt: isMobileView ? 3 : 0, pb: isMobileView ? 4 : 4, pl: isMobileView ? 2 : 4, pr: isMobileView ? 2 : 12, minHeight: "480px" }}>
                <Stack spacing={2} alignSelf="stretch">
                    { !(hasFoundConnections && isMobileView) && (
                        <>
                            <Typography fontSize={24} fontWeight="500" align={isMobileView ? "center" : "left"}>
                                Waiting for incoming connections...
                            </Typography>
                            <Box flexGrow={1} pt={isMobileView ? 8 : 0} />
                        </>
                    ) }
                    <div style={{ position: "relative", height: "342px" }}>
                        <Fade in={hasFoundConnections} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                            <Stack spacing={2} alignSelf="stretch" justifyContent="center">
                                <Typography fontWeight="500" align="center">
                                    1 incoming connection request
                                </Typography>
                                <Stack spacing={1} alignItems="center" sx={{ width: "100%" }}>
                                    <Card sx={{ maxWidth: "100%" }}>
                                        <Stack direction="column" spacing={1} sx={{ p: 2 }}>
                                            <Stack spacing={1.5} direction="row" alignItems="center" sx={{ pb: 1 }}>
                                                <Avatar sx={{ width: 40, height: 40, backgroundColor: theme.palette.success.light }} />
                                                <Stack>
                                                    <Typography variant="subtitle2">
                                                        Anna Cutemon
                                                    </Typography>
                                                    <Typography fontSize={12} color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                                        0x1388CD36D2f1344A32A026C916A011bF8781cE9B54af
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                            <Box style={{ display: "grid", gap: "4px", gridTemplateColumns: "auto auto" }}>
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
                                            </Box>
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Button color="error">Ignore</Button>
                                                <Button variant="contained" disableElevation
                                                        onClick={() => {
                                                            x.onClose();
                                                        }}>Accept</Button>
                                            </Stack>
                                        </Stack>
                                    </Card>
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
                        <Fade in={!hasFoundConnections} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
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
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "450px",
                                            whiteSpace: "nowrap"
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
                <Paper sx={{ borderRadius: 6, display: "flex", overflow: "hidden" }}
                       onClick={() => setHasFoundConnections(!hasFoundConnections)}>
                    <img alt="qr-code" src={qrUrl} />
                </Paper>
            </Stack>
        </Dialog>
    );
};
