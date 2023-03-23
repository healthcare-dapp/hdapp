import {
    Add,
    AddCommentOutlined,
    ArrowBack,
    ImageOutlined,
    Menu,
    MoreVert,
    Search,
    Send,
    Slideshow,
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
    Fab,
    IconButton,
    List,
    ListItemButton,
    Paper,
    Stack,
    styled,
    TextField,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { FC, useRef, useState } from "react";
import { useMatches, useNavigate, useParams } from "react-router-dom";
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
            "&.MuiBadge-colorSuccess": {
                background: "white"
            }
        }
    }
}));

const OverflowCard = styled(Box)`
    overflow: auto;
    overflow: overlay;
`;

const LeftPanel: FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const matches = useMatches();
    const [match] = matches;
    const canShowBothPanels = useMediaQuery(theme.breakpoints.up("md"));

    return (
        <Paper variant="outlined" sx={{ borderRadius: 0, maxWidth: canShowBothPanels ? 300 : "unset", width: "100%", position: "relative", border: 0 }}>
            <Stack>
                { canShowBothPanels && (
                    <AppBar position="static" elevation={1} sx={{ px: 2, py: 1, background: "none" }}>
                        <TextField variant="outlined" size="small"
                                   label="Search"
                                   placeholder="Search messages..."
                                   fullWidth />
                    </AppBar>
                ) }
                <List disablePadding>
                    <ChatButton selected={match?.pathname === "/messages/0"}
                                onClick={() => navigate("/messages/0")}>
                        <Stack alignItems="center" direction="row" spacing={1.5} flexGrow={1}>
                            <Badge overlap="circular"
                                   anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                   variant="dot"
                                   color="success"
                                   sx={{ ".MuiBadge-badge": { width: "12px", height: "12px", borderRadius: "6px", border: "2px solid white" } }}>
                                <Avatar sx={{ width: 40, height: 40, background: theme.palette.success.light }} />
                            </Badge>
                            <Stack spacing={0.25} flexGrow={1} width={0}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Typography fontSize={14} fontWeight={500} color="inherit">
                                        Anna Cutemon
                                    </Typography>
                                    <Typography variant="subtitle2" color="inherit" fontSize={12} style={{ fontWeight: 400, marginLeft: "auto", opacity: 0.5 }}>
                                        32 minutes ago
                                    </Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={0.25}>
                                    <Typography fontSize={14} noWrap overflow="hidden" textOverflow="ellipsis" fontWeight="500" color="inherit">When would you like to make an appointment? At 13:30 or 15:30?</Typography>
                                    <Box flexGrow={1} />
                                    <Badge color="error" badgeContent={3} style={{ marginRight: "8px", marginLeft: "16px" }} />
                                </Stack>
                            </Stack>
                        </Stack>
                    </ChatButton>
                    <ChatButton selected={match?.pathname === "/messages/1"}
                                onClick={() => navigate("/messages/1")}>
                        <Stack alignItems="center" direction="row" spacing={1.5} flexGrow={1}>
                            <Badge overlap="circular"
                                   anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                   variant="dot"
                                   sx={{ ".MuiBadge-badge": { width: "12px", height: "12px", borderRadius: "6px", border: "2px solid white", background: theme.palette.grey[500] } }}>
                                <Avatar sx={{ width: 40, height: 40, background: theme.palette.warning.light }} />
                            </Badge>
                            <Stack spacing={0.25} flexGrow={1} width={0}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Typography fontSize={14} fontWeight={500} color="inherit">
                                        Tom Hanks
                                    </Typography>
                                    <Typography variant="subtitle2" color="inherit" fontSize={12} style={{ fontWeight: 400, marginLeft: "auto", opacity: 0.5 }}>
                                        1 hour ago
                                    </Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={0.25}>
                                    <ImageOutlined fontSize="small" />
                                    <Typography noWrap overflow="hidden" textOverflow="ellipsis" variant="subtitle2" fontWeight="500">
                                        <span>Image</span>
                                        <span style={{ fontWeight: 400, opacity: 0.75, margin: "0 4px" }}>&mdash;</span>
                                        <span>I have uploaded your x-ray results.</span>
                                    </Typography>
                                    <Box flexGrow={1} />
                                    <Badge color="error" badgeContent={1} style={{ marginRight: "8px", marginLeft: "16px" }} />
                                </Stack>
                            </Stack>
                        </Stack>
                    </ChatButton>
                    <ChatButton selected={match?.pathname === "/messages/2"}
                                onClick={() => navigate("/messages/2")}>
                        <Stack alignItems="center" direction="row" spacing={1.5} flexGrow={1}>
                            <Badge overlap="circular"
                                   anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                   variant="dot"
                                   sx={{ ".MuiBadge-badge": { width: "12px", height: "12px", borderRadius: "6px", border: "2px solid white", background: theme.palette.grey[500] } }}>
                                <Avatar sx={{ width: 40, height: 40, background: theme.palette.secondary.light }} />
                            </Badge>
                            <Stack spacing={0.25} flexGrow={1} width={0}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Typography fontSize={14} fontWeight={500} color="inherit">
                                        Alexander Mironov
                                    </Typography>
                                    <Typography variant="subtitle2" color="inherit" fontSize={12} style={{ fontWeight: 400, marginLeft: "auto", opacity: 0.5 }}>
                                        2 days ago
                                    </Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={0.25}>
                                    <Typography noWrap overflow="hidden" textOverflow="ellipsis" fontSize={14}>
                                        Please do not forget to install the HDApp mobile app.
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                    </ChatButton>
                    <ChatButton selected={match?.pathname === "/messages/3"}
                                onClick={() => navigate("/messages/3")}>
                        <Stack alignItems="center" direction="row" spacing={1.5} flexGrow={1}>
                            <Badge overlap="circular"
                                   anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                   variant="dot"
                                   sx={{ ".MuiBadge-badge": { width: "12px", height: "12px", borderRadius: "6px", border: "2px solid white", background: theme.palette.grey[500] } }}>
                                <Avatar sx={{ width: 40, height: 40, background: theme.palette.primary.light }} />
                            </Badge>
                            <Stack spacing={0.25} flexGrow={1} width={0}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Typography fontSize={14} fontWeight={500} color="inherit">
                                        Tatiana Smirnova
                                    </Typography>
                                    <Typography variant="subtitle2" color="inherit" fontSize={12} style={{ fontWeight: 400, marginLeft: "auto", opacity: 0.5 }}>
                                        4 days ago
                                    </Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={0.25}>
                                    <Slideshow fontSize="small" />
                                    <Typography noWrap overflow="hidden" textOverflow="ellipsis" fontSize={14}>
                                        Video
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                    </ChatButton>
                </List>
            </Stack>
            { canShowBothPanels && (
                <Fab color="primary" aria-label="add"
                     sx={{
                         position: "absolute",
                         right: 0,
                         bottom: 0
                     }} style={{ margin: 16 }}
                     variant="extended">
                    <AddCommentOutlined sx={{ mr: 1 }} />
                    New message
                </Fab>
            ) }
        </Paper>
    );
};

const RightPanel: FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [messageText, setMessageText] = useState("");
    const [messages, setMessages] = useState<{ text: string; date: Date; my: boolean }[]>([]);
    const isMessageTextValid = !!messageText.trim();
    const canShowExtendedHeader = useMediaQuery(theme.breakpoints.up("sm"));
    const canShowBothPanels = useMediaQuery(theme.breakpoints.up("md"));
    const messagesListRef = useRef<HTMLDivElement>(null);

    return (
        <Paper variant="outlined" sx={{ borderRadius: 0, height: "100%", border: 0, overflow: "hidden", flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <AppBar position="static" elevation={1} color="default" sx={{ px: 1, py: 0.5, backgroundColor: canShowBothPanels ? "white" : void 0 }}>
                <Stack direction="row" alignItems="center">
                    { !canShowBothPanels && <IconButton onClick={() => navigate("/messages")}><ArrowBack /></IconButton> }
                    <Stack spacing={-0.5} sx={{ pl: 1 }}>
                        <Typography fontSize={16} fontWeight="500">Anna Cutemon</Typography>
                        <Typography fontSize={14} fontWeight="500" color="success.main">online</Typography>
                    </Stack>
                    <Box flexGrow={1} />
                    { canShowExtendedHeader
                        ? <Button variant="outlined" startIcon={<VideoCall />} sx={{ mr: 1 }}>Start call</Button>
                        : <IconButton size="large" color="inherit"><VideoCall /></IconButton> }
                    { canShowExtendedHeader && <IconButton size="large" color="inherit"><Search /></IconButton> }
                    <IconButton size="large" color="inherit"><MoreVert /></IconButton>
                </Stack>
            </AppBar>
            <OverflowCard sx={{ flexGrow: 1, height: 0 }}
                          ref={messagesListRef}>
                <Stack spacing={1} sx={{ pt: 2, pb: 1, px: canShowExtendedHeader ? 2 : 1, position: "relative", minHeight: "100%" }} justifyContent="flex-end">
                    <Paper variant="outlined" sx={{ background: alpha(theme.palette.primary.light, 0.3), alignSelf: "flex-end", maxWidth: "450px", width: "100%", position: "relative", display: "flex", minHeight: "100px" }}>
                        <img src="https://bollywoodfever.co.in/wp-content/uploads/2022/08/Thumbs-up-Memes13.jpg" style={{ width: "100%", borderRadius: 4 }} />

                        <Typography color="text.secondary" fontSize={14} style={{ flexShrink: 0, alignSelf: "flex-end", bottom: 4, right: 4, background: "rgba(0, 0, 0, 0.7)", borderRadius: 4, padding: "2px 6px", position: "absolute", color: "white" }}>
                            4:58:00 PM
                        </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ background: alpha(theme.palette.primary.light, 0.3), p: 1, alignSelf: "flex-end", maxWidth: "450px" }}>
                        <Stack spacing={1}>
                            <Stack spacing={1} direction="row">
                                <Typography fontSize={14}>
                                    I think I'm feeling a lot better!
                                </Typography>
                                <Box flexGrow={1} />
                                <Typography color="text.secondary" fontSize={14} style={{ flexShrink: 0, alignSelf: "flex-end" }}>
                                    4:58:00 PM
                                </Typography>
                            </Stack>
                        </Stack>
                    </Paper>
                    <Paper variant="outlined" sx={{ background: alpha(theme.palette.primary.light, 0.3), p: 1, alignSelf: "flex-end", maxWidth: "450px" }}>
                        <Stack spacing={1}>
                            <Stack spacing={1} direction="row">
                                <Typography fontSize={14}>
                                    Thank you a lot!
                                </Typography>
                                <Box flexGrow={1} />
                                <Typography color="text.secondary" fontSize={14} style={{ flexShrink: 0, alignSelf: "flex-end" }}>
                                    4:59:00 PM
                                </Typography>
                            </Stack>
                        </Stack>
                    </Paper>
                    { !messages.length && (
                        <Box sx={{ borderRadius: "4px", padding: "4px 12px", color: "white", background: theme.palette.error.main, alignSelf: "center", zIndex: 0 }}>
                            <Typography fontSize={14} fontWeight={500}>New messages</Typography>
                            <Box sx={{ border: "1px solid " + theme.palette.error.main, position: "absolute", left: 0, right: 0, margin: "-10px 16px", zIndex: -1 }} />
                        </Box>
                    ) }
                    <Paper variant="outlined" sx={{ background: theme.palette.grey[50], p: 1, alignSelf: "flex-start" }}>
                        <Stack spacing={0.5}>
                            <Stack spacing={1} direction="row">
                                <Typography color="success.dark" fontSize={14} fontWeight={500}>
                                    Anna Cutemon
                                </Typography>
                                <Box flexGrow={1} />
                                <Typography color="text.secondary" fontSize={14}>
                                    10:21:00 AM
                                </Typography>
                            </Stack>
                            <Typography fontSize={14}>
                                Hello Ruslan!
                            </Typography>
                        </Stack>
                    </Paper>
                    <Paper variant="outlined" sx={{ background: theme.palette.grey[50], p: 1, alignSelf: "flex-start", maxWidth: "450px" }}>
                        <Stack spacing={1}>
                            <Stack spacing={1} direction="row">
                                <Typography fontSize={14}>
                                    I would like to remind you that we wanted to do a check up today.
                                </Typography>
                                <Box flexGrow={1} />
                                <Typography color="text.secondary" fontSize={14} style={{ flexShrink: 0, alignSelf: "flex-end" }}>
                                    10:23:00 AM
                                </Typography>
                            </Stack>
                        </Stack>
                    </Paper>
                    <Paper variant="outlined" sx={{ background: theme.palette.grey[50], p: 1, alignSelf: "flex-start", maxWidth: "450px" }}>
                        <Stack spacing={1}>
                            <Stack spacing={1} direction="row">
                                <Typography fontSize={14}>
                                    When would you like to make an appointment? At 13:30 or 15:30?
                                </Typography>
                                <Box flexGrow={1} />
                                <Typography color="text.secondary" fontSize={14} style={{ flexShrink: 0, alignSelf: "flex-end" }}>
                                    10:24:00 AM
                                </Typography>
                            </Stack>
                        </Stack>
                    </Paper>
                    { messages.map(({ text, date, my }, index) => (
                        <Paper variant="outlined" sx={{ background: my ? alpha(theme.palette.primary.light, 0.3) : theme.palette.grey[50], p: 1, alignSelf: my ? "flex-end" : "flex-start", maxWidth: "450px" }}
                               key={date.toString()}>
                            { text
                                ? (
                                    <Stack spacing={0.5}>
                                        <Stack spacing={1} direction="row">
                                            <Typography color="success.dark" fontSize={14} fontWeight={500}>
                                                { my ? "Ruslan Garifullin" : "Anna Cutemon" }
                                            </Typography>
                                            <Box flexGrow={1} />
                                            <Typography color="text.secondary" fontSize={14}>
                                                { date.toLocaleTimeString() }
                                            </Typography>
                                        </Stack>
                                        <Typography fontSize={14}>
                                            { text }
                                        </Typography>
                                    </Stack>
                                )
                                : (
                                    <Stack spacing={1}>
                                        <Stack spacing={1} direction="row">
                                            <Typography fontSize={14}>
                                                { text }
                                            </Typography>
                                            <Box flexGrow={1} />
                                            <Typography color="text.secondary" fontSize={14} style={{ flexShrink: 0, alignSelf: "flex-end" }}>
                                                { date.toLocaleTimeString() }
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                ) }

                        </Paper>
                    )) }
                </Stack>
            </OverflowCard>
            <Stack direction="row" sx={{ px: canShowExtendedHeader ? 2 : 1, py: 1 }} spacing={1} alignItems="stretch">
                <IconButton sx={{ backgroundColor: theme.palette.grey[200], boxShadow: theme.shadows[1] }}><Add /></IconButton>
                <TextField variant="outlined" placeholder="Write a message" size="small"
                           InputProps={{ style: { borderRadius: 100, fontSize: 14, height: "100%" } }}
                           style={{ flexGrow: 1, width: 0 }}
                           onChange={e => setMessageText(e.target.value)}
                           value={messageText} />
                { canShowExtendedHeader ? (
                    <Button variant="contained" disableElevation style={{ borderRadius: 100 }}
                            startIcon={<Send />} disabled={!isMessageTextValid}
                            onClick={() => {
                                setMessages([...messages, { text: messageText, date: new Date(), my: true }]);
                                setMessageText("");
                                setTimeout(() => {
                                    messagesListRef.current?.scrollTo({ top: 1000000000, behavior: "smooth" });
                                }, 50);
                                setTimeout(() => {
                                    setMessages(msgs => ([...msgs, { text: "Okay! Got it!", date: new Date(), my: false }]));
                                    setTimeout(() => {
                                        messagesListRef.current?.scrollTo({ top: 1000000000, behavior: "smooth" });
                                    }, 50);
                                }, 3000);
                            }}>
                        Send
                    </Button>
                ) : (
                    <Button variant="contained" disableElevation style={{ borderRadius: 100, padding: 0, minWidth: "unset" }}
                            disabled={!isMessageTextValid}
                            onClick={() => {
                                setMessages([...messages, { text: messageText, date: new Date(), my: true }]);
                                setMessageText("");
                                setTimeout(() => {
                                    messagesListRef.current?.scrollTo({ top: 1000000000, behavior: "smooth" });
                                }, 50);
                                setTimeout(() => {
                                    setMessages(msgs => ([...msgs, { text: "Okay! Got it!", date: new Date(), my: false }]));
                                    setTimeout(() => {
                                        messagesListRef.current?.scrollTo({ top: 1000000000, behavior: "smooth" });
                                    }, 50);
                                }, 3000);
                            }}>
                        <Send fontSize="small" sx={{ m: "0 10px" }} />
                    </Button>
                ) }
            </Stack>
        </Paper>
    );
};

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
                                <Menu />
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

