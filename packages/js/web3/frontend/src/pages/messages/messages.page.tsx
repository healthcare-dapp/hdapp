import estyled from "@emotion/styled";
import { formatTemporal } from "@hdapp/shared/web2-common/utils";
import {
    Add,
    AddCommentOutlined,
    ArrowBack,
    Attachment,
    Delete,
    DeleteOutline,
    ImageOutlined,
    InfoOutlined,
    Menu as MenuIcon,
    MoreVert,
    Search,
    Send,
    VideoCall,
} from "@mui/icons-material";
import {
    alpha,
    AppBar,
    Avatar,
    Badge,
    Box,
    Button,
    Container,
    Divider,
    Fab,
    IconButton,
    InputBase,
    List,
    ListItemButton,
    ListItemIcon,
    Menu,
    MenuItem,
    MenuList,
    Paper,
    Stack,
    styled,
    TextField,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { FC, useEffect, useRef, useState } from "react";
import { useMatches, useNavigate, useParams } from "react-router-dom";
import { ModalProvider } from "../../App2";
import { CreateChatDialog } from "../../dialogs/create-chat.dialog";
import { sessionManager } from "../../managers/session.manager";
import { ChatMessageEntry } from "../../services/chat-message.service";
import { ChatEntry } from "../../services/chat.service";
import { ProfileEntry } from "../../services/profile.service";
import { superIncludes } from "../../utils/super-includes";
import { useDatabase } from "../../utils/use-database";
import { BottomBarWidget } from "../../widgets/bottom-bar";
import { DrawerWidget } from "../../widgets/drawer";
import { HeaderWidget } from "../../widgets/header";
import { ShareQrWidget } from "../../widgets/share-qr";

const ChatButton = styled(ListItemButton)(({ theme }) => ({
    padding: "8px 16px",
    color: theme.palette.text.primary,
    "&:focus": {
        backgroundColor: "transparent"
    },
    "&:hover": {
        backgroundColor: alpha(theme.palette.primary.main, 0.16)
    },
    "&.Mui-selected": {
        backgroundColor: theme.palette.primary.dark + " !important",
        color: "white",
        ".MuiBadge-badge:not(.MuiBadge-overlapCircular)": {
            background: "white",
            color: theme.palette.primary.dark
        },
        ".MuiBadge-overlapCircular": {
            borderColor: theme.palette.primary.dark,
            background: "white !important"
        }
    }
}));

const UploadButton = estyled.form`
    position: relative;

    input {
        opacity: 0;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
    }
`;

const OverflowCard = styled(Box)`
    overflow: auto;
    overflow: overlay;
`;

const LeftPanel: FC = observer(() => {
    const { db, encryption } = sessionManager;
    const theme = useTheme();
    const navigate = useNavigate();
    const matches = useMatches();
    const [match] = matches;
    const canShowBothPanels = useMediaQuery(theme.breakpoints.up("md"));
    const [chats, setChats] = useState<({
        hash: string
        name: string
        pictureUrl?: string
        participant_address?: string
        last_message?: ChatMessageEntry
    })[]>([]);
    const [query, setQuery] = useState("");
    const onlineAddresses = sessionManager.webrtc.onlinePeerAddresses;

    async function reload() {
        const chatEntities = await db.chats.searchChats({});
        const mapped = await Promise.all(
            chatEntities.filter(chat => superIncludes(query, chat.friendly_name)).map(async chat => {
                const [lastMessage] = await db.chatMessages.searchChatMessages({
                    filters: {
                        chat_hash: chat.hash
                    },
                    sort_by: "created_at",
                    sort_by_desc: true,
                    limit: 1
                }, encryption);
                const participants = await Promise.all(
                    chat.participant_ids.map(id => db.profiles.getProfile(id, encryption))
                );
                const participantsWithAvatars = await Promise.all(
                    participants.map(async profile => {
                        const avatarUrl = profile.avatar_hash
                            ? URL.createObjectURL(await db.files.getFileBlob(profile.avatar_hash, encryption))
                            : void 0;
                        return { ...profile, avatar_url: avatarUrl };
                    })
                );
                return {
                    ...chat,
                    pictureUrl: participantsWithAvatars
                        .filter(p => p.address !== sessionManager.wallet.address)[0]
                        ?.avatar_url,
                    participant_address: participantsWithAvatars
                        .filter(p => p.address !== sessionManager.wallet.address)[0]
                        ?.address,
                    name: chat.friendly_name.trim() || participants
                        .filter(p => p.address !== sessionManager.wallet.address)
                        .map(p => p.full_name)
                        .join(", "),
                    last_message: lastMessage
                };
            })
        );
        setChats(mapped.sort((a, b) => !a.last_message && !b.last_message ? 0
            : a.last_message && !b.last_message ? -1
                : !a.last_message && b.last_message ? 1
                    : -a.last_message.created_at.compareTo(b.last_message.created_at)));
    }

    useDatabase(reload, ["chats", "chat-messages", "file_blobs", "profiles"]);
    useEffect(() => {
        void reload();
    }, [matches, query]);

    return (
        <Paper variant="outlined" sx={{ borderRadius: 0, maxWidth: canShowBothPanels ? 300 : "unset", width: "100%", position: "relative", border: 0 }}>
            <Stack>
                { canShowBothPanels && (
                    <AppBar position="static" elevation={1} sx={{ px: 2, py: 1, background: "none" }}>
                        <TextField variant="outlined" size="small"
                                   label="Search"
                                   value={query}
                                   onChange={e => setQuery(e.target.value)}
                                   placeholder="Search messages..."
                                   fullWidth />
                    </AppBar>
                ) }
                <List disablePadding>
                    { !chats.length && (
                        <Typography color="text.secondary" align="center" fontSize={14} mt={2}>
                            You have no chats yet.
                        </Typography>
                    ) }
                    { chats.map(chat => (
                        <ChatButton selected={match?.pathname === "/messages/" + chat.hash}
                                    onClick={() => navigate("/messages/" + chat.hash)} key={chat.hash}>
                            <Stack alignItems="center" direction="row" spacing={1.5} flexGrow={1}>
                                <Badge overlap="circular"
                                       anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                       variant="dot"
                                       sx={{
                                           ".MuiBadge-badge": {
                                               background: onlineAddresses.includes(chat.participant_address!)
                                                   ? theme.palette.success.main
                                                   : theme.palette.grey[700],
                                               width: "12px",
                                               height: "12px",
                                               borderRadius: "6px",
                                               border: chat.participant_address ? "2px solid white" : void 0
                                           }
                                       }}>
                                    <Avatar sx={{ width: 40, height: 40, background: theme.palette.success.light }}
                                            src={chat.pictureUrl} />
                                </Badge>
                                <Stack spacing={0.25} flexGrow={1} width={0}>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Typography fontSize={14} fontWeight={500} color="inherit" noWrap
                                                    style={{ textOverflow: "ellipsis", overflow: "hidden" }}>
                                            { chat.name }
                                        </Typography>
                                        <Typography variant="subtitle2" color="inherit" fontSize={12} noWrap style={{ fontWeight: 400, marginLeft: "auto", opacity: 0.5 }}>
                                            { formatTemporal(chat.last_message?.created_at) }
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={0.25}>
                                        { chat.last_message?.attachment_ids.length ? (
                                            <>
                                                <ImageOutlined fontSize="small" />
                                                <Typography noWrap overflow="hidden" textOverflow="ellipsis" variant="subtitle2" fontWeight="500">
                                                    <span>Image</span>
                                                    <span style={{ fontWeight: 400, opacity: 0.75, margin: "0 4px" }}>&mdash;</span>
                                                    <span>{ chat.last_message.content }</span>
                                                </Typography>
                                            </>
                                        ) : (
                                            <Typography fontSize={14} noWrap overflow="hidden" textOverflow="ellipsis" fontWeight="500" color="inherit">
                                                { chat.last_message?.content }
                                            </Typography>
                                        ) }
                                        <Box flexGrow={1} />
                                        { /* <Badge color="error" badgeContent={3} style={{ marginRight: "8px", marginLeft: "16px" }} /> */ }
                                    </Stack>
                                </Stack>
                            </Stack>
                        </ChatButton>
                    )) }
                </List>
            </Stack>
            { canShowBothPanels && (
                <Fab color="primary" aria-label="add"
                     sx={{
                         position: "absolute",
                         right: 0,
                         bottom: 0
                     }} style={{ margin: 16 }}
                     variant="extended"
                     onClick={() => ModalProvider.show(CreateChatDialog, {})}>
                    <AddCommentOutlined sx={{ mr: 1 }} />
                    New group chat
                </Fab>
            ) }
        </Paper>
    );
});

const RightPanel: FC = observer(() => {
    const { db, encryption } = sessionManager;
    const theme = useTheme();
    const navigate = useNavigate();
    const matches = useMatches();
    const [match] = matches;
    const chatHash = match.params.chatId;
    const [messageText, setMessageText] = useState("");
    const isMessageTextValid = !!messageText.trim();
    const canShowExtendedHeader = useMediaQuery(theme.breakpoints.up("sm"));
    const canShowBothPanels = useMediaQuery(theme.breakpoints.up("md"));
    const messagesListRef = useRef<HTMLDivElement>(null);
    const [chat, setChat] = useState<ChatEntry>();
    const [participants, setParticipants] = useState<(ProfileEntry & { avatar_url?: string })[]>([]);
    const [messages, setMessages] = useState<(ChatMessageEntry & { attachments: string[] })[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const onlineAddresses = sessionManager.webrtc.onlinePeerAddresses;
    const [accountMenu, setAccountMenu] = useState<null | HTMLElement>(null);
    const open = Boolean(accountMenu);

    const otherParticipants = participants
        .filter(p => p.address !== sessionManager.wallet.address);
    const chatName = chat
        ? (
            chat.friendly_name.trim() || otherParticipants
                .map(p => p.full_name)
                .join(", ")
        ) : "Loading...";

    const reload = async (inputHash?: string) => {
        const hash = inputHash ?? chat?.hash;
        if (!hash)
            return;

        const chatEntry = await db.chats.getChat(hash);
        setChat(chatEntry);

        const profiles = await Promise.all(
            chatEntry.participant_ids.map(async id => {
                const profile = await db.profiles.getProfile(id, encryption);

                const avatarUrl = profile.avatar_hash
                    ? URL.createObjectURL(await db.files.getFileBlob(profile.avatar_hash, encryption))
                    : void 0;
                return { ...profile, avatar_url: avatarUrl };
            })
        );
        setParticipants(profiles);

        const chatMessages = await db.chatMessages.searchChatMessages({
            filters: {
                chat_hash: hash,
            },
            sort_by: "created_at",
            limit: 50
        }, encryption);

        const mapped = await Promise.all(
            chatMessages.map(async msg => {
                const attachments = await Promise.all(
                    msg.attachment_ids.map(
                        id => db.files.getFileBlob(id, encryption)
                            .then(blob => URL.createObjectURL(blob))
                    )
                );
                return { ...msg, attachments };
            })
        );

        setMessages(mapped);

        setTimeout(() => {
            messagesListRef.current?.scrollTo({ top: messagesListRef.current!.scrollHeight, behavior: "smooth" });
        }, 200);
    };

    useDatabase(reload, ["chats", "chat-messages", "files", "profiles"], [chat]);
    useEffect(() => {
        chatHash && void reload(chatHash);
    }, [chatHash]);

    if (!chatHash) {
        return (
            <Paper variant="outlined"
                   sx={{ borderRadius: 0, height: "100%", border: 0, overflow: "hidden", flexGrow: 1, display: "flex", flexDirection: "column" }} />
        );
    }

    async function send() {
        await db.chatMessages.addChatMessage({
            attachment_ids: [],
            chat_hash: chatHash!,
            content: messageText,
            created_by: sessionManager.wallet.address
        }, encryption);

        setMessageText("");
    }

    const isStartCallActive = !messages.some(msg => msg.content.includes("https://meet.jit.si"));

    async function startCall() {
        await db.chatMessages.addChatMessage({
            attachment_ids: [],
            chat_hash: chatHash!,
            content: "https://meet.jit.si/" + chatHash,
            created_by: sessionManager.wallet.address
        }, encryption);
    }

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAccountMenu(event.currentTarget);
    };

    const handleClose = () => {
        setAccountMenu(null);
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 0, height: "100%", border: 0, overflow: "hidden", flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <AppBar position="static" elevation={1} color="default" sx={{ px: 1, py: 0.5, backgroundColor: canShowBothPanels ? "white" : void 0 }}>
                <Stack direction="row" alignItems="center" sx={{ height: "48px" }}>
                    { isSearching ? (
                        <>
                            <IconButton onClick={() => setIsSearching(false)}><ArrowBack /></IconButton>
                            <InputBase placeholder="Search your messages..." sx={{ flex: 1, pl: 1 }} />
                        </>
                    ) : (
                        <>
                            { !canShowBothPanels && <IconButton onClick={() => navigate("/messages")}><ArrowBack /></IconButton> }
                            <Stack spacing={-0.5} sx={{ pl: 1 }}>
                                <Typography fontSize={16} fontWeight="500">{ chatName }</Typography>
                                <Typography fontSize={14} fontWeight="500"
                                            color={onlineAddresses.includes(otherParticipants[0]?.address) ? "success" : "text.secondary"}>
                                    { onlineAddresses.includes(otherParticipants[0]?.address) ? "online" : "offline" }
                                </Typography>
                            </Stack>
                            <Box flexGrow={1} />
                            { canShowExtendedHeader
                                ? <Button variant="outlined" disabled={!isStartCallActive} onClick={startCall} startIcon={<VideoCall />} sx={{ mr: 1 }}>Start call</Button>
                                : <IconButton size="large" color="inherit" disabled={!isStartCallActive} onClick={startCall}><VideoCall /></IconButton> }
                            { canShowExtendedHeader && <IconButton size="large" color="inherit" onClick={() => setIsSearching(true)}><Search /></IconButton> }
                            <IconButton size="large" color="inherit"
                                        onClick={handleClick}
                                        aria-controls={open ? "account-menu" : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={open ? "true" : undefined}><MoreVert /></IconButton>
                        </>
                    ) }

                </Stack>
                <Menu anchorEl={accountMenu}
                      id="account-menu"
                      open={open}
                      onClose={handleClose}
                      onClick={handleClose}
                      transformOrigin={{ horizontal: "right", vertical: "top" }}
                      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                      sx={{ p: 0 }}>
                    <MenuList dense sx={{ p: 0 }}>
                        <MenuItem onClick={async () => {
                            handleClose();
                        }}>
                            <ListItemIcon>
                                <Attachment fontSize="small" />
                            </ListItemIcon>
                            Attachments
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={async () => {
                            handleClose();
                        }}>
                            <ListItemIcon>
                                <InfoOutlined fontSize="small" />
                            </ListItemIcon>
                            Chat details
                        </MenuItem>
                        <MenuItem onClick={async () => {
                            handleClose();
                        }} sx={{ color: theme.palette.error.main }}>
                            <ListItemIcon>
                                <DeleteOutline color="error" fontSize="small" />
                            </ListItemIcon>
                            Leave this chat
                        </MenuItem>
                    </MenuList>
                </Menu>
            </AppBar>
            <OverflowCard sx={{ flexGrow: 1, height: 0 }}
                          ref={messagesListRef}>
                <Stack spacing={1} sx={{ pt: 2, pb: 1, px: canShowExtendedHeader ? 2 : 1, position: "relative", minHeight: "100%" }} justifyContent="flex-end">
                    { messages.map(msg => (
                        <Paper variant="outlined"
                               sx={
                                   msg.created_by === sessionManager.wallet.address
                                       ? { background: alpha(theme.palette.primary.light, 0.3), p: 1, alignSelf: "flex-end", maxWidth: "450px" }
                                       : { background: theme.palette.grey[50], p: 1, alignSelf: "flex-start" }
                               }
                               key={msg.hash}>
                            <Stack spacing={1}>
                                { msg.attachments.map(url =>
                                    <img src={url} key={url} style={{ width: "100%", borderRadius: 4 }} />
                                ) }
                                <Stack spacing={1} direction="row">
                                    { msg.content.startsWith("https://meet.jit.si") ? ( // @ts-ignore
                                        <Stack spacing={1} direction="row" as="a" href={msg.content} target="_blank"
                                               style={{ textDecoration: "none", color: "inherit" }}>
                                            <Stack sx={{ background: alpha(theme.palette.primary.main, 0.75), p: 1, borderRadius: "4px", alignSelf: "flex-start" }}>
                                                <VideoCall sx={{ color: "white" }} />
                                            </Stack>
                                            <Stack>
                                                <Typography fontSize="14px" fontWeight="500" color="text.primary">Ongoing Jitsi call</Typography>
                                                <Typography fontSize="14px" color="text.secondary" lineHeight="18px">You're invited to join a conference room</Typography>
                                            </Stack>
                                        </Stack>
                                    ) : (
                                        <Typography fontSize={14}>
                                            { msg.content }
                                        </Typography>
                                    ) }
                                    <Box flexGrow={1} />
                                    <Typography color="text.secondary" fontSize={14} style={{ flexShrink: 0, alignSelf: "flex-end" }}>
                                        { formatTemporal(msg.created_at) }
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    )) }
                    { /*  !messages.length && (
                        <Box sx={{ borderRadius: "4px", padding: "4px 12px", color: "white", background: theme.palette.error.main, alignSelf: "center", zIndex: 0 }}>
                            <Typography fontSize={14} fontWeight={500}>New messages</Typography>
                            <Box sx={{ border: "1px solid " + theme.palette.error.main, position: "absolute", left: 0, right: 0, margin: "-10px 16px", zIndex: -1 }} />
                        </Box>
                    )  */ }
                </Stack>
            </OverflowCard>
            <Stack direction="row" sx={{ px: canShowExtendedHeader ? 2 : 1, py: 1 }} spacing={1} alignItems="stretch">
                <UploadButton>
                    <IconButton sx={{ backgroundColor: theme.palette.grey[200], boxShadow: theme.shadows[1] }}><Add /></IconButton>
                    <input onChange={async e => {
                        if (!e.target.files?.length)
                            return;

                        const fileIds: string[] = [];
                        for (let i = 0; i < e.target.files.length; i++) {
                            const file = e.target.files[i];
                            const hash = await db.files.uploadFile(file, sessionManager.wallet.address, encryption);
                            fileIds.push(hash);
                        }

                        await db.chatMessages.addChatMessage({
                            attachment_ids: fileIds,
                            chat_hash: chatHash!,
                            content: "",
                            created_by: sessionManager.wallet.address
                        }, encryption);

                        e.target.form?.reset();
                    }} type="file" />
                </UploadButton>
                <TextField variant="outlined" placeholder="Write a message" size="small"
                           InputProps={{ style: { borderRadius: 100, fontSize: 14, height: "100%" } }}
                           style={{ flexGrow: 1, width: 0 }}
                           onChange={e => setMessageText(e.target.value)}
                           value={messageText} />
                { canShowExtendedHeader ? (
                    <Button variant="contained" disableElevation style={{ borderRadius: 100 }}
                            startIcon={<Send />} disabled={!isMessageTextValid}
                            onClick={send}>
                        Send
                    </Button>
                ) : (
                    <Button variant="contained" disableElevation style={{ borderRadius: 100, padding: 0, minWidth: "unset" }}
                            disabled={!isMessageTextValid}
                            onClick={send}>
                        <Send fontSize="small" sx={{ m: "0 10px" }} />
                    </Button>
                ) }
            </Stack>
        </Paper>
    );
});

export const MessagesPage = () => {
    const theme = useTheme();
    const canShowBothPanels = useMediaQuery(theme.breakpoints.up("md"));
    const hasBiggerTopMargin = useMediaQuery(theme.breakpoints.up("sm"));
    const params = useParams<{ chatId: string }>();
    const [openCounter, setOpenCounter] = useState(0);
    const { chatId } = params;

    return (
        <>
            <DrawerWidget openCounter={openCounter} />
            { !canShowBothPanels && !chatId && (
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
                                Messages
                            </Typography>
                            <div>
                                <IconButton size="large"
                                            color="inherit">
                                    <AddCommentOutlined />
                                </IconButton>
                                <IconButton size="large"
                                            color="inherit">
                                    <Search />
                                </IconButton>
                            </div>
                        </Toolbar>
                    </AppBar>
                    <Box mt={hasBiggerTopMargin ? 8 : 7} />
                </>
            ) }
            <HeaderWidget />
            <Container sx={{ [theme.breakpoints.down("lg")]: { px: 0 }, height: 0, flexGrow: 1 }}>
                { canShowBothPanels ? (
                    <Stack direction="row" width="100%" sx={{ height: "100%", boxShadow: theme.shadows[2] }}>
                        <LeftPanel />
                        <Box sx={{ borderRight: "1px solid rgba(0,0,0,0.15)" }} />
                        <RightPanel />
                    </Stack>
                ) : chatId
                    ? <RightPanel />
                    : <LeftPanel /> }
            </Container>
            { !chatId && <BottomBarWidget /> }
            { !chatId && <ShareQrWidget /> }
        </>
    );
};

