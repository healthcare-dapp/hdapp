import { formatTemporal } from "@hdapp/shared/web2-common/utils";
import { LocalDateTime } from "@js-joda/core";
import { ComputerOutlined, Edit, LinkOff } from "@mui/icons-material";
import { Avatar, Box, Button, Card, Stack, Typography, useTheme } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { sessionManager } from "../../managers/session.manager";
import { DeviceEntry } from "../../services/device.service";
import { useDatabase } from "../../utils/use-database";
import { SettingsPageBase } from "./settings.page";

export const DevicesSettingsPage = observer(() => {
    const { db, encryption, wallet, device, webrtc } = sessionManager;
    const theme = useTheme();

    const [devices, setDevices] = useState<DeviceEntry[]>([]);

    useDatabase(async () => {
        const deviceEntries = await db.devices.searchDevices({}, encryption);
        setDevices(deviceEntries);
    }, ["devices"]);

    const myDevices = devices.filter(d => d.owned_by === wallet.address && d.hash !== device.hash);
    const othersDevices = devices.filter(d => d.owned_by !== wallet.address);

    return (
        <SettingsPageBase>
            <Stack spacing={1} flex={1}>
                <Typography variant="h6">
                    Current device
                </Typography>
                <Card variant="outlined">
                    <Stack alignItems="center" direction="row" spacing={1} p={2}>
                        <Avatar sx={{ backgroundColor: theme.palette.success.main }}><ComputerOutlined /></Avatar>
                        <Stack>
                            <Typography fontSize={16} fontWeight={500}>{ device.friendly_name }</Typography>
                            <Typography fontSize={12}>Added at: { formatTemporal(device.added_at) }</Typography>
                        </Stack>
                        <Box flex={1} />
                        <Button variant="outlined" startIcon={<Edit />}>
                            Rename device
                        </Button>
                    </Stack>
                </Card>
                <br />
                <Typography variant="h6">
                    My other devices
                </Typography>
                <Card variant="outlined">
                    <Stack spacing={1} p={2}>
                        { myDevices.length
                            ? myDevices.map(dev => (
                                <Stack alignItems="flex-start" direction="row"
                                       key={dev.hash} spacing={1}>
                                    <Avatar sx={{
                                        backgroundColor: webrtc.onlinePeerDevices.includes(dev.hash)
                                            ? theme.palette.primary.main
                                            : theme.palette.grey[500]
                                    }}><ComputerOutlined /></Avatar>
                                    <Stack>
                                        <Typography fontSize={16} fontWeight={500}>{ dev.friendly_name }</Typography>
                                        <Typography fontSize={12}>
                                            { webrtc.onlinePeerDevices.includes(dev.hash)
                                                ? <span style={{ color: theme.palette.success.main }}>online</span>
                                                : dev.last_active_at.isEqual(LocalDateTime.MIN)
                                                    ? "Not contacted yet"
                                                    : <>Last online at: { formatTemporal(dev.last_active_at) } </> }
                                        </Typography>
                                        <Typography fontSize={12}>Added at: { formatTemporal(dev.added_at) }</Typography>
                                    </Stack>
                                    <Box flex={1} />
                                    <Button variant="outlined" color="error" startIcon={<LinkOff />} sx={{ margin: "2px 0" }}>
                                        Unpair
                                    </Button>
                                </Stack>
                            ))
                            : <Typography color="text.secondary" align="center">No devices registered.</Typography> }
                    </Stack>
                </Card>
                <br />
                <Typography variant="h6">
                    Other users' devices
                </Typography>
                <Card variant="outlined">
                    <Stack spacing={1} p={2}>
                        { othersDevices.length
                            ? othersDevices.map(dev => (
                                <Stack alignItems="flex-start" direction="row"
                                       key={dev.hash} spacing={1}>
                                    <Avatar sx={{
                                        backgroundColor: webrtc.onlinePeerDevices.includes(dev.hash)
                                            ? theme.palette.primary.main
                                            : theme.palette.grey[500]
                                    }}><ComputerOutlined /></Avatar>
                                    <Stack>
                                        <Typography fontSize={16} fontWeight={500}>{ dev.friendly_name }</Typography>
                                        <Typography fontSize={12}>
                                            { webrtc.onlinePeerDevices.includes(dev.hash)
                                                ? <span style={{ color: theme.palette.success.main }}>online</span>
                                                : dev.last_active_at.isEqual(LocalDateTime.MIN)
                                                    ? "Not contacted yet"
                                                    : <>Last online at: { formatTemporal(dev.last_active_at) } </> }
                                        </Typography>
                                        <Typography fontSize={12}>Added at: { formatTemporal(dev.added_at) }</Typography>
                                    </Stack>
                                    <Box flex={1} />
                                    <Button variant="outlined" color="error" startIcon={<LinkOff />} sx={{ margin: "2px 0" }}>
                                        Unpair
                                    </Button>
                                </Stack>
                            ))
                            : <Typography color="text.secondary" align="center">No devices registered.</Typography> }
                    </Stack>
                </Card>
            </Stack>
        </SettingsPageBase>
    );
});
