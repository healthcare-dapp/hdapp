import { AsyncAction } from "@hdapp/shared/web2-common/utils/async-action";
import { formatTemporal } from "@hdapp/shared/web2-common/utils/temporal";
import { LocalDateTime } from "@js-joda/core";
import { Add, CalendarMonthOutlined, CorporateFareOutlined, Menu as MenuIcon } from "@mui/icons-material";
import {
    Box,
    Container,
    useMediaQuery,
    AppBar,
    IconButton,
    Typography,
    useTheme,
    Toolbar,
    Paper,
    Button,
    Card,
    Avatar,
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { Stack } from "@mui/system";
import { DateCalendar } from "@mui/x-date-pickers";
import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
import { ModalProvider } from "../../App2";
import { CreateAppointmentDialog } from "../../dialogs/create-appointment.dialog";
import { sessionManager } from "../../managers/session.manager";
import { AppointmentEntry, appointmentService } from "../../services/appointment.service";
import { fileService } from "../../services/file.service";
import { ProfileEntry, profileService } from "../../services/profile.service";
import { trimWeb3Address } from "../../utils/trim-web3-address";
import { useDatabase } from "../../utils/use-database";
import { BottomBarWidget } from "../../widgets/bottom-bar";
import { DrawerWidget } from "../../widgets/drawer";
import { HeaderWidget } from "../../widgets/header";
import { ShareQrWidget } from "../../widgets/share-qr/share-qr.widget";

type AppointmentFull = AppointmentEntry & {
    created_by_full?: ProfileEntry & {
        avatar_url?: string
    }
};

const getAppointmentsAction = new AsyncAction(appointmentService.searchAppointments);

const AppointmentItem: FC<{ appointment: AppointmentFull }> = x => {
    const theme = useTheme();
    return (
        <Card variant="outlined">
            <Stack spacing={1} sx={{ p: 2 }}>
                <Stack direction="row">
                    <Stack>
                        <Typography fontSize={24}>{ x.appointment.title }</Typography>
                        <Typography fontSize={14} color="text.secondary">Created on { formatTemporal(x.appointment.created_at) }</Typography>
                    </Stack>
                    <Box flex={1} />
                    <Stack justifyContent="flex-end">
                        <Typography align="right" fontSize={14}>Planned at</Typography>
                        <Typography align="right" fontSize={24}>{ formatTemporal(x.appointment.dateTime) }</Typography>
                    </Stack>
                </Stack>
                <Typography fontSize={14}>{ x.appointment.description }</Typography>
                <span />
                <Grid2 container>
                    <Grid2 xs={6}>
                        <Stack spacing={1}>
                            <Typography fontSize={12} color="text.secondary">Invited by</Typography>
                            {
                                x.appointment.created_by_full ? (
                                    <Stack spacing={1} direction="row" alignItems="center" width="100%">
                                        <Avatar sx={{ background: theme.palette.success.light, width: 40, height: 40 }}
                                                src={x.appointment.created_by_full.avatar_url} />
                                        <Stack direction="column" alignItems="flex-start" width={0} flexGrow={1}>
                                            <Typography variant="subtitle2">
                                                { x.appointment.created_by_full.full_name }
                                            </Typography>
                                            <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400 }}>
                                                { trimWeb3Address(x.appointment.created_by_full.address) }
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                ) : (
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400 }}>
                                        { trimWeb3Address(x.appointment.created_by) }
                                    </Typography>
                                )
                            }
                        </Stack>
                    </Grid2>
                    <Grid2 xs={6}>
                        <Stack spacing={1}>
                            <Typography fontSize={12} color="text.secondary">Location</Typography>
                            <Stack spacing={1} direction="row" alignItems="center" width="100%">
                                <Avatar sx={{ background: theme.palette.primary.light, width: 40, height: 40 }}>
                                    <CorporateFareOutlined />
                                </Avatar>
                                <Typography variant="subtitle2">
                                    { x.appointment.location }
                                </Typography>
                            </Stack>
                        </Stack>
                    </Grid2>
                </Grid2>
            </Stack>
        </Card>
    );
};

export const AppointmentsPage = observer(() => {
    const [openCounter, setOpenCounter] = useState(0);
    const theme = useTheme();
    const canShowSidebar = useMediaQuery(theme.breakpoints.up("md"));

    const [appointments, setAppointments] = useState<AppointmentFull[]>([]);

    useDatabase(async () => {
        const entries = await getAppointmentsAction.run({ sort_by: "created_at" }, sessionManager.encryption);
        const fullEntries = await Promise.all(
            entries.map(async entry => {
                return {
                    ...entry,
                    created_by_full: await profileService.getProfile(entry.created_by, sessionManager.encryption)
                        .then(async profile => {
                            return {
                                ...profile,
                                avatar_url: profile.avatar_hash
                                    ? await fileService.getFileBlob(profile.avatar_hash, sessionManager.encryption)
                                        .then(blob => URL.createObjectURL(blob))
                                        .catch(() => void 0)
                                    : void 0
                            };
                        })
                        .catch(() => void 0)
                };
            })
        );
        setAppointments(fullEntries);
    });

    const relevantAppointments = appointments.filter(a => a.dateTime.isAfter(LocalDateTime.now()));
    const pastAppointments = appointments.filter(a => !a.dateTime.isAfter(LocalDateTime.now()));

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
                <Stack spacing={2} direction={canShowSidebar ? "row" : "column"}>
                    <Stack spacing={2} flexGrow={1}>
                        <Stack alignItems="center" direction="row" spacing={1} mb={2}>
                            <Typography variant="h4" fontSize={32}>My appointments</Typography>
                            <Box flex={1} />
                            <Button variant="contained" disableElevation startIcon={<Add />}
                                    onClick={() => ModalProvider.show(CreateAppointmentDialog)}>
                                Create a new appointment
                            </Button>
                        </Stack>
                        { relevantAppointments.length
                            ? relevantAppointments.map(app => (
                                <AppointmentItem appointment={app} key={app.hash} />
                            )) : (
                                <Typography color="text.secondary" style={{ marginBottom: "64px" }}>
                                    You have no upcoming appointments planned.
                                </Typography>
                            ) }
                        <Typography fontSize={24}>
                            Past appointments
                        </Typography>
                        { pastAppointments.length
                            ? pastAppointments.map(app => (
                                <AppointmentItem appointment={app} key={app.hash} />
                            )) : (
                                <Typography color="text.secondary">
                                    You have no past appointments.
                                </Typography>
                            ) }
                    </Stack>
                    <Stack spacing={2}>
                        <Paper variant="outlined">
                            <DateCalendar />
                        </Paper>
                    </Stack>
                </Stack>
            </Container>
            <BottomBarWidget />
            <ShareQrWidget />
        </>
    );
});
