import { LocalDate, LocalDateTime } from "@js-joda/core";
import { Upload } from "@mui/icons-material";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    TextField,
    Button,
    Stack,
    IconButton,
    Avatar,
    ButtonBase,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { observer } from "mobx-react-lite";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { ModalProvider } from "../App2";

export interface SetUserDataDialogResult {
    fullName: string
    birthDate: LocalDate
    avatar: Blob | null
}

export const SetUserDataDialog: FC<{ address: string; onClose(result: SetUserDataDialogResult): void }> = observer(x => {
    const [fullName, setFullName] = useState("");
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [avatar, setAvatar] = useState<Blob | null>(null);
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("sm"));
    const isMobileViewMd = useMediaQuery(theme.breakpoints.down("md"));

    useEffect(() => {
        const search = new URLSearchParams(location.search);
        const b64 = search.get("user");
        if (!b64)
            return;

        const user = JSON.parse(atob(b64));
        setBirthDate(new Date(user.birth_date));
        setFullName(user.full_name);
    }, [x.address]);

    function handleAvatarInputChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files![0];
        file && setAvatar(file);
    }

    return (
        <Dialog fullScreen={isMobileViewMd} disablePortal maxWidth="xs" {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                Set up your profile
            </DialogTitle>
            <DialogContent style={{
                margin: "auto",
                flex: "none"
            }}>
                <Stack spacing={4} alignItems="center">
                    <DialogContentText fontSize={14}>
                        Let's set up your personal profile! Please make sure the fields below accurately represent you.
                    </DialogContentText>
                    <Stack spacing={2} direction={isMobileView ? "column" : "row"} alignItems="center">
                        <ButtonBase sx={{ position: "relative", borderRadius: "50%" }}>
                            <Avatar sx={{ width: 128, height: 128 }} src={avatar ? URL.createObjectURL(avatar) : void 0} />
                            { !avatar && (
                                <IconButton disableRipple size="large"
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundColor: "rgba(0, 0, 0, 0.6)",
                                                color: "white",
                                            }}>
                                    <Stack alignItems="center">
                                        <Upload />
                                        <Typography fontWeight={500} fontSize={14} textTransform="uppercase">Upload</Typography>
                                    </Stack>
                                </IconButton>
                            ) }

                            <input type="file"
                                   style={{
                                       position: "absolute",
                                       top: 0,
                                       left: 0,
                                       right: 0,
                                       bottom: 0,
                                       opacity: 0
                                   }}
                                   onChange={handleAvatarInputChange} />
                        </ButtonBase>
                        <Stack spacing={2} alignItems="center">
                            <TextField autoFocus
                                       margin="none"
                                       label="Full name"
                                       fullWidth
                                       variant="outlined"
                                       value={fullName}
                                       InputProps={{ style: { textAlign: "center" } }}
                                       onChange={e => setFullName(e.target.value)} />
                            <DatePicker value={birthDate}
                                        onChange={setBirthDate}
                                        label="Date of birth"
                                        renderInput={params => <TextField margin="none" fullWidth {...params} InputProps={{ readOnly: true, ...(params.InputProps ?? {}) }} />} />
                        </Stack>
                    </Stack>
                    <Button variant="contained"
                            disabled={!birthDate || !fullName.trim()}
                            onClick={() => birthDate && x.onClose({ fullName, birthDate: LocalDateTime.parse(birthDate.toISOString().slice(0, -1)).toLocalDate(), avatar })}>Let's go</Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
});
