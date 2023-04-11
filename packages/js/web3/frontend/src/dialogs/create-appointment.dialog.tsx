import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { LocalDate, LocalTime } from "@js-joda/core";
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
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
import { ModalProvider } from "../App2";
import { sessionManager } from "../managers/session.manager";

const createAppointmentAction = new AsyncAction(async () => {
});

export const CreateAppointmentDialog: FC<{ onClose?(): void }> = observer(x => {
    const { wallet } = sessionManager;
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [date, setDate] = useState<LocalDate>();
    const [time, setTime] = useState<LocalTime>();

    async function handleCreateAppointment() {
        const block = await createAppointmentAction.run();
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
                <DatePicker value={date ? new Date(date.toString()) : void 0}
                            onChange={e => e && setDate(LocalDate.parse(e.toISOString()))}
                            label="Date of meeting"
                            renderInput={params => <TextField required margin="none" fullWidth {...params} InputProps={{ readOnly: true, ...(params.InputProps ?? {}) }} />} />
                <TimePicker slotProps={{ textField: { label: "Time of meeting", required: true } }}
                            onChange={e => e && setTime(LocalTime.parse(e.toISOString()))}
                            value={time ? new Date(time.toString()) : void 0} />
                <Stack spacing={1} direction="row">
                    <Box flexGrow={1} />
                    <Button color="error" onClick={() => x.onClose?.()}>Discard changes</Button>
                    <Button variant="contained" disableElevation startIcon={<Add />}
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
