import { AsyncAction, formatTemporal, temporalFormats } from "@hdapp/shared/web2-common/utils";
import { LocalDate } from "@js-joda/core";
import { ExpandMore, AddPhotoAlternate, Edit, Check, LockOutlined } from "@mui/icons-material";
import { Stack, Box, useTheme, Accordion, AccordionSummary, Typography, AccordionDetails, Avatar, Button, useMediaQuery, CircularProgress, TextField, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { ChangeEvent, FC, useState } from "react";
import { sessionManager } from "../../../managers/session.manager";
import { fileService } from "../../../services/file.service";
import { ProfileEntry, ProfileForm, profileService } from "../../../services/profile.service";
import { useDatabase } from "../../../utils/use-database";

const getProfileAction = new AsyncAction(profileService.getProfile);
const getFileBlobAction = new AsyncAction(fileService.getFileBlob);

export const MyProfileWidget: FC = x => {
    const theme = useTheme();
    const isAlwaysExpanded = useMediaQuery(theme.breakpoints.up("md"));
    const hasCondensedDetails = useMediaQuery(theme.breakpoints.up("sm"));
    const isChangeAvatarPositionAltered = useMediaQuery(theme.breakpoints.up("sm"));
    const [isExpanded, setIsExpanded] = useState(false);
    const [profile, setProfile] = useState<ProfileEntry>();
    const [avatar, setAvatar] = useState<string>();
    const [isEditMode, setIsEditMode] = useState(false);
    const [profileForm, setProfileForm] = useState<ProfileForm>();

    useDatabase(async () => {
        const result = await getProfileAction.forceRun(sessionManager.wallet.address, sessionManager.encryption);
        setProfile(result);

        if (result.avatar_hash) {
            const avatarBlob = await getFileBlobAction.forceRun(result.avatar_hash, sessionManager.encryption);
            const url = URL.createObjectURL(avatarBlob);
            setAvatar(url);
        }
    }, ["profiles", "file_blobs"]);

    async function handleAvatarInputChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target!.files![0];
        if (!file) return;

        const fileHash = await fileService.uploadFile(
            file,
            sessionManager.wallet.address,
            sessionManager.encryption
        );
        await profileService.updateProfile(
            sessionManager.wallet.address,
            {
                ...profile!,
                avatar_hash: fileHash
            },
            sessionManager.encryption
        );
    }

    return (
        <Accordion variant="outlined" expanded={isAlwaysExpanded || isExpanded}
                   onChange={() => setIsExpanded(v => !v)}
                   style={{ borderRadius: "4px" }}>
            <AccordionSummary expandIcon={!isAlwaysExpanded ? <ExpandMore /> : void 0}
                              aria-controls="panel1bh-content"
                              id="panel1bh-header"
                              sx={{ alignItems: "center", height: 38 }}
                              classes={{ content: "summary" }}>
                <Stack direction="row" spacing={0.5} width="100%">
                    <Typography fontSize={16} fontWeight={500} component="div">
                        My profile
                    </Typography>
                    <Box flexGrow={1} />
                    { isAlwaysExpanded && (
                        <>
                            <LockOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                            <Typography color="text.secondary" fontSize={12}>
                                <i>Visible only to your contacts</i>
                            </Typography>
                        </>
                    ) }
                </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
                <Stack direction={hasCondensedDetails ? "row" : "column"}
                       spacing={3} sx={{ pl: 3, pr: 1, pt: 0, pb: 1 }}
                       alignItems={hasCondensedDetails ? "flex-start" : "center"}>
                    <Avatar sx={{ width: 160, height: 160 }}
                            src={avatar} />
                    { getProfileAction.pending
                        ? <CircularProgress style={{ alignSelf: "center", margin: "40px 0" }} />
                        : profile ? (
                            <Stack spacing={2} sx={{ flexGrow: 1, height: "100%" }}>
                                <Stack textAlign={!hasCondensedDetails ? "center" : "left"}>
                                    { isEditMode ? (
                                        <TextField size="small" variant="outlined"
                                                   label="Full name"
                                                   placeholder="Will Smith"
                                                   value={profileForm?.full_name}
                                                   onChange={e => setProfileForm(o => ({ ...o!, full_name: e.target.value }))} />
                                    ) : (
                                        <Typography variant="h6">
                                            { profile.full_name }
                                        </Typography>
                                    ) }
                                    { /* <Typography variant="subtitle2" color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                        Also known as: Гарифуллин Руслан Ильфатович
                                    </Typography> */ }
                                </Stack>
                                <Box sx={{ display: "grid", gridTemplateRows: "1fr 1fr 1fr", gap: 1, gridAutoFlow: "column" }}>
                                    { isEditMode ? (
                                        <FormControl size="small">
                                            <InputLabel id="gender-select">Gender</InputLabel>
                                            <Select value={profileForm?.gender}
                                                    labelId="gender-select"
                                                    onChange={e => setProfileForm(o => ({ ...o!, gender: e.target.value }))}
                                                    label="Gender"
                                                    placeholder="not specified">
                                                <MenuItem value="Male">Male</MenuItem>
                                                <MenuItem value="Female">Female</MenuItem>
                                                <MenuItem value="Non-binary">Non-binary</MenuItem>
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        <Typography>
                                            <b>Gender:</b>
                                            &nbsp;
                                            { !hasCondensedDetails && <br /> }
                                            { profile.gender ?? <i>unspecified</i> }
                                        </Typography>
                                    ) }
                                    { isEditMode ? (
                                        <DatePicker value={profileForm ? new Date(profileForm.birth_date.toString()) : void 0}
                                                    onChange={value => setProfileForm(o => ({ ...o!, birth_date: LocalDate.parse(value!.toISOString().slice(0, 10)) }))}
                                                    label="Date of birth"
                                                    slotProps={{ textField: { size: "small" } }}
                                                    renderInput={params => <TextField margin="none" {...params} size="small" variant="outlined" InputProps={{ readOnly: true, ...(params.InputProps ?? {}), size: "small" }} />} />
                                    ) : (
                                        <Typography>
                                            <b>Date of birth:</b>
                                        &nbsp;
                                            { !hasCondensedDetails && <br /> }
                                            { formatTemporal(profile.birth_date, temporalFormats.MMMddyyyy) }
                                        </Typography>
                                    ) }
                                    { isEditMode ? (
                                        <FormControl size="small">
                                            <InputLabel id="blood_type-select">Blood type</InputLabel>
                                            <Select value={profileForm?.blood_type}
                                                    labelId="blood_type-select"
                                                    onChange={e => setProfileForm(o => ({ ...o!, blood_type: e.target.value }))}
                                                    label="Blood type"
                                                    placeholder="not specified">
                                                <MenuItem value="A+">A+</MenuItem>
                                                <MenuItem value="A-">A-</MenuItem>
                                                <MenuItem value="B+">B+</MenuItem>
                                                <MenuItem value="B-">B-</MenuItem>
                                                <MenuItem value="O+">O+</MenuItem>
                                                <MenuItem value="O-">O-</MenuItem>
                                                <MenuItem value="AB+">AB+</MenuItem>
                                                <MenuItem value="AB-">AB-</MenuItem>
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        <Typography>
                                            <b>Blood type:</b>
                                        &nbsp;
                                            { !hasCondensedDetails && <br /> }
                                            { profile.blood_type ?? <i>unspecified</i> }
                                        </Typography>
                                    ) }
                                    { isEditMode ? (
                                        <TextField size="small" variant="outlined"
                                                   label="Height"
                                                   placeholder="-"
                                                   style={{ width: 140 }}
                                                   InputProps={{ endAdornment: <span style={{ marginLeft: "14px" }}>cm</span> }}
                                                   value={profileForm?.height}
                                                   type="number"
                                                   onChange={e => setProfileForm(o => ({ ...o!, height: parseInt(e.target.value) }))} />
                                    ) : (
                                        <Typography>
                                            <b>Height:</b>
                                        &nbsp;
                                            { !hasCondensedDetails && <br /> }
                                            { profile.height ? `${profile.height} cm` : <i>unspecified</i> }
                                        </Typography>
                                    ) }
                                    { isEditMode ? (
                                        <TextField size="small" variant="outlined"
                                                   label="Weight"
                                                   placeholder="-"
                                                   style={{ width: 140 }}
                                                   InputProps={{ endAdornment: <span style={{ marginLeft: "14px" }}>kg</span> }}
                                                   value={profileForm?.weight}
                                                   type="number"
                                                   onChange={e => setProfileForm(o => ({ ...o!, weight: parseInt(e.target.value) }))} />
                                    ) : (
                                        <Typography>
                                            <b>Weight:</b>
                                        &nbsp;
                                            { !hasCondensedDetails && <br /> }
                                            { profile.weight ? `${profile.weight} kg` : <i>unspecified</i> }
                                        </Typography>
                                    ) }
                                </Box>
                            </Stack>
                        ) : <Typography color="error" align="center" style={{ alignSelf: "center", justifyContent: "center", padding: "20px 0" }}>There was an error loading your profile.</Typography> }
                </Stack>
                <Stack p={1} direction="row">
                    { isChangeAvatarPositionAltered ? (
                        <Box textAlign="center"
                             width="160px"
                             ml={2}>
                            <Button size="small" startIcon={<AddPhotoAlternate />}>
                                Change Avatar
                                <input type="file"
                                       style={{
                                           position: "absolute",
                                           left: 0,
                                           top: 0,
                                           width: "100%",
                                           height: "100%",
                                           opacity: 0
                                       }}
                                       onChange={handleAvatarInputChange} />
                            </Button>
                        </Box>
                    ) : (
                        <Button size="small" startIcon={<AddPhotoAlternate />}>
                            Change Avatar
                            <input type="file"
                                   style={{
                                       position: "absolute",
                                       left: 0,
                                       top: 0,
                                       width: "100%",
                                       height: "100%",
                                       opacity: 0
                                   }}
                                   onChange={handleAvatarInputChange} />
                        </Button>
                    ) }
                    { !isEditMode && (
                        <Button size="small" startIcon={<Edit />}
                                style={{ marginLeft: "auto" }}
                                onClick={() => {
                                    setIsEditMode(true);
                                    setProfileForm(profile!);
                                }}>Edit</Button>
                    ) }
                    { isEditMode && (
                        <>
                            <Button size="small"
                                    style={{ marginLeft: "auto" }}
                                    onClick={() => {
                                        setIsEditMode(false);
                                    }}>Cancel editing</Button>
                            <Button size="small" variant="contained" disableElevation color="success"
                                    startIcon={<Check />}
                                    sx={{ ml: 1 }}
                                    onClick={() => {
                                        if (!profileForm) return;

                                        setIsEditMode(false);
                                        void profileService.updateProfile(
                                            sessionManager.wallet.address,
                                            profileForm,
                                            sessionManager.encryption
                                        );
                                    }}>Save changes</Button>
                        </>
                    ) }
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
};
