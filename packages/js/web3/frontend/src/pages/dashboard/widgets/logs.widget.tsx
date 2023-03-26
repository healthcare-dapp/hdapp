import { formatTemporal } from "@hdapp/shared/web2-common/utils/temporal";
import { ArrowForward } from "@mui/icons-material";
import {
    Avatar,
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
import { useNavigate } from "react-router";
import { sessionManager } from "../../../managers/session.manager";
import { EventLogEntry, eventLogService } from "../../../services/event-log.service";
import { fileService } from "../../../services/file.service";
import { ProfileEntry, profileService } from "../../../services/profile.service";
import { trimWeb3Address } from "../../../utils/trim-web3-address";
import { useDatabase } from "../../../utils/use-database";

export const LogsWidget: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<(EventLogEntry & { created_by_full: (ProfileEntry & { avatar_url: string | null }) | null })[]>([]);

    useDatabase(async () => {
        const eventLogs = await eventLogService.getEventLogs();
        const mapped = await Promise.all(
            eventLogs
                .sort((a, b) => a.created_at.compareTo(b.created_at))
                .reverse()
                .slice(0, 3)
                .map(async log => {
                    try {
                        const profile = await profileService.getProfile(log.created_by, sessionManager.encryption);
                        const avatarBlob = profile.avatar_hash
                            ? await fileService.getFileBlob(profile.avatar_hash, sessionManager.encryption)
                                .catch(() => null)
                            : null;
                        return { ...log, created_by_full: { ...profile, avatar_url: avatarBlob ? URL.createObjectURL(avatarBlob) : null } };
                    } catch (e) {
                        return { ...log, created_by_full: null };
                    }
                })
        );
        setLogs(mapped);
    }, ["event-logs", "profiles", "file_blobs"]);

    return (
        <Card variant="outlined" sx={{ width: "100%" }}>
            <CardContent>
                <Stack direction="row">
                    <Typography variant="h6" component="div">
                        Latest logs
                    </Typography>
                    <Button size="small" endIcon={<ArrowForward />}
                            style={{ marginLeft: "auto" }}
                            onClick={() => navigate("/logs")}>View more</Button>
                </Stack>
            </CardContent>
            <MenuList sx={{ pt: 0, minHeight: 200 }}>
                { !logs.length && (
                    <Typography color="text.secondary" align="center" fontSize={14} my={1}>
                        No logs have been recorded so far.
                    </Typography>
                ) }
                { logs.map(log => (
                    <MenuItem key={log.hash}>
                        <Stack spacing={1} width="100%">
                            <Stack spacing={2} direction="row" alignItems="center" width="100%">
                                <Avatar src={log.created_by_full?.avatar_url ?? void 0}
                                        sx={{ width: 40, height: 40, backgroundColor: theme.palette.success.light }} />
                                <Stack width={0} flexGrow={1}>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Typography variant="subtitle2">
                                            { log.created_by_full?.full_name ?? trimWeb3Address(log.created_by) }
                                        </Typography>
                                        { log.created_by_full && (
                                            <Typography variant="subtitle2" color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                                ({ trimWeb3Address(log.created_by) })
                                            </Typography>
                                        ) }
                                        <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                            { formatTemporal(log.created_at) }
                                        </Typography>
                                    </Stack>
                                    <Typography noWrap variant="subtitle2" sx={{ fontWeight: 400 }}>{ log.created_by_full?.medical_organization_name }</Typography>
                                </Stack>
                            </Stack>
                            { log.title.split("\n").map(line => (
                                <Typography key={line} whiteSpace="normal" variant="subtitle2" fontSize={12} pl={7} sx={{ fontWeight: 400 }}>
                                    { line }
                                </Typography>
                            )) }
                        </Stack>
                    </MenuItem>
                )) }
            </MenuList>
        </Card>
    );
};
