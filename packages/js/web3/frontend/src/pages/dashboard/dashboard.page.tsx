
import { Menu as MenuIcon, PersonAdd, QrCodeRounded, Search, Tune } from "@mui/icons-material";
import {
    AppBar,
    Box,
    Button,
    CircularProgress,
    Container,
    IconButton,
    Stack,
    styled,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import Grid from "@mui/system/Unstable_Grid";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ModalProvider } from "../../App2";
import { QrCodeDialog } from "../../dialogs/qr-code.dialog";
import { ScanQrCodeDialog } from "../../dialogs/scan-qr-code.dialog";
import { sessionManager } from "../../managers/session.manager";
import { useDatabase } from "../../utils/use-database";
import { BottomBarWidget } from "../../widgets/bottom-bar";
import { DrawerWidget } from "../../widgets/drawer";
import { HeaderWidget } from "../../widgets/header";
import { ShareQrWidget } from "../../widgets/share-qr";
import { DashboardViewModel } from "./dashboard.vm";
import { LogsWidget } from "./widgets/logs.widget";
import { MyChatsWidget } from "./widgets/my-chats.widget";
import { MyMedicalDataWidget } from "./widgets/my-medical-data.widget";
import { MyPatientsWidget } from "./widgets/my-patients.widget";
import { MyProfileWidget } from "./widgets/my-profile.widget";

const JumboText = styled(Typography)(({ theme }) => ({
    fontSize: 32,
    [theme.breakpoints.down("md")]: {
        textAlign: "center",
        fontSize: 24,
    },
}));

const vm = new DashboardViewModel();

export const DashboardPage = observer(() => {
    const { account } = sessionManager;
    const theme = useTheme();
    const canShowSidebar = useMediaQuery(theme.breakpoints.up("md"));
    const canShowSharingInfo = useMediaQuery(theme.breakpoints.up("sm"));
    const [openCounter, setOpenCounter] = useState(0);

    useDatabase(() => {
        void vm.loadRecords.tryRun();
    });

    if (!account)
        return null;

    return (
        <>
            <DrawerWidget openCounter={openCounter} />
            <HeaderWidget />
            { !canShowSidebar && (
                <>
                    <AppBar elevation={2} color="default" position="fixed">
                        <Toolbar style={{ paddingRight: "8px" }}>
                            <IconButton size="large"
                                        edge="start"
                                        color="inherit"
                                        aria-label="menu"
                                        sx={{ mr: 2 }}
                                        onClick={() => setOpenCounter(openCounter + 1)}>
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                My data
                            </Typography>
                            <div>
                                <IconButton size="large"
                                            color="inherit">
                                    <Tune />
                                </IconButton>
                                <IconButton size="large"
                                            color="inherit">
                                    <Search />
                                </IconButton>
                            </div>
                        </Toolbar>
                    </AppBar>
                    <Box mt={7} />
                </>
            ) }
            <Container sx={{ pt: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ pb: 3 }}>
                    <JumboText>Welcome, Ruslan!</JumboText>
                    { canShowSharingInfo && <Box flexGrow={1} /> }
                    { canShowSidebar && (
                        <Button variant="text" size="small" startIcon={<PersonAdd />} color="primary"
                                onClick={() => ModalProvider.show(ScanQrCodeDialog, { onClose() {} })}>
                            New contact
                        </Button>
                    ) }
                    { canShowSharingInfo && (
                        <Button variant="contained" disableElevation startIcon={<QrCodeRounded />} color="success"
                                onClick={() => ModalProvider.show(QrCodeDialog, { onClose() {} })}>
                            Share my profile
                        </Button>
                    ) }
                </Stack>
                <Grid container spacing={2}>
                    <Grid md={8}>
                        <Stack spacing={2} style={{ flexGrow: 1 }}>
                            <MyProfileWidget />
                            { account.isLoading
                                ? (
                                    <>
                                        <br />
                                        <CircularProgress sx={{ alignSelf: "center" }} />
                                    </>
                                )
                                : (
                                    <>
                                        { account?.isDoctor && <MyPatientsWidget /> }
                                        { !account?.isDoctor && <MyMedicalDataWidget vm={vm} /> }
                                    </>
                                ) }
                        </Stack>
                    </Grid>
                    { canShowSidebar && (
                        <Grid xs={0} md={4}>
                            <Stack spacing={2}>
                                <MyChatsWidget />
                                <LogsWidget />
                                <Typography fontSize={12} color="text.secondary">
                                    This version of the application can only be used for testing purposes.<br /><br />
                                    <a href="/tos" style={{ color: "grey" }}>Terms of Service</a> • <a href="/privacy_policy" style={{ color: "grey" }}>Privacy Policy</a> • <a style={{ color: theme.palette.primary.main }} href="/">2023 Healthcare DApp</a>
                                </Typography>
                            </Stack>
                        </Grid>
                    ) }
                </Grid>
            </Container>
            <BottomBarWidget />
            <ShareQrWidget />
        </>
    );
});
