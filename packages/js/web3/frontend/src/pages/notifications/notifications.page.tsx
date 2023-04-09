import { Menu as MenuIcon, Tune } from "@mui/icons-material";
import { Box, useMediaQuery, AppBar, IconButton, Typography, useTheme, Toolbar } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { sessionManager } from "../../managers/session.manager";
import { BottomBarWidget } from "../../widgets/bottom-bar/index";
import { DrawerWidget } from "../../widgets/drawer/index";
import { HeaderWidget } from "../../widgets/header/index";
import { NotificationsList } from "../../widgets/header/notifications.widget";
import { ShareQrWidget } from "../../widgets/share-qr/share-qr.widget";

export const NotificationsPage = observer(() => {
    const [openCounter, setOpenCounter] = useState(0);
    const theme = useTheme();
    const canShowSidebar = useMediaQuery(theme.breakpoints.up("md"));
    const notifications = sessionManager.notifications.array;

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
                                Notifications
                            </Typography>
                            <div>
                                <IconButton size="large"
                                            color="inherit">
                                    <Tune />
                                </IconButton>
                            </div>
                        </Toolbar>
                    </AppBar>
                    <Box mt={7} />
                </>
            ) }
            <NotificationsList notifications={notifications} />
            <BottomBarWidget />
            <ShareQrWidget />
        </>
    );
});
