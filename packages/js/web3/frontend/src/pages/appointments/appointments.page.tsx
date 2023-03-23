import { CalendarMonthOutlined, Menu as MenuIcon } from "@mui/icons-material";
import { Box, Container, useMediaQuery, AppBar, IconButton, Typography, useTheme, Toolbar, Paper } from "@mui/material";
import { Stack } from "@mui/system";
import { DateCalendar } from "@mui/x-date-pickers";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { BottomBarWidget } from "../../widgets/bottom-bar";
import { DrawerWidget } from "../../widgets/drawer";
import { HeaderWidget } from "../../widgets/header";

export const AppointmentsPage = observer(() => {
    const [openCounter, setOpenCounter] = useState(0);
    const theme = useTheme();
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
                                My appointments
                            </Typography>
                            <div>
                                <IconButton size="large"
                                            color="inherit">
                                    <CalendarMonthOutlined />
                                </IconButton>
                            </div>
                        </Toolbar>
                    </AppBar>
                    <Box mt={7} />
                </>
            ) }
            <Container sx={{ pt: 3 }}>
                <Stack spacing={2} direction="row">
                    <Stack spacing={2} flexGrow={1}>
                        <Typography variant="h4" mb={3} fontSize={32}>My appointments</Typography>
                        <Typography color="text.secondary">
                            You have no appointments planned.
                        </Typography>
                    </Stack>
                    <Stack spacing={2}>
                        <Paper variant="outlined">
                            <DateCalendar />
                        </Paper>
                    </Stack>
                </Stack>
            </Container>
            <BottomBarWidget />
        </>
    );
});
