import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { LocalDate, LocalDateTime, LocalTime } from "@js-joda/core";
import { Add, ArrowBack } from "@mui/icons-material";
import {
    Dialog,
    DialogTitle,
    Button,
    Stack,
    IconButton,
    Box,
    useMediaQuery,
    useTheme,
    TextField,
    Backdrop,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
import { ModalProvider } from "../App2";
import { sessionManager } from "../managers/session.manager";
import { appointmentService } from "../services/appointment.service";
import { ProfileEntry, profileService } from "../services/profile.service";
import { useDatabase } from "../utils/use-database";

const createAppointmentAction = new AsyncAction(appointmentService.addAppointment);

export const CreateAppointmentDialog: FC<{ onClose?(): void }> = observer(x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [date, setDate] = useState<LocalDate>();
    const [invitees, setInvitees] = useState<string[]>([]);
    const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
    const [time, setTime] = useState<LocalTime>();

    useDatabase(async () => {
        setProfiles(await profileService.searchProfiles({}, sessionManager.encryption));
    });

    async function handleCreateAppointment() {
        await createAppointmentAction.run(
            {
                created_by: sessionManager.wallet.address,
                dateTime: date!.atTime(time!),
                description,
                location,
                participant_ids: invitees,
                title: name
            },
            sessionManager.encryption
        );
        x.onClose?.();
    }

    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="sm" fullWidth onClose={() => x.onClose?.()}
                scroll={createAppointmentAction.pending ? "body" : "paper"} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose?.()}>
                    <ArrowBack />
                </IconButton>
                Create an appointment
            </DialogTitle>
            <Stack spacing={2} sx={{ p: 2, pt: 0 }}>
                <TextField required variant="outlined" label="Title"
                           value={name} onChange={e => setName(e.target.value)} />
                <TextField multiline minRows={2} variant="outlined" label="Description"
                           value={description} onChange={e => setDescription(e.target.value)} />
                <TextField required variant="outlined" label="Location"
                           value={location} onChange={e => setLocation(e.target.value)} />
                <DatePicker value={date ? new Date(date.toString()) : null}
                            onChange={e => e && setDate(LocalDateTime.parse(e.toISOString().replace("Z", "")).toLocalDate())}
                            label="Date of meeting"
                            renderInput={params => <TextField required margin="none" fullWidth {...params} InputProps={{ readOnly: true, ...(params.InputProps ?? {}) }} />} />
                <TimePicker slotProps={{ textField: { label: "Time of meeting", required: true } }}
                            onChange={e => e && setTime(LocalDateTime.parse(e.toISOString().replace("Z", "")).toLocalTime())}
                            value={time ? new Date(time.toString()) : null} />
                <FormControl size="small">
                    <InputLabel id="demo-simple-select-label">Invitee</InputLabel>
                    <Select labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={invitees[0] ?? null}
                            onChange={e => {
                                if (e)
                                    setInvitees([e.target.value]);
                            }}
                            label="Invitee">
                        <MenuItem value={undefined}><i>Unspecified</i></MenuItem>
                        { profiles.map(profile => (
                            <MenuItem key={profile.address} value={profile.address}>{ profile.full_name }</MenuItem>
                        )) }
                    </Select>
                </FormControl>
                <Stack spacing={1} direction="row">
                    <Box flexGrow={1} />
                    <Button color="error" onClick={() => x.onClose?.()}>Discard changes</Button>
                    <Button variant="contained" disableElevation startIcon={<Add />}
                            disabled={!date || !time || !name || !description || !location || !invitees.length}
                            onClick={handleCreateAppointment}>Create appointment</Button>
                </Stack>
            </Stack>
            { createAppointmentAction.pending && (
                <Backdrop sx={{ position: "absolute" }} open>
                    <CircularProgress />
                </Backdrop>
            ) }
        </Dialog>
    );
});
