import { formatTemporal, temporalFormats } from "@hdapp/shared/web2-common/utils/temporal";
import { AddModeratorOutlined, Check, DeleteOutline, DoneAll, Notifications, PersonAdd, PersonSearchOutlined, QuestionMark, Sync, Tune } from "@mui/icons-material";
import { IconButton, Badge, Popover, Typography, Stack, Box, Button, List, Avatar, ListItem, ListItemAvatar, ListItemText, useTheme, useMediaQuery } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { sessionManager } from "../../managers/session.manager";
import { trimWeb3Address } from "../../utils/trim-web3-address";

export const HeaderNotificationsWidget = observer(() => {
    const notifications = sessionManager.notifications.array;
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const theme = useTheme();
    const canShowClearAllText = useMediaQuery(theme.breakpoints.up("sm"));

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? "notifications" : undefined;

    return (
        <>
            <IconButton aria-label="notifications"
                        aria-describedby={id}
                        onClick={handleClick}>
                <Badge badgeContent={notifications.length} color="error">
                    <Notifications />
                </Badge>
            </IconButton>
            <Popover id={id}
                     open={open}
                     anchorEl={anchorEl}
                     onClose={handleClose}
                     anchorOrigin={{
                         vertical: "bottom",
                         horizontal: "right",
                     }}
                     transformOrigin={{
                         vertical: "top",
                         horizontal: "right",
                     }}
                     PaperProps={{ style: { maxWidth: 500, width: "calc(100% - 32px)" } }}>
                <Stack sx={{ pt: 2, px: 2 }}
                       direction="row"
                       spacing={1}
                       alignItems="center">
                    <Typography variant="h6">Notifications</Typography>
                    <IconButton size="small">
                        <Tune fontSize="small" />
                    </IconButton>
                    <Box sx={{ flex: 1 }} />
                    { canShowClearAllText
                        ? (
                            <Button variant="outlined" startIcon={<DeleteOutline />}
                                    color="error"
                                    size="small"
                                    disabled={notifications.length === 0}>
                                Clear all
                            </Button>
                        )
                        : (
                            <IconButton color="error" size="small"><DeleteOutline /></IconButton>
                        ) }
                </Stack>
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
                                    <Stack alignItems="center" direction="row">
                                        <Typography>{ title }</Typography>
                                        <Typography fontSize={12} color="text.secondary" sx={{ marginLeft: "auto" }}>
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
            </Popover>
        </>
    );
});
