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
    alpha,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { ModalProvider } from "../App2";
import { SessionManager, sessionManager } from "../managers/session.manager";
import { ProfileEntry, ProfileSearchRequest } from "../services/profile.service";
import { trimWeb3Address } from "../utils/trim-web3-address";

const getProfilesAction = new AsyncAction((sm: SessionManager, request: ProfileSearchRequest) =>
    sm.db.profiles.searchProfiles(request, sm.encryption));
const performShareAction = new AsyncAction(async (
    sm: SessionManager,
    hash: string,
    address: string,
    expiryDuration: number,
    noteText: string
) => {
    await sm.web3.accessControlManager.grantPermissions(
        address,
        hash,
        expiryDuration
    );

    await sm.db.recordNotes.addRecordNote({
        address,
        hash,
        text: noteText
    }, sm.encryption);
});

const ContactsListWrapper = styled(Box)`
    flex-grow: 1;
    width: 100%;
    overflow-y: auto;
    overflow-y: overlay;

    .MuiListItemButton-root {
        border-radius: 8px;

        &:hover {
            color: ${({ theme }) => theme.palette.text.primary};
        }
        &.Mui-selected {
            color: ${({ theme }) => theme.palette.primary.main};
            backgroundColor: ${({ theme }) => alpha(theme.palette.primary.main, 0.16)};
        }
    }
`;

export const ShareRecordDialog = observer<{ hash: string; onClose?(): void }>(x => {
    const { db, encryption } = sessionManager;
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
            const profiles = (await getProfilesAction.run(sessionManager, { filters: { query } }))
                .filter(p => p.address !== sessionManager.wallet.address);
            setContacts(profiles);

            const avatars = await Promise.all(
                profiles
                    .filter(p => p.avatar_hash && !contactAvatars[p.avatar_hash])
                    .map(p => db.files.getFileBlob(p.avatar_hash!, encryption)
                        .then(f => ({ [p.avatar_hash!]: URL.createObjectURL(f) })))
            );
            setContactAvatars(Object.assign({}, ...avatars));
        })();
    }, [query]);

    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="xs" fullWidth
                onClose={() => x.onClose?.()} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose?.()}>
                    <ArrowBack />
                </IconButton>
                Share medical record
                <DialogContentText fontSize={14}>
                    Select a contact to share your medical record with:
                </DialogContentText>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} alignItems="center" style={{ height: "100%" }}>
                    <TextField margin="dense"
                               placeholder="Search your contacts..."
                               fullWidth
                               size="small"
                               InputProps={{ startAdornment: <Search fontSize="small" sx={{ color: "text.secondary", marginRight: "10px" }} /> }}
                               variant="outlined"
                               value={query}
                               onChange={e => setQuery(e.target.value)} />
                    <ContactsListWrapper style={{
                        height: !isMobileView ? 200 : void 0
                    }}>
                        { contacts.length ? (
                            <Stack>
                                { contacts.map(p => (
                                    <ListItemButton key={p.address} sx={{ px: 2, py: 1, width: "100%" }}
                                                    onClick={() => setSelectedContact(p)}
                                                    selected={selectedContact?.address === p.address}>
                                        <Stack direction="row" spacing={1}>
                                            <Avatar src={p.avatar_hash ? contactAvatars[p.avatar_hash] : void 0} />
                                            <Stack direction="column">
                                                <Typography noWrap color="inherit" fontSize="14px" fontWeight="500">{ p.full_name } <Typography component="span" fontSize="14px" fontWeight="500" color="text.secondary">({ trimWeb3Address(p.address) })</Typography></Typography>
                                                <Typography fontSize="12px" fontWeight="500" color="success.dark">online</Typography>
                                            </Stack>
                                        </Stack>
                                    </ListItemButton>
                                )) }
                            </Stack>
                        ) : (
                            <Typography fontSize="14px" align="center" color="text.secondary">
                                There are no contacts matching your query.
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
                               helperText="Note about this medical record" />
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
                            <MenuItem value={60 * 60 * 24 * 30}>
                                1 month
                            </MenuItem>
                            <MenuItem value={0}>
                                Indefinitely
                            </MenuItem>
                        </Select>
                    </FormControl>
                    <LoadingButton variant="contained" disableElevation
                                   onClick={async () => {
                                       await performShareAction.run(
                                           sessionManager,
                                           "0x" + x.hash,
                                           selectedContact!.address,
                                           expiryDuration,
                                           note,
                                       );
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
            <Backdrop sx={{ color: "#fff", zIndex: theme.zIndex.drawer + 1 }}
                      open={performShareAction.pending}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Dialog>
    );
});
