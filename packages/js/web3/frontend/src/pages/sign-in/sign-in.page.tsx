import {
    ArrowBack,
    InfoOutlined,
    Password,
    QrCodeRounded,
    Subject,
    SvgIconComponent,
} from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    ButtonProps,
    Card,
    CardActionArea,
    IconButton,
    Link,
    Stack,
    styled,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { observer } from "mobx-react-lite";
import { FC, forwardRef, useEffect, useState } from "react";
import { ModalProvider } from "../../App2";
import { SuccessfulVerificationDialog } from "../../dialogs/successful-verification.dialog";
import { walletManager } from "../../managers/wallet.manager";
import { Logo } from "../../widgets/header";

const OverflowCard = styled(Card)`
    position: relative;
    overflow: auto;
    overflow: overlay;
    width: 100%;
`;

const SignInCard: FC<{
    icon: SvgIconComponent
    title: string
    description: string
    color: ButtonProps["color"]
    onClick?: () => void
}> = x => {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    return (
        <Card variant="outlined" style={{ height: "100%" }}>
            <CardActionArea sx={{ height: "100%" }} onClick={x.onClick}>
                <Stack spacing={2} sx={{ px: 2, py: isSmall ? 1 : 2, height: "100%" }}
                       alignItems={isSmall ? "flex-start" : "center"}>
                    <Stack direction={isSmall ? "row" : "column"} spacing={isSmall ? 1 : 2}
                           alignItems="center">
                        <x.icon color={x.color} sx={{ fontSize: isSmall ? 48 : 100, marginLeft: "-6px" }} />
                        <Stack spacing={isSmall ? 0 : 2} alignItems={isSmall ? "flex-start" : "center"}>
                            <Typography fontWeight="500"
                                        align={isSmall ? "left" : "center"}
                                        fontSize={isSmall ? 14 : 16}>{ x.title }</Typography>
                            <Typography fontSize={12}
                                        align={isSmall ? "left" : "center"}
                                        color={theme.palette.text.secondary}>
                                { x.description }
                            </Typography>
                        </Stack>
                    </Stack>
                    { !isSmall && (
                        <>
                            <Box flexGrow={1} />
                            <Button disableElevation
                                    variant="contained"
                                    fullWidth
                                    onClick={x.onClick}
                                    color={x.color}>
                                Sign in
                            </Button>
                        </>
                    ) }
                </Stack>
            </CardActionArea>
        </Card>
    );
};

type Page = "mnemonic-phrase" | "private-key" | "qr" | "url";

const SignInMainPage: FC<{ setPage(page: Page): void }> = x => {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    return (
        <OverflowCard elevation={2} sx={{ maxWidth: 800 }}>
            <Stack spacing={2} alignItems="center" sx={{ pt: 2, px: isSmall ? 1 : 2, pb: 4 }}>
                <Typography fontWeight="500"
                            align="center"
                            fontSize={20}
                            color={theme.palette.text.primary}>
                    Sign in
                    <Typography align="center"
                                fontSize={12}
                                color={theme.palette.text.secondary}>
                        Choose one of the provided sign in methods:
                    </Typography>
                </Typography>
                <Grid2 container rowSpacing={isSmall ? 2 : 0} columnSpacing={isSmall ? 0 : 2} sx={{ width: "100%" }}>
                    <Grid2 xs={12} sm={4}>
                        <SignInCard title="Mnemonic Phrase"
                                    description="A 12- or 16-word combination of words attached to your account"
                                    color="primary"
                                    icon={Subject}
                                    onClick={() => x.setPage("mnemonic-phrase")} />
                    </Grid2>
                    <Grid2 xs={12} sm={4}>
                        <SignInCard title="Private Key"
                                    description="A long string consisting of letters and digits describing your account"
                                    color="success"
                                    icon={Password}
                                    onClick={() => x.setPage("private-key")} />
                    </Grid2>
                    <Grid2 xs={12} sm={4}>
                        <SignInCard title="QR Code"
                                    description="Use a QR code provided by another device to sign in"
                                    color="secondary"
                                    icon={QrCodeRounded}
                                    onClick={() => x.setPage("qr")} />
                    </Grid2>
                </Grid2>
                <Typography fontWeight="500"
                            align="center"
                            fontSize={20}
                            color={theme.palette.text.primary}>
                    First time here?
                </Typography>
                <Button disableElevation variant="contained"
                        href="/#/register">Create an account</Button>
            </Stack>
        </OverflowCard>
    );
};

const SignInPrivateKeyPage: FC<{ onBackButton(): void }> = x => {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    const [privateKey, setPrivateKey] = useState("");

    return (
        <OverflowCard elevation={2} sx={{ maxWidth: 700 }}>
            <IconButton onClick={x.onBackButton} sx={{ position: "absolute", top: 0, left: 0, m: 1 }}>
                <ArrowBack />
            </IconButton>
            <Stack spacing={2} alignItems="center" sx={{ pt: 2, px: isSmall ? 1 : 2, pb: 3 }}>
                <Typography fontWeight="500"
                            align="center"
                            fontSize={20}
                            color={theme.palette.text.primary}>
                    Sign in using private key
                    <Typography align="center"
                                fontSize={12}
                                color={theme.palette.text.secondary}>
                        Please insert the private key in the field below:
                    </Typography>
                </Typography>
                <TextField label="Private key"
                           multiline
                           maxRows={4}
                           minRows={3}
                           sx={{ maxWidth: 600 }}
                           fullWidth
                           disabled={walletManager.addUsingPrivateKey.pending}
                           value={privateKey}
                           onChange={e => setPrivateKey(e.target.value)} />
                <Stack direction="row" spacing={1} alignItems="center">
                    <InfoOutlined sx={{ color: theme.palette.text.secondary }} fontSize="small" />
                    <Typography fontSize={12}
                                color={theme.palette.text.secondary}>
                        Private key should be 64 characters long and consist of uppercase and lowercase Latin letters and digits.
                    </Typography>
                </Stack>
                <LoadingButton disableElevation variant="contained"
                               disabled={privateKey.length !== 64}
                               loading={walletManager.addUsingPrivateKey.pending}
                               onClick={() => {
                                   void walletManager.addUsingPrivateKey.run(privateKey);
                               }}>
                    Add an account
                </LoadingButton>
            </Stack>
        </OverflowCard>
    );
};

const SignInUrlPage: FC = x => {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    const [privateKey, setPrivateKey] = useState("");

    useEffect(() => {
        const url = new URL(location.href);
        const pk = url.searchParams.get("privateKey");
        if (!pk)
            return;

        setPrivateKey(pk);
        console.log(pk);
        url.search = "";
        history.replaceState("", "", url);
    }, []);

    console.log(privateKey);

    return (
        <OverflowCard elevation={2} sx={{ maxWidth: 700 }}>
            <Stack spacing={2} alignItems="center" sx={{ pt: 2, px: isSmall ? 1 : 2, pb: 3 }}>
                <Typography fontWeight="500"
                            align="center"
                            fontSize={20}
                            color={theme.palette.text.primary}>
                    Welcome!
                </Typography>
                <Typography align="center"
                            fontSize={14}>
                    You have successfully created and verified your account.<br />
                    Now, you can set up your first device to start using Healthcare DApp.
                </Typography>
                <LoadingButton disableElevation variant="contained"
                               loading={walletManager.addUsingPrivateKey.pending}
                               onClick={() => {
                                   void walletManager.addUsingPrivateKey.run(privateKey);
                               }}>
                    Start setup
                </LoadingButton>
            </Stack>
        </OverflowCard>
    );
};

export const SignInPage = observer(forwardRef(function SignInPage(props, ref) {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

    const [page, setPage] = useState<Page>();

    useEffect(() => {
        const url = new URL(location.href);
        const privateKey = url.searchParams.get("privateKey");
        if (privateKey) {
            setPage("url");
        }
        if (ModalProvider.modals.length)
            return;
        const verify = url.searchParams.get("verify");
        if (verify === "success") {
            void ModalProvider.show(SuccessfulVerificationDialog, { onClose() {} });
        }
    }, []);

    return (
        <Box sx={{ background: theme.palette.background.default, height: "100vh", zIndex: 1000, position: "fixed", top: 0, left: 0, width: "100vw" }}
             ref={ref}
             {...props}>
            <Stack spacing={2} alignItems="center" justifyContent="center"
                   sx={{ height: "100%", py: 2, px: isSmall ? 0 : 2 }}>
                <Logo />

                { page
                    ? page === "private-key"
                        ? <SignInPrivateKeyPage onBackButton={() => setPage(undefined)} />
                        : page === "url"
                            ? <SignInUrlPage />
                            : <SignInPrivateKeyPage onBackButton={() => setPage(undefined)} />
                    : <SignInMainPage setPage={setPage} /> }

                <Typography fontSize={12} color="text.secondary">
                    Cannot sign in? <Link>Contact us</Link>
                </Typography>
            </Stack>
        </Box>
    );
}));

