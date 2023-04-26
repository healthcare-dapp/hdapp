import { UsersService } from "@hdapp/shared/web2-common/api/services/users.service";
import { PublicUserDto } from "@hdapp/shared/web2-common/dto/user.dto";
import { Web3Address } from "@hdapp/shared/web2-common/types/web3-address.type";
import { HDMAccountManager } from "@hdapp/solidity/account-manager";
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
    Avatar,
    Box,
    Card,
    Typography,
    CircularProgress,
    Backdrop,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { FC, useEffect, useState } from "react";
import { ModalProvider } from "../App2";
import { sessionManager } from "../managers/session.manager";
import { runAndCacheWeb3Call } from "../services/web3-cache.service";
import { Web3Badges } from "../widgets/web3-badges.widget";

export const SendConnectionConfirmationDialog: FC<{ address: string; onClose(isConfirmed: boolean): void }> = observer(x => {
    const { web3 } = sessionManager;
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [profile, setProfile] = useState<Partial<PublicUserDto & {
        web3: HDMAccountManager.AccountInfoStruct
    }>>();
    useEffect(() => {
        (async () => {
            const pr = await UsersService.findPublicProfileByWeb3Address(x.address)
                .catch(() => null);
            setProfile({
                ...(pr ?? { web3_address: x.address as Web3Address }),
                web3: await runAndCacheWeb3Call(
                    "getAccountInfo",
                    (...args) => web3.accountManager.getAccountInfo(...args),
                    x.address
                )
            });
        })();
    }, [x.address]);
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
                    { profile && (
                        <Card sx={{ maxWidth: "100%" }}>
                            <Stack direction="column" spacing={1} sx={{ p: 2 }}>
                                <Stack spacing={1.5} direction="row" alignItems="center" sx={{ pb: 1 }}>
                                    <Avatar sx={{ width: 40, height: 40, backgroundColor: theme.palette.success.light }}
                                            src={profile.public_profile?.avatar} />
                                    <Stack>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Typography variant="subtitle2">
                                                { profile.public_profile?.full_name ?? "Private user" }
                                            </Typography>
                                            { profile.web3 && <Web3Badges size="small" account={profile.web3} /> }
                                        </Stack>
                                        <Typography fontSize={12} color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                            { profile.web3_address }
                                        </Typography>
                                    </Stack>
                                </Stack>
                                { profile.public_profile && (
                                    <Box style={{ display: "grid", gap: "4px", gridTemplateColumns: "auto auto" }}>
                                        { profile.public_profile.specialty && (
                                            <Typography noWrap fontSize={14} sx={{ fontWeight: 400 }}>
                                                <b>Specialty</b><br />
                                                { profile.public_profile.specialty }
                                            </Typography>
                                        ) }
                                        { profile.public_profile.areasOfFocus && (
                                            <Typography noWrap fontSize={14} sx={{ fontWeight: 400 }}>
                                                <b>Areas of focus</b><br />
                                                { profile.public_profile.areasOfFocus }
                                            </Typography>
                                        ) }
                                        { profile.public_profile.location && (
                                            <Typography noWrap fontSize={14} sx={{ fontWeight: 400 }}>
                                                <b>Location</b><br />
                                                { profile.public_profile.location }
                                            </Typography>
                                        ) }
                                    </Box>
                                ) }
                            </Stack>
                        </Card>
                    ) }
                    <Button onClick={() => x.onClose(false)}>Cancel</Button>
                    <Button variant="contained"
                            color="success"
                            onClick={() => x.onClose(true)}
                            startIcon={<Send />}>Send connection request</Button>
                </Stack>
                <Backdrop sx={{ color: "#fff", zIndex: theme.zIndex.drawer + 1 }}
                          open={!profile}>
                    <CircularProgress color="inherit" />
                </Backdrop>
            </DialogContent>
        </Dialog>
    );
});
