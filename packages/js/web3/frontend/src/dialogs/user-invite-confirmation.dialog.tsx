import {
    Dialog,
    Button,
    Stack,
    Typography,
    Box,
    useMediaQuery,
    useTheme,
    Card,
    Avatar,
} from "@mui/material";
import { FC } from "react";
import { ModalProvider } from "../App2";

export const UserInviteConfirmationDialog: FC<{ onClose(): void }> = x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="md"
                onClose={() => x.onClose()} {...ModalProvider.modalProps(x)}>
            <Stack spacing={2} alignSelf="stretch" justifyContent="center" justifyItems="center"
                   flexGrow={1} sx={{ p: 3 }}>
                <Typography fontWeight="500" align="center">
                    Is this the person you are trying to add?
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
                        </Stack>
                    </Card>
                    <Stack direction={isMobileView ? "column-reverse" : "row"} spacing={1} justifyContent="flex-end" sx={{ pt: 2 }}
                           alignSelf={isMobileView ? "stretch" : "center"}>
                        <Button fullWidth={isMobileView} color="error"
                                onClick={() => {
                                    x.onClose();
                                }}>Ignore</Button>
                        <Button fullWidth={isMobileView}
                                variant="contained" disableElevation
                                onClick={() => {
                                    x.onClose();
                                }}>Send connection request</Button>
                    </Stack>
                </Stack>
            </Stack>
        </Dialog>
    );
};
