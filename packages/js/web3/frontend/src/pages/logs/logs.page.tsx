import { Menu as MenuIcon, Search, Tune } from "@mui/icons-material";
import { Box, Container, useMediaQuery, AppBar, IconButton, Typography, useTheme, Toolbar } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { BottomBarWidget } from "../../widgets/bottom-bar";
import { DrawerWidget } from "../../widgets/drawer";
import { HeaderWidget } from "../../widgets/header";

export const LogsPage = observer(() => {
    const [openCounter, setOpenCounter] = useState(0);
    const theme = useTheme();
    const navigate = useNavigate();
    const canShowSidebar = useMediaQuery(theme.breakpoints.up("md"));

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
                                Logs
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

            </Container>
            <BottomBarWidget />
        </>
    );
});
