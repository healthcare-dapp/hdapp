import { formatBytes } from "@hdapp/shared/web2-common/utils/format-bytes";
import { ArchiveOutlined } from "@mui/icons-material";
import { Box, Button, Card, CircularProgress, Stack, Typography, useTheme } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { sessionManager } from "../../managers/session.manager";
import { sharedDbService } from "../../services/db.service";
import { useDatabase } from "../../utils/use-database";
import { SettingsPageBase } from "./settings.page";

export const StorageSettingsPage = observer(() => {
    const { db } = sessionManager;
    const theme = useTheme();
    const [filesStorageSize, setFilesStorageSize] = useState(0);

    useDatabase(async () => {
        const files = await db.files.getFiles();
        setFilesStorageSize(files.reduce((accum, cur) => accum + cur.byte_length, 0));
    }, ["files"]);

    if (!sharedDbService.storage)
        return <SettingsPageBase />;

    return (
        <SettingsPageBase>
            <Stack spacing={1} flex={1}>
                <Typography variant="h6">
                    Storage usage
                </Typography>
                <Card variant="outlined">
                    <Stack direction="row" p={2} spacing={2}>
                        <Stack flex={1}>
                            <Typography fontSize="16px" color="text.secondary">
                                Total storage used
                            </Typography>
                            <Typography fontSize="32px">
                                { formatBytes(sharedDbService.storage.usage!) } <span style={{ fontSize: "18px", color: theme.palette.text.secondary }}>out of</span> <span style={{ fontSize: "18px", fontWeight: 500, color: theme.palette.text.primary }}>{ formatBytes(sharedDbService.storage.quota!) }</span>
                            </Typography>
                            <br />
                            <Stack direction="row" spacing={4}>
                                <Stack>
                                    <Typography fontSize="16px" color="text.secondary">
                                        Files
                                    </Typography>
                                    <Typography fontSize="16px" fontWeight="500" color="text.primary">
                                        { formatBytes(filesStorageSize) }
                                    </Typography>
                                </Stack>
                                <Stack>
                                    <Typography fontSize="16px" color="text.secondary">
                                        Other data
                                    </Typography>
                                    <Typography fontSize="16px" fontWeight="500" color="text.primary">
                                        { formatBytes(sharedDbService.storage.usage! - filesStorageSize) }
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                        <Box sx={{ position: "relative", alignSelf: "flex-start", display: "inline-flex" }}>
                            <CircularProgress size="72px" variant="determinate" value={Math.max(1, (sharedDbService.storage.usage! / sharedDbService.storage.quota!) * 100)} />
                            <Box sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <Typography fontSize="20px"
                                            component="div"
                                            color="text.secondary">{ `${Math.round(sharedDbService.storage.usage! / sharedDbService.storage.quota!)}%` }</Typography>
                            </Box>
                        </Box>
                    </Stack>
                </Card>
                <br />
                <Typography variant="h6">
                    Data backup
                </Typography>
                <Card variant="outlined">
                    <Stack px={2} py={3} alignItems="flex-start" spacing={2}>
                        <Typography fontSize="16px">
                            You can export all your data in HDAPP as an archive at any time.<br />
                            Note that you <b>cannot</b> use your data archive to restore your application data.
                        </Typography>
                        <Button variant="contained" disableElevation startIcon={<ArchiveOutlined />}>Export my data...</Button>
                    </Stack>
                </Card>
            </Stack>
        </SettingsPageBase>
    );
});
