import { AccountBalanceWalletOutlined, ArrowBack, DevicesOtherOutlined, Notifications, SecurityOutlined, StorageOutlined } from "@mui/icons-material";
import {
    Box,
    Container,
    useMediaQuery,
    AppBar,
    IconButton,
    Typography,
    useTheme,
    Toolbar,
    ListItemButton,
} from "@mui/material";
import { Stack } from "@mui/system";
import { observer } from "mobx-react-lite";
import { PropsWithChildren } from "react";
import { Navigate, useNavigate } from "react-router";
import { FancyList } from "../../widgets/fancy-list/fancy-list.widget";
import { HeaderWidget } from "../../widgets/header/index";

export const SettingsPageBase = observer<PropsWithChildren>(x => {
    const theme = useTheme();
    const navigate = useNavigate();
    const canShowSidebar = useMediaQuery(theme.breakpoints.up("md"));

    return (
        <>
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
                                        onClick={() => navigate(-1)}>
                                <ArrowBack />
                            </IconButton>
                            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                Settings
                            </Typography>
                        </Toolbar>
                    </AppBar>
                    <Box mt={7} />
                </>
            ) }
            <Container sx={{ pt: 3 }}>
                <Stack spacing={2} direction="row">
                    <div style={{
                        maxWidth: 250,
                        width: "100%",
                    }}>
                        <FancyList>
                            <ListItemButton onClick={() => navigate("/")}>
                                <ArrowBack style={{ color: theme.palette.text.secondary }} />
                                <Typography>Back to Home</Typography>
                            </ListItemButton>
                            <ListItemButton onClick={() => navigate("/settings/account")}
                                            selected={location.hash === "#/settings/account"}>
                                <AccountBalanceWalletOutlined />
                                <Typography>Account</Typography>
                            </ListItemButton>
                            <ListItemButton onClick={() => navigate("/settings/devices")}
                                            selected={location.hash === "#/settings/devices"}>
                                <DevicesOtherOutlined />
                                <Typography>Devices</Typography>
                            </ListItemButton>
                            <ListItemButton onClick={() => navigate("/settings/privacy")}
                                            selected={location.hash === "#/settings/privacy"}>
                                <SecurityOutlined />
                                <Typography>Privacy & Security</Typography>
                            </ListItemButton>
                            <ListItemButton onClick={() => navigate("/settings/storage")}
                                            selected={location.hash === "#/settings/storage"}>
                                <StorageOutlined />
                                <Typography>Data & Storage</Typography>
                            </ListItemButton>
                            <ListItemButton onClick={() => navigate("/settings/notifications")}
                                            selected={location.hash === "#/settings/notifications"}>
                                <Notifications />
                                <Typography>Notifications</Typography>
                            </ListItemButton>
                        </FancyList>
                    </div>
                    { x.children }
                </Stack>
            </Container>
        </>
    );
});

export const SettingsPage = () => {
    return <Navigate to="/settings/account" />;
};
