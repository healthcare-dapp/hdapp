import { AsyncAction, formatTemporal, temporalFormats } from "@hdapp/shared/web2-common/utils";
import { ArchiveOutlined, ArrowBack, Event, LocationOn, MoreVert, Share } from "@mui/icons-material";
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    IconButton,
    MenuItem,
    MenuList,
    Stack,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import Grid from "@mui/system/Unstable_Grid";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import Carousel from "react-material-ui-carousel";
import { useNavigate, useParams } from "react-router-dom";
import { ModalProvider } from "../../App2";
import { ShareRecordDialog } from "../../dialogs/share-record.dialog";
import { sessionManager } from "../../managers/session.manager";
import { BlockEntry, blockService } from "../../services/block.service";
import { EventLogEntry, eventLogService } from "../../services/event-log.service";
import { FileEntry, fileService } from "../../services/file.service";
import { ProfileEntry, profileService } from "../../services/profile.service";
import { RecordEntry, recordService } from "../../services/record.service";
import { trimWeb3Address } from "../../utils/trim-web3-address";
import { useDatabase } from "../../utils/use-database";
import { BottomBarWidget } from "../../widgets/bottom-bar";
import { DrawerWidget } from "../../widgets/drawer";
import { HeaderWidget } from "../../widgets/header";

const getRecordAction = new AsyncAction(recordService.getRecord);
const getRecordCreatorProfileAction = new AsyncAction(profileService.getProfile);
const getRecordCreatorAvatarAction = new AsyncAction(fileService.getFileBlob);
const getRecordOwnerAvatarAction = new AsyncAction(fileService.getFileBlob);
const getRecordOwnerProfileAction = new AsyncAction(profileService.getProfile);
const getRecordEventLogsAction = new AsyncAction(
    (recordId: string) => eventLogService.getEventLogsWithRelatedEntity(
        { type: "record", value: recordId }
    )
);

export const RecordPage = () => {
    const { recordId } = useParams();
    const [record, setRecord] = useState<RecordEntry>();
    const [creatorProfile, setCreatorProfile] = useState<ProfileEntry>();
    const [ownerProfile, setOwnerProfile] = useState<ProfileEntry>();
    const [blocks, setBlocks] = useState<BlockEntry[]>([]);
    const [attachments, setAttachments] = useState<FileEntry[]>([]);
    const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
    const [creatorAvatarUrl, setCreatorAvatarUrl] = useState<string>();
    const [logs, setLogs] = useState<(EventLogEntry & { profile: (ProfileEntry & { avatarUrl: string | null }) | null })[]>([]);

    useDatabase(async () => {
        if (!recordId)
            return;

        const result = await getRecordAction.run(recordId, sessionManager.encryption);
        setRecord(result);

        await Promise.all([
            await getRecordCreatorProfileAction.run(result.created_by, sessionManager.encryption)
                .then(async profile => {
                    if (profile.avatar_hash)
                        await getRecordCreatorAvatarAction.run(profile.avatar_hash, sessionManager.encryption)
                            .then(blob => setCreatorAvatarUrl(URL.createObjectURL(blob)));
                    return profile;
                })
                .then(setCreatorProfile),
            await getRecordOwnerProfileAction.run(result.owned_by, sessionManager.encryption)
                .then(setOwnerProfile),
            Promise.all(result.block_ids.map(id => blockService.getBlock(id)))
                .then(setBlocks),
            Promise.all(result.attachment_ids.map(id => fileService.getFileMetadata(id)))
                .then(setAttachments),
            Promise.all(result.attachment_ids.map(id => fileService.getFileBlob(id, sessionManager.encryption)))
                .then(atts => {
                    setAttachmentUrls(atts.map(blob => URL.createObjectURL(blob)));
                }),
            await getRecordEventLogsAction.run(recordId)
                .then(logEntries => {
                    return Promise.all(
                        logEntries.map(async entry => {
                            const profile = await profileService.getProfile(entry.created_by, sessionManager.encryption)
                                .catch(() => null);
                            const profileAvatarBlob = profile?.avatar_hash
                                ? await fileService.getFileBlob(profile.avatar_hash, sessionManager.encryption)
                                : null;
                            return {
                                ...entry,
                                profile: profile ? {
                                    ...profile,
                                    avatarUrl: profileAvatarBlob
                                        ? URL.createObjectURL(profileAvatarBlob)
                                        : null
                                } : null
                            };
                        })
                    );
                })
                .then(setLogs)
        ]);
    });

    const theme = useTheme();
    const navigate = useNavigate();
    const canShowSidebar = useMediaQuery(theme.breakpoints.up("md"));

    return (
        <>
            <DrawerWidget />
            <HeaderWidget />
            { !canShowSidebar && (
                <>
                    <AppBar position="fixed" elevation={0} style={{ filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.75)", background: "linear-gradient(180deg, rgba(0, 0, 0,0.25), transparent)" }}>
                        <Toolbar style={{ paddingRight: "8px" }}>
                            <IconButton size="large"
                                        edge="start"
                                        color="inherit"
                                        aria-label="menu"
                                        sx={{ mr: 2 }}
                                        onClick={() => navigate("/")}>
                                <ArrowBack />
                            </IconButton>
                            <Box flexGrow={1} />
                            <div>
                                <IconButton size="large"
                                            color="inherit">
                                    <Share />
                                </IconButton>
                                <IconButton size="large"
                                            color="inherit">
                                    <MoreVert />
                                </IconButton>
                            </div>
                        </Toolbar>
                    </AppBar>
                    <Box mt={7} />
                </>
            ) }
            { !canShowSidebar && (
                <Carousel>
                    {
                        attachmentUrls.map(url => (
                            <img src={url} key={url}
                                 style={{ borderRadius: "16px", width: "100%", height: "400px", objectFit: "contain", background: theme.palette.grey[200], marginTop: "-64px" }} />
                        ))
                    }
                </Carousel>
            ) }
            <Container sx={{ pt: 3, pb: 2 }}>
                <Grid container spacing={2}>
                    { canShowSidebar && (
                        <>
                            <Grid xs={12} md={8}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Button variant="outlined" startIcon={<ArrowBack />} sx={{ borderRadius: "100px" }}
                                            onClick={() => navigate("/")}>
                                        Back to Home
                                    </Button>
                                    <Box flexGrow={1} />
                                    { !!record && (
                                        <>
                                            <Button variant="outlined" startIcon={<ArchiveOutlined />}>
                                                Archive
                                            </Button>
                                            <Button variant="contained" disableElevation color="success" startIcon={<Share />}
                                                    onClick={() => ModalProvider.show(ShareRecordDialog, { hash: recordId! })}>
                                                Share
                                            </Button>
                                        </>
                                    ) }
                                </Stack>
                            </Grid>
                            <Grid xs={12} md={4}>
                            </Grid>
                        </>
                    ) }

                    { getRecordAction.pending
                        ? <Grid xs={12} style={{ textAlign: "center", paddingTop: 40 }}><CircularProgress /></Grid>
                        : record ? (
                            <>
                                <Grid xs={12} md={8}>
                                    <Stack spacing={2} alignItems="flex-start">
                                        { canShowSidebar && (
                                            <Carousel>
                                                {
                                                    attachmentUrls.map(url => (
                                                        <img src={url} key={url}
                                                             style={{ borderRadius: "16px", width: "100%", height: "400px", objectFit: "contain", background: theme.palette.grey[200] }} />
                                                    ))
                                                }
                                            </Carousel>
                                        ) }
                                        <Typography fontSize={24}>{ record.title }</Typography>
                                        <Typography fontSize={16} paragraph>
                                            <ReactMarkdown>{ record.description }</ReactMarkdown>
                                        </Typography>

                                    </Stack>
                                </Grid>
                                <Grid xs={12} md={4}>
                                    <Stack spacing={2}>
                                        <Card variant="outlined">
                                            <Stack spacing={0.25} sx={{ px: 3, p: 2 }}>
                                                <Typography fontWeight="500">Created by</Typography>
                                                <Stack spacing={1.5} direction="row" alignItems="center" width="100%" sx={{ pt: 1 }}>
                                                    { getRecordCreatorProfileAction.pending
                                                        ? <CircularProgress style={{ alignSelf: "center" }} />
                                                        : creatorProfile ? (
                                                            <>
                                                                <Avatar sx={{ width: 40, height: 40 }}
                                                                        src={creatorAvatarUrl} />
                                                                <Stack width={0} flexGrow={1}>
                                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                                        <Typography variant="subtitle2">
                                                                            { creatorProfile.full_name }
                                                                        </Typography>
                                                                        <Typography variant="subtitle2" color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                                                            ({ trimWeb3Address(record.created_by) })
                                                                        </Typography>
                                                                    </Stack>
                                                                    <Typography noWrap variant="subtitle2" sx={{ fontWeight: 400 }}>
                                                                        { creatorProfile.medical_organization_name }
                                                                    </Typography>
                                                                </Stack>
                                                            </>
                                                        ) : (
                                                            <Typography variant="subtitle2">
                                                                { record.created_by }
                                                            </Typography>
                                                        ) }
                                                </Stack>
                                                <br />
                                                <Typography fontWeight="500">Date of creation</Typography>
                                                <Typography fontSize={14}>
                                                    { formatTemporal(record.created_at, temporalFormats.ddMMyyyyHHmm) }
                                                </Typography>
                                                { !!blocks.length && (
                                                    <>
                                                        <br />
                                                        <Typography fontWeight="500">Included in blocks</Typography>
                                                        <Stack direction="row" spacing={0.5}>
                                                            { blocks.map(block => (
                                                                <Chip variant="outlined"
                                                                      clickable
                                                                      key={block.hash}
                                                                      size="small"
                                                                      label={block.friendly_name} />
                                                            )) }
                                                        </Stack>
                                                    </>
                                                ) }
                                            </Stack>
                                        </Card>
                                        { record.appointment_ids.map(appointment => (
                                            <Card variant="outlined" key={appointment}>
                                                <CardActionArea>
                                                    <Stack spacing={2} sx={{ px: 3, p: 2 }}>
                                                        <Stack direction="row" alignItems="center" spacing={2}>
                                                            <Avatar sx={{ backgroundColor: theme.palette.primary.main }}><Event /></Avatar>

                                                            <Stack spacing={0} flexGrow={1} width="0">
                                                                <Typography fontWeight="500">Appointment assigned</Typography>
                                                                <Typography fontSize={12} noWrap textOverflow="ellipsis">Additional checkup on bacteria infection</Typography>
                                                            </Stack>
                                                            <Stack spacing={0} alignItems="flex-end">
                                                                <Typography fontSize={14} fontWeight="500" noWrap>March 3rd</Typography>
                                                                <Typography fontWeight="500" noWrap>3:00 PM</Typography>
                                                            </Stack>
                                                        </Stack>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Chip variant="outlined"
                                                                  clickable size="small"
                                                                  icon={<LocationOn />}
                                                                  label="State Hospital of St. Petersburg" />
                                                            <Chip variant="outlined"
                                                                  clickable size="small"
                                                                  avatar={<Avatar sx={{ background: theme.palette.success.light, color: "white !important" }} />}
                                                                  label="Anna Cutemon" />
                                                        </Stack>
                                                    </Stack>
                                                </CardActionArea>
                                            </Card>
                                        )) }

                                        <Card variant="outlined" sx={{ width: "100%" }}>
                                            <CardContent>
                                                <Typography variant="h6" component="div">
                                                    Change log
                                                </Typography>
                                            </CardContent>
                                            <MenuList sx={{ pt: 0, minHeight: "300px" }}>
                                                { logs.map(log => (
                                                    <MenuItem key={log.hash}>
                                                        <Stack spacing={1} width="100%">
                                                            <Stack spacing={2} direction="row" alignItems="center" width="100%">
                                                                <Avatar sx={{ width: 40, height: 40 }}
                                                                        src={log.profile?.avatarUrl ?? void 0} />
                                                                <Stack width={0} flexGrow={1}>
                                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                                        <Typography variant="subtitle2">
                                                                            { log.profile?.full_name ?? log.created_by }
                                                                        </Typography>
                                                                        <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                                                            { formatTemporal(log.created_at) }
                                                                        </Typography>
                                                                    </Stack>
                                                                    <Typography noWrap variant="subtitle2" sx={{ fontWeight: 400 }}>{ log.profile?.medical_organization_name }</Typography>
                                                                </Stack>
                                                            </Stack>
                                                            <Typography whiteSpace="normal" variant="subtitle2" fontSize={12} pl={7} sx={{ fontWeight: 400 }}>{ log.title }</Typography>
                                                        </Stack>
                                                    </MenuItem>
                                                )) }
                                                { creatorProfile && (
                                                    <MenuItem>
                                                        <Stack spacing={1} width="100%">
                                                            <Stack spacing={2} direction="row" alignItems="center" width="100%">
                                                                <Avatar sx={{ width: 40, height: 40 }} src={creatorAvatarUrl} />
                                                                <Stack width={0} flexGrow={1}>
                                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                                        <Typography variant="subtitle2">
                                                                            { creatorProfile.full_name }
                                                                        </Typography>
                                                                        <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                                                            { formatTemporal(record.created_at) }
                                                                        </Typography>
                                                                    </Stack>
                                                                    <Typography noWrap variant="subtitle2" sx={{ fontWeight: 400 }}>You</Typography>
                                                                </Stack>
                                                            </Stack>
                                                            <Typography whiteSpace="normal" variant="subtitle2" fontSize={12} pl={7} sx={{ fontWeight: 400 }}>Created this record</Typography>
                                                        </Stack>
                                                    </MenuItem>
                                                ) }
                                            </MenuList>
                                        </Card>
                                    </Stack>
                                </Grid>
                            </>
                        ) : (
                            <Grid xs={12}>
                                <Typography style={{ paddingTop: 40 }} align="center" color="text.secondary">This record does not exist.</Typography>
                            </Grid>
                        ) }

                </Grid>
            </Container>
            <BottomBarWidget />
        </>
    );
};

