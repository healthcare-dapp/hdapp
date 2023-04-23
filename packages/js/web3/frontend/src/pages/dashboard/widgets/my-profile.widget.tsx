import { UsersService } from "@hdapp/shared/web2-common/api/services/users.service";
import { getRightOrFail } from "@hdapp/shared/web2-common/io-ts-utils/get-right";
import { web3AddressType } from "@hdapp/shared/web2-common/types/web3-address.type";
import { AsyncAction, formatTemporal, temporalFormats } from "@hdapp/shared/web2-common/utils";
import { Instant, LocalDate } from "@js-joda/core";
import { ExpandMore, AddPhotoAlternate, Edit, Check, LockOutlined, Add } from "@mui/icons-material";
import { Stack, Box, useTheme, Accordion, AccordionSummary, Typography, AccordionDetails, Avatar, Button, useMediaQuery, CircularProgress, TextField, MenuItem, Select, InputLabel, FormControl, FormControlLabel, Checkbox } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { SessionManager, sessionManager } from "../../../managers/session.manager";
import { ProfileEntry, ProfileForm } from "../../../services/profile.service";
import { useDatabase } from "../../../utils/use-database";

const getProfileAction = new AsyncAction((sm: SessionManager, address: string) =>
    sm.db.profiles.getProfile(address, sm.encryption));
const getFileBlobAction = new AsyncAction((sm: SessionManager, hash: string) =>
    sm.db.files.getFileBlob(hash, sm.encryption));

export const MyProfileWidget: FC = x => {
    const { account, db, encryption, wallet, web3 } = sessionManager;
    const theme = useTheme();
    const isAlwaysExpanded = useMediaQuery(theme.breakpoints.up("md"));
    const hasCondensedDetails = useMediaQuery(theme.breakpoints.up("sm"));
    const isChangeAvatarPositionAltered = useMediaQuery(theme.breakpoints.up("sm"));
    const [isExpanded, setIsExpanded] = useState(false);
    const [profile, setProfile] = useState<ProfileEntry>();
    const [avatarBlob, setAvatarBlob] = useState<Blob>();
    const [avatar, setAvatar] = useState<string>();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [profileForm, setProfileForm] = useState<ProfileForm>();

    useDatabase(async () => {
        const result = await getProfileAction.forceRun(sessionManager, wallet.address);
        setProfile(result);

        if (result.avatar_hash) {
            const blob = await getFileBlobAction.forceRun(sessionManager, result.avatar_hash);
            const url = URL.createObjectURL(blob);
            setAvatarBlob(blob);
            setAvatar(url);
        }
    }, ["profiles", "file_blobs"]);

    useEffect(() => {
        try {
            setIsPublic(account.isProfilePublic);
        } catch (e) {
            /**/
        }
    }, [account]);

    useEffect(() => {
        (async () => {
            const result = await getProfileAction.forceRun(sessionManager, wallet.address);
            setProfile(result);
            setProfileForm(result);
            setIsPublic(account.isProfilePublic);
        })();
    }, [isEditMode]);

    if (account.isLoading)
        return null;

    async function handleAvatarInputChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target!.files![0];
        if (!file) return;

        const fileHash = await db.files.uploadFile(
            file,
            wallet.address,
            encryption
        );
        await db.profiles.updateProfile(
            wallet.address,
            {
                ...profile!,
                avatar_hash: fileHash
            },
            encryption
        );
    }

    async function save() {
        if (!profileForm)
            return;

        setIsEditMode(false);
        await db.profiles.updateProfile(
            wallet.address,
            profileForm,
            encryption
        );

        const message = JSON.stringify({ timestamp: Instant.now().toString() });

        if (account.isProfilePublic !== isPublic) {
            if (isPublic)
                await account.makeProfilePublic();
            else
                await account.makeProfilePrivate();
        }

        const avatarUrl = await (avatarBlob
            ? new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = _e => resolve(reader.result as string);
                reader.onerror = _e => reject(reader.error);
                reader.onabort = _e => reject(new Error("Read aborted"));
                reader.readAsDataURL(avatarBlob);
            })
            : undefined);

        await UsersService.updatePublicProfile({
            address: getRightOrFail(web3AddressType.decode(wallet.address)),
            message,
            signed: await web3.signer.signMessage(message),
            public_profile: {
                ...profileForm.public_profile,
                avatar: avatarUrl
            }
        });
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
                                            &nbsp;
                                            { profile.birth_date.dayOfMonth() === LocalDate.now().dayOfMonth() && profile.birth_date.monthValue() === LocalDate.now().monthValue()
                                                && <span title="Happy birthday!">🎉</span> }
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
                                { isEditMode && account.isDoctor && (
                                    <FormControlLabel control={<Checkbox checked={isPublic} />}
                                                      label="Make my profile public"
                                                      onChange={() => setIsPublic(!isPublic)} />
                                ) }
                                { isPublic && (
                                    <Stack spacing={1}>
                                        { isEditMode ? (
                                            <TextField size="small" variant="outlined"
                                                       label="Public full name"
                                                       placeholder="unspecified"
                                                       value={profileForm?.public_profile?.full_name ?? null}
                                                       onChange={e => setProfileForm(o => ({ ...o!, public_profile: { ...o?.public_profile, full_name: e.target.value } }))} />
                                        ) : (
                                            <Typography>
                                                <b>Public full name:</b>
                                    &nbsp;
                                                { !hasCondensedDetails && <br /> }
                                                { profile.public_profile?.full_name ?? <i>unspecified</i> }
                                            </Typography>
                                        ) }
                                        { isEditMode ? (
                                            <TextField size="small" variant="outlined"
                                                       label="Areas of focus"
                                                       placeholder="unspecified"
                                                       value={profileForm?.public_profile?.areasOfFocus ?? null}
                                                       onChange={e => setProfileForm(o => ({ ...o!, public_profile: { ...o?.public_profile, areasOfFocus: e.target.value } }))} />
                                        ) : (
                                            <Typography>
                                                <b>Areas of focus:</b>
                                    &nbsp;
                                                { !hasCondensedDetails && <br /> }
                                                { profile.public_profile?.areasOfFocus ?? <i>unspecified</i> }
                                            </Typography>
                                        ) }
                                        { isEditMode ? (
                                            <TextField size="small" variant="outlined"
                                                       label="Specialty"
                                                       placeholder="unspecified"
                                                       value={profileForm?.public_profile?.specialty ?? null}
                                                       onChange={e => setProfileForm(o => ({ ...o!, public_profile: { ...o?.public_profile, specialty: e.target.value } }))} />
                                        ) : (
                                            <Typography>
                                                <b>Specialty:</b>
                                    &nbsp;
                                                { !hasCondensedDetails && <br /> }
                                                { profile.public_profile?.specialty ?? <i>unspecified</i> }
                                            </Typography>
                                        ) }
                                        { isEditMode ? (
                                            <TextField size="small" variant="outlined"
                                                       label="Location"
                                                       placeholder="unspecified"
                                                       value={profileForm?.public_profile?.location ?? null}
                                                       onChange={e => setProfileForm(o => ({ ...o!, public_profile: { ...o?.public_profile, location: e.target.value } }))} />
                                        ) : (
                                            <Typography>
                                                <b>Location:</b>
                                    &nbsp;
                                                { !hasCondensedDetails && <br /> }
                                                { profile.public_profile?.location ?? <i>unspecified</i> }
                                            </Typography>
                                        ) }
                                        { isEditMode ? (
                                            <TextField size="small" variant="outlined"
                                                       label="Languages"
                                                       placeholder="unspecified"
                                                       value={profileForm?.public_profile?.languages ?? null}
                                                       onChange={e => setProfileForm(o => ({ ...o!, public_profile: { ...o?.public_profile, languages: e.target.value.split(", ") } }))} />
                                        ) : (
                                            <Typography>
                                                <b>Languages:</b>
                                    &nbsp;
                                                { !hasCondensedDetails && <br /> }
                                                { profile.public_profile?.languages ?? <i>unspecified</i> }
                                            </Typography>
                                        ) }
                                        <Typography variant="subtitle2">Contact information</Typography>
                                        { profileForm?.public_profile?.socials?.map((social, index) => (
                                            <Stack direction="row" spacing={1} key={index}>
                                                { isEditMode ? (
                                                    <>
                                                        <TextField size="small" variant="outlined"
                                                                   label="Name"
                                                                   style={{ flex: 1 }}
                                                                   value={social.name ?? null}
                                                                   onChange={e => setProfileForm(o => ({ ...o!, public_profile: { ...o?.public_profile, socials: profileForm?.public_profile?.socials.map((s, i) => i === index ? ({ ...s, name: e.target.value }) : s) } }))} />
                                                        <TextField size="small" variant="outlined"
                                                                   label="Value"
                                                                   style={{ flex: 1 }}
                                                                   value={social.value ?? null}
                                                                   onChange={e => setProfileForm(o => ({ ...o!, public_profile: { ...o?.public_profile, socials: profileForm?.public_profile?.socials.map((s, i) => i === index ? ({ ...s, value: e.target.value }) : s) } }))} />
                                                    </>
                                                ) : (
                                                    <Typography>
                                                        <b>{ social.name }:</b>
                                    &nbsp;
                                                        { !hasCondensedDetails && <br /> }
                                                        { social.value }
                                                    </Typography>
                                                ) }
                                            </Stack>
                                        )) }
                                        { isEditMode && <Button variant="outlined" startIcon={<Add />} onClick={() => setProfileForm(o => ({ ...o!, public_profile: { ...o?.public_profile, socials: [...(profileForm?.public_profile?.socials ?? []), { name: "", value: "" }] } }))}>Add new</Button> }
                                    </Stack>
                                ) }
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
                                    onClick={save}>Save changes</Button>
                        </>
                    ) }
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
};
