import { formatTemporal, temporalFormats } from "@hdapp/shared/web2-common/utils/temporal";
import {
    AddModeratorOutlined,
    Check,
    DoneAll,
    Menu as MenuIcon,
    PersonAdd,
    PersonSearchOutlined,
    QuestionMark,
    Sync,
    Tune,
} from "@mui/icons-material";
import {
    Box,
    useMediaQuery,
    AppBar,
    IconButton,
    Typography,
    useTheme,
    Toolbar,
    Stack,
    Button,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { sessionManager } from "../../managers/session.manager";
import { EventLogEntry } from "../../services/event-log.service";
import { trimWeb3Address } from "../../utils/trim-web3-address";
import { BottomBarWidget } from "../../widgets/bottom-bar/index";
import { DrawerWidget } from "../../widgets/drawer/index";
import { HeaderWidget } from "../../widgets/header/index";
import { ShareQrWidget } from "../../widgets/share-qr/share-qr.widget";

const columns: GridColDef<EventLogEntry>[] = [
    {
        field: "created_at",
        headerName: "Timestamp",
        width: 135,
        renderCell(params) {
            return formatTemporal(params.row.created_at);
        }
    },
    {
        field: "title",
        width: 200,
        headerName: "Title"
    },
    {
        field: "description",
        width: 350,
        headerName: "Description"
    },
    {
        field: "created_by",
        width: 250,
        headerName: "Creator",
        renderCell(params) {
            return trimWeb3Address(params.row.created_by);
        }
    }
];

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
            <List sx={{ width: "100%", flex: 1, minHeight: 400 }}>
                { notifications.length === 0 && (
                    <Stack justifyContent="center" alignItems="center" style={{ height: "100%", minHeight: 400 }}>
                        <DoneAll htmlColor={theme.palette.grey[400]} fontSize="large" />
                        <Typography align="center" color={theme.palette.grey[400]} sx={{ p: 2 }}>
                            Nothing to show for now
                        </Typography>
                    </Stack>
                ) }
                { notifications.map((n, i) => {
                    const iconBgColor = n.type === "connection_established"
                        ? theme.palette.info.main
                        : n.type === "record_permissions_granted"
                            ? theme.palette.success.main
                            : n.type === "user_connection_created"
                                ? theme.palette.primary.main
                                : n.type === "user_connection_requested"
                                    ? theme.palette.warning.dark
                                    : theme.palette.grey[600];

                    const icon = n.type === "connection_established"
                        ? <Sync />
                        : n.type === "record_permissions_granted"
                            ? <AddModeratorOutlined />
                            : n.type === "user_connection_created"
                                ? <PersonAdd />
                                : n.type === "user_connection_requested"
                                    ? <PersonSearchOutlined />
                                    : <QuestionMark />;

                    const title = n.type === "connection_established"
                        ? "Sync connection established"
                        : n.type === "record_permissions_granted"
                            ? "User granted access to their data"
                            : n.type === "user_connection_created"
                                ? `${trimWeb3Address(n.userAddress)} accepted your connection request`
                                : n.type === "user_connection_requested"
                                    ? "A user wants to connect with you"
                                // @ts-ignore
                                    : n.type;

                    const description = n.type === "connection_established"
                        ? `Device ${n.deviceName} of user ${n.user} has established a peer-to-peer connection with you.`
                        : n.type === "record_permissions_granted"
                            ? `User ${n.ownerName} has shared with you their medical record.`
                            : n.type === "user_connection_created"
                                ? "You can now exchange medical data with them and they can request medical data from you."
                                : n.type === "user_connection_requested"
                                    ? `User with address ${trimWeb3Address(n.userAddress)} wants to connect with you. Only accept connection requests from people you know.`
                                // @ts-ignore
                                    : n.type;
                    return (
                        <ListItem alignItems="flex-start"
                                  key={i}>
                            <ListItemAvatar>
                                <Avatar sx={{ background: iconBgColor }}>{ icon }</Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={(
                                <Stack spacing={2} alignItems="center" direction="row">
                                    <Typography noWrap>{ title }</Typography>
                                    <Typography fontSize={12} color="text.secondary" sx={{ marginLeft: "auto", flexShrink: 0 }}
                                                align="right" noWrap>
                                        { formatTemporal(n.created_at, temporalFormats.ddMMyyyyHHmmss) }
                                    </Typography>
                                </Stack>
                            )} secondary={(
                                <Stack spacing={1}>
                                    <Typography color="text.secondary" fontSize={14}>{ description }</Typography>
                                    { n.type === "user_connection_requested" && (
                                        <Stack alignItems="center" direction="row" spacing={1}>
                                            <Button variant="contained" disableElevation size="small" color="success"
                                                    startIcon={<Check />}
                                                    onClick={() => {
                                                        void sessionManager.web3.accessControlManager
                                                            .addUserConnection(n.userAddress);
                                                    }}>Accept</Button>
                                            <Button size="small" color="error">Ignore</Button>
                                        </Stack>
                                    ) }
                                </Stack>
                            )} />
                        </ListItem>
                    );
                }) }
            </List>
            <BottomBarWidget />
            <ShareQrWidget />
        </>
    );
});
