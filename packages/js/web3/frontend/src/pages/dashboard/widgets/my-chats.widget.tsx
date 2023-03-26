import { formatTemporal } from "@hdapp/shared/web2-common/utils/temporal";
import { ArrowForward } from "@mui/icons-material";
import {
    Avatar,
    Badge,
    Button,
    Card,
    CardContent,
    MenuItem,
    MenuList,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sessionManager } from "../../../managers/session.manager";
import { ChatMessageEntry, chatMessageService } from "../../../services/chat-message.service";
import { ChatEntry, chatService } from "../../../services/chat.service";
import { fileService } from "../../../services/file.service";
import { ProfileEntry, profileService } from "../../../services/profile.service";
import { useDatabase } from "../../../utils/use-database";

export const MyChatsWidget: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [chats, setChats] = useState<(ChatEntry & {
        name: string
        pictureUrl?: string
        participant_address?: string
        last_message?: ChatMessageEntry
        participants: (ProfileEntry & {
            avatar_url?: string
        })[]
    })[]>([]);

    useDatabase(async () => {
        const chatEntries = await chatService.searchChats({ limit: 3 });
        const mapped = await Promise.all(
            chatEntries.map(async chat => {
                const participants = await Promise.all(
                    chat.participant_ids
                        .filter(id => sessionManager.wallet.address !== id)
                        .map(async id => {
                            const profile = await profileService.getProfile(id, sessionManager.encryption);
                            const avatarUrl = profile.avatar_hash
                                ? URL.createObjectURL(
                                    await fileService.getFileBlob(profile.avatar_hash, sessionManager.encryption)
                                ) : undefined;

                            return { ...profile, avatar_url: avatarUrl };
                        })
                );

                const [lastMessage] = await chatMessageService.searchChatMessages({
                    filters: {
                        chat_hash: chat.hash
                    },
                    sort_by: "created_at",
                    limit: 1
                }, sessionManager.encryption);

                return { ...chat,
                    pictureUrl: participants
                        .filter(p => p.address !== sessionManager.wallet.address)[0]
                        ?.avatar_url,
                    participant_address: participants
                        .filter(p => p.address !== sessionManager.wallet.address)[0]
                        ?.address,
                    name: chat.friendly_name.trim() || participants
                        .filter(p => p.address !== sessionManager.wallet.address)
                        .map(p => p.full_name)
                        .join(", "),
                    last_message: lastMessage,
                    participants };
            })
        );

        setChats(mapped);
    }, ["chats", "chat-messages", "profiles", "file_blobs"]);

    return (
        <Card variant="outlined" sx={{ width: "100%" }}>
            <CardContent>
                <Stack direction="row">
                    <Typography variant="h6" component="div">
                        Latest messages
                    </Typography>
                    <Button size="small" endIcon={<ArrowForward />}
                            style={{ marginLeft: "auto" }}
                            onClick={() => navigate("/messages")}>View more</Button>
                </Stack>
            </CardContent>
            <MenuList sx={{ pt: 0, minHeight: 200 }}>
                { !chats.length && (
                    <Typography color="text.secondary" align="center" fontSize={14} my={1}>
                        You have no chats yet.
                    </Typography>
                ) }
                { chats.map(chat => (
                    <MenuItem key={chat.hash} onClick={() => navigate("/messages/" + chat.hash)}>
                        <Stack spacing={2} direction="row" alignItems="center" width="100%">
                            <Badge overlap="circular"
                                   anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                   variant="dot"
                                   color="success"
                                   sx={{ ".MuiBadge-badge": { width: "12px", height: "12px", borderRadius: "6px", border: "2px solid white" } }}>
                                <Avatar sx={{ background: theme.palette.success.light, width: 40, height: 40 }}
                                        src={chat.pictureUrl} />
                            </Badge>
                            <Stack width={0} flexGrow={1}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Typography variant="subtitle2">
                                        { chat.name }
                                    </Typography>
                                    { /* <Badge color="error" badgeContent={3} /> */ }
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                        { formatTemporal(chat.created_at) }
                                    </Typography>
                                </Stack>
                                <Typography noWrap variant="subtitle2" fontWeight="500">
                                    { chat.last_message?.content }
                                </Typography>
                            </Stack>
                        </Stack>
                    </MenuItem>
                )) }
            </MenuList>
        </Card>
    );
};
