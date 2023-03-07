import { Check, DeleteOutline, DoneAll, Notifications, PersonAdd, Sync, Tune } from "@mui/icons-material";
import { IconButton, Badge, Popover, Typography, Stack, Box, Button, List, Avatar, ListItem, ListItemAvatar, ListItemText, useTheme, useMediaQuery } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Notification } from "../../managers/web3.manager";

export const HeaderNotificationsWidget = observer(() => {
    // const { notifications } = Web3Manager;
    const notifications: Notification[] = [];
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
                <Badge badgeContent={4} color="error">
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
                    { notifications.map((n, i) => (
                        <ListItem alignItems="flex-start"
                                  key={i}>
                            <ListItemAvatar>
                                <Avatar sx={{ background: n.title.includes("Sync") ? theme.palette.success.light : void 0 }}>{ n.title.includes("Sync") ? <Sync /> : <PersonAdd /> }</Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={(
                                <Stack alignItems="center" direction="row">
                                    <Typography>{ n.title }</Typography>
                                    <Typography fontSize={12} color="text.secondary" sx={{ marginLeft: "auto" }}>3 hours ago</Typography>
                                </Stack>
                            )} secondary={(
                                <Stack spacing={1}>
                                    <Typography color="text.secondary" fontSize={14}>{ n.description }</Typography>
                                    { n.title.includes("Incoming") && (
                                        <Stack alignItems="center" direction="row" spacing={1}>
                                            <Button variant="contained" disableElevation size="small" color="success"
                                                    startIcon={<Check />}>Accept</Button>
                                            <Button size="small" color="error">Ignore</Button>
                                        </Stack>
                                    ) }
                                </Stack>
                            )} />
                        </ListItem>
                    )) }
                </List>
            </Popover>
        </>
    );
});
