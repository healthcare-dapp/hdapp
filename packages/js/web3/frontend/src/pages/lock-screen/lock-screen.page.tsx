import { LockOutlined } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
    Avatar,
    Box,
    Chip,
    CircularProgress,
    Container,
    Stack,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import makeBlockie from "ethereum-blockies-base64";
import { observer } from "mobx-react-lite";
import { FC, forwardRef, useEffect, useState } from "react";
import { sessionManager } from "../../managers/session.manager";
import { walletManager } from "../../managers/wallet.manager";
import { WalletEntryShort } from "../../services/wallet.service";
import { trimWeb3Address } from "../../utils/trim-web3-address";
import { Logo } from "../../widgets/header";

const Account: FC<{ selected?: boolean; wallet: WalletEntryShort }> = observer(x => {
    const theme = useTheme();
    const [password, setPassword] = useState("");
    return (
        <Stack spacing={2} alignItems="center" justifyContent="center">
            <Avatar src={makeBlockie(x.wallet.address)} sx={{ width: 64, height: 64 }} />
            <Typography fontWeight="500"
                        align="center"
                        color={theme.palette.text.primary}>
                { x.wallet.user.full_name }
                <Typography fontWeight="500"
                            fontSize={12}
                            color={theme.palette.grey[500]}>
                    ({ trimWeb3Address(x.wallet.address) })
                </Typography>
            </Typography>
            { x.selected && (
                <form onSubmit={e => {
                    e.preventDefault();
                    void sessionManager.unlock.run(x.wallet, password);
                }}>
                    <Stack spacing={2} alignItems="center" justifyContent="center">
                        <TextField variant="outlined" label="Password"
                                   size="small"
                                   type="password"
                                   value={password}
                                   error={!!sessionManager.unlock.error}
                                   helperText={sessionManager.unlock.error ? "Incorrect password" : void 0}
                                   onChange={e => setPassword(e.target.value)} />
                        <LoadingButton loading={sessionManager.unlock.pending}
                                       variant="contained" disableElevation
                                       type="submit">
                            Unlock
                        </LoadingButton>
                    </Stack>
                </form>
            ) }
        </Stack>
    );
});

export const LockScreenPage = observer(forwardRef(function LockScreenPage(props, ref) {
    const theme = useTheme();
    const [wallet] = walletManager.list;

    useEffect(() => {
        void walletManager.load.tryRun();
    }, []);

    if (!wallet || walletManager.load.pending)
        return (
            <Stack alignItems="center" justifyContent="center" style={{ height: "100vh" }}>
                <CircularProgress />
            </Stack>
        );

    return (
        <Box sx={{ background: theme.palette.grey[100], height: "100vh", zIndex: 1000, position: "fixed", top: 0, left: 0, width: "100vw" }}
             ref={ref}
             {...props}>
            <Container sx={{ position: "relative", height: "100%" }}>
                <Stack direction="row" alignItems="center"
                       sx={{ position: "absolute", top: 0, left: 0, width: "100%", py: 1, px: 2 }}>
                    <Logo />
                    <Chip icon={<LockOutlined />}
                          label="Locked"
                          variant="outlined"
                          sx={{ fontWeight: 500, marginLeft: "auto" }} />
                </Stack>
                <Stack spacing={2} alignItems="center" justifyContent="center"
                       sx={{ height: "100%" }}>
                    <Account selected
                             wallet={wallet!} />
                </Stack>
            </Container>
        </Box>
    );
}));

