import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { Add, ArrowBack, Search } from "@mui/icons-material";
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
import { sessionManager } from "../managers/session.manager";
import { chatService } from "../services/chat.service";
import { fileService } from "../services/file.service";
import { ProfileEntry, profileService } from "../services/profile.service";
import { trimWeb3Address } from "../utils/trim-web3-address";

const getProfilesAction = new AsyncAction(profileService.searchProfiles);
const createChatAction = new AsyncAction(async (
    name: string,
    participantIds: string[]
) => {
    await chatService.addChat({
        friendly_name: name,
        participant_ids: participantIds
    });
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

export const CreateChatDialog = observer<{ onClose?(): void }>(x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [friendlyName, setFriendlyName] = useState("");
    const [query, setQuery] = useState("");
    const [contacts, setContacts] = useState<ProfileEntry[]>([]);
    const [contactAvatars, setContactAvatars] = useState<Record<string, string>>({});
    const [selectedContacts, setSelectedContacts] = useState<ProfileEntry[]>([]);
    const onlineAddresses = sessionManager.webrtc.onlinePeerAddresses;

    useEffect(() => {
        (async () => {
            const profiles = (await getProfilesAction.run({ filters: { query } }, sessionManager.encryption))
                .filter(p => p.address !== sessionManager.wallet.address);
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
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="xs" fullWidth
                onClose={() => x.onClose?.()} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose?.()}>
                    <ArrowBack />
                </IconButton>
                Create a new group chat
                <DialogContentText fontSize={14}>
                    Select users to create a chat with:
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
                                                    onClick={() => setSelectedContacts(c => c.includes(p) ? c.filter(a => a !== p) : [...c, p])}
                                                    selected={selectedContacts.some(c => c.address === p.address)}>
                                        <Stack direction="row" spacing={1}>
                                            <Avatar src={p.avatar_hash ? contactAvatars[p.avatar_hash] : void 0} />
                                            <Stack direction="column">
                                                <Typography noWrap color="inherit" fontSize="14px" fontWeight="500">{ p.full_name } <Typography component="span" fontSize="14px" fontWeight="500" color="text.secondary">({ trimWeb3Address(p.address) })</Typography></Typography>
                                                <Typography fontSize="12px" fontWeight={onlineAddresses.includes(p.address) ? "500" : "400"}
                                                            color={onlineAddresses.includes(p.address) ? "success.dark" : "text.secondary"}>
                                                    { onlineAddresses.includes(p.address) ? "online" : "offline" }
                                                </Typography>
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
                               label="Chat name"
                               fullWidth
                               variant="outlined"
                               value={friendlyName}
                               size="small"
                               onChange={e => setFriendlyName(e.target.value)} />
                    <LoadingButton variant="contained" disableElevation
                                   onClick={async () => {
                                       if (!selectedContacts)
                                           return;
                                       await createChatAction.run(
                                           friendlyName,
                                           [...selectedContacts.map(c => c.address), sessionManager.wallet.address],
                                       );
                                       x.onClose?.();
                                   }}
                                   disabled={!selectedContacts}
                                   startIcon={<Add />}
                                   loading={createChatAction.pending}
                                   color="success">
                        Create a chat
                    </LoadingButton>
                </Stack>
            </DialogContent>
            <Backdrop sx={{ color: "#fff", zIndex: theme.zIndex.drawer + 1 }}
                      open={createChatAction.pending}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Dialog>
    );
});
