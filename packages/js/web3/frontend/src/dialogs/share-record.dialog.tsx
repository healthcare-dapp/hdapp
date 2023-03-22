import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { ArrowBack, Search, Share, TimerOutlined } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    TextField,
    Stack,
    IconButton,
    useMediaQuery,
    useTheme,
    Typography,
    FormControl,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    ListItemButton,
    Avatar,
    styled,
    Box,
    Backdrop,
    CircularProgress,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { ModalProvider } from "../App2";
import { sessionManager } from "../managers/session.manager";
import { fileService } from "../services/file.service";
import { ProfileEntry, profileService } from "../services/profile.service";
import { trimWeb3Address } from "../utils/trim-web3-address";

const getProfilesAction = new AsyncAction(profileService.searchProfiles);
const performShareAction = new AsyncAction(async (hash: string, address: string, expiryDuration: number, note: string) => {
    // await sessionManager.web3.accessControlManager
    return null;
});

const ContactsListWrapper = styled(Box)`
    flex-grow: 1;
    min-height: 150px;
    overflow-y: auto;
    overflow-y: overlay;
`;

export const ShareRecordDialog = observer<{ hash: string; onClose?(): void }>(x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [note, setNote] = useState("");
    const [query, setQuery] = useState("");
    const [expiryDuration, setExpiryDuration] = useState(60 * 60 * 24);
    const [contacts, setContacts] = useState<ProfileEntry[]>([]);
    const [contactAvatars, setContactAvatars] = useState<Record<string, string>>({});
    const [selectedContact, setSelectedContact] = useState<ProfileEntry>();
    useEffect(() => {
        (async () => {
            const profiles = await getProfilesAction.run({ filters: { query } }, sessionManager.encryption);
            setContacts(profiles);

            const avatars = await Promise.all(
                profiles
                    .filter(p => p.avatar_hash && !contactAvatars[p.avatar_hash])
                    .map(p => fileService.getFileBlob(p.avatar_hash!, sessionManager.encryption)
                        .then(f => ({ [p.avatar_hash!]: URL.createObjectURL(f) })))
            );
            setContactAvatars(Object.assign({}, ...avatars));
        })();
    }, [query]);

    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="xs"
                onClose={() => x.onClose?.()} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose?.()}>
                    <ArrowBack />
                </IconButton>
                Share medical record
            </DialogTitle>
            <DialogContent style={{
                flex: 1
            }}>
                <Stack spacing={2} alignItems="center" style={{ height: "100%" }}>
                    <DialogContentText fontSize={14}>
                        Select a user to share your medical record with:
                    </DialogContentText>
                    <TextField margin="dense"
                               placeholder="Search your contacts..."
                               type="password"
                               fullWidth
                               size="small"
                               InputProps={{ startAdornment: <Search fontSize="small" sx={{ color: "text.secondary", marginRight: "10px" }} /> }}
                               variant="outlined"
                               value={query}
                               onChange={e => setQuery(e.target.value)} />
                    <ContactsListWrapper>
                        { contacts.length ? (
                            <Stack>
                                { contacts.map(p => (
                                    <ListItemButton key={p.address} sx={{ px: 2, py: 1 }}
                                                    onClick={() => setSelectedContact(p)}
                                                    selected={selectedContact?.address === p.address}>
                                        <Stack direction="row" spacing={1}>
                                            <Avatar src={p.avatar_hash ? contactAvatars[p.avatar_hash] : void 0} />
                                            <Stack direction="column">
                                                <Typography fontSize="14px">{ p.full_name } <Typography color="text.secondary">({ trimWeb3Address(p.address) })</Typography></Typography>
                                                <Typography fontSize="12px" color="success.dark">online</Typography>
                                            </Stack>
                                        </Stack>
                                    </ListItemButton>
                                )) }
                            </Stack>
                        ) : (
                            <Typography fontSize="14px" align="center" color="text.secondary">
                                You do not have any contacts added.
                            </Typography>
                        ) }
                    </ContactsListWrapper>

                    <TextField autoFocus
                               margin="dense"
                               label="Additional note"
                               type="password"
                               fullWidth
                               multiline
                               minRows={2}
                               variant="outlined"
                               value={note}
                               size="small"
                               onChange={e => setNote(e.target.value)}
                               helperText="You can leave a note for the receipient alongside with your medical record" />
                    <FormControl size="small" fullWidth>
                        <InputLabel id="demo-multiple-chip-label">Expires in</InputLabel>
                        <Select labelId="demo-multiple-chip-label"
                                id="demo-multiple-chip"
                                value={expiryDuration}
                                onChange={e => {
                                    setExpiryDuration(+e.target.value);
                                }}
                                input={<OutlinedInput startAdornment={<TimerOutlined fontSize="small" sx={{ color: "text.secondary", marginRight: "10px" }} />} id="select-multiple-chip" label="Expires in" />}>
                            <MenuItem value={60 * 60 * 24}>
                                1 day
                            </MenuItem>
                            <MenuItem value={60 * 60 * 24 * 3}>
                                3 days
                            </MenuItem>
                            <MenuItem value={60 * 60 * 24 * 7}>
                                1 week
                            </MenuItem>
                            <MenuItem value={60 * 60 * 24 * 7}>
                                1 month
                            </MenuItem>
                            <MenuItem value={Infinity}>
                                Indefinitely
                            </MenuItem>
                        </Select>
                    </FormControl>
                    <LoadingButton variant="contained" disableElevation
                                   onClick={async () => {
                                       await performShareAction.run(x.hash, selectedContact!.address, expiryDuration, note);
                                       x.onClose?.();
                                   }}
                                   disabled={!selectedContact}
                                   startIcon={<Share />}
                                   loading={performShareAction.pending}
                                   color="success">
                        Share medical record
                    </LoadingButton>
                </Stack>
            </DialogContent>
            <Backdrop sx={{ color: "#fff", zIndex: theme => theme.zIndex.drawer + 1 }}
                      open={performShareAction.pending}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Dialog>
    );
});
