import { formatTemporal } from "@hdapp/shared/web2-common/utils/temporal";
import { ChronoUnit, LocalDateTime } from "@js-joda/core";
import { ExpandMore, MoreVert, MessageOutlined, PostAddOutlined, Search, AddBoxOutlined, Add } from "@mui/icons-material";
import { Stack, Box, Typography, IconButton, Accordion, AccordionSummary, Avatar, Fade, Button, AccordionDetails, Card, useMediaQuery, useTheme } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
import { useNavigate } from "react-router";
import { ModalProvider } from "../../../App2";
import { CreateBlockDialog } from "../../../dialogs/create-block.dialog";
import { CreateRecordDialog } from "../../../dialogs/create-record.dialog";
import { RequestDataDialog } from "../../../dialogs/request-data.dialog";
import { sessionManager } from "../../../managers/session.manager";
import { useDatabase } from "../../../utils/use-database";
import { PatientsViewModel } from "../patients.vm";
import { DataGroupsListWidget } from "./data-groups-list.widget";

export const MyPatientsWidget: FC = observer(x => {
    const [vm] = useState(() => new PatientsViewModel(sessionManager));
    const { db } = sessionManager;
    const theme = useTheme();
    const navigate = useNavigate();
    const hasCondensedDetails = useMediaQuery(theme.breakpoints.up("sm"));
    const [expandedId, setExpandedId] = useState<string>();
    const { profiles } = vm;

    useDatabase(async () => {
        await vm.loadProfiles.tryRun();
    }, ["files", "profiles"]);

    return (
        <>
            <Stack alignItems="center" direction="row" spacing={1}>
                <Typography variant="h5">My patients</Typography>
                <Box flexGrow={1} />
                <IconButton>
                    <Search />
                </IconButton>
            </Stack>
            <Stack>
                { profiles.length
                    ? profiles.map(p => {
                        const lastUpdatedAggregated = p.vm.groups.map(g => g.aggregated_updated_at.until(LocalDateTime.now(), ChronoUnit.HOURS))
                            .sort((a, b) => a - b).shift();
                        return (
                            <Accordion expanded={expandedId === p.address}
                                       onChange={() => setExpandedId(expandedId === p.address ? void 0 : p.address)}
                                       key={p.address}>
                                <AccordionSummary expandIcon={<ExpandMore />}
                                                  aria-controls="panel1bh-content"
                                                  id="panel1bh-header"
                                                  sx={{ alignItems: "center", height: 38 }}
                                                  classes={{ content: "summary" }}>
                                    <Stack direction="row" spacing={2} alignItems="center"
                                           sx={{ flexGrow: 1, mr: 1 }}>
                                        <Avatar sx={{ width: 32, height: 32 }} src={p.avatar_url} />
                                        <Stack spacing={-0.25} style={{ flexGrow: 1 }}>
                                            <Typography fontWeight={expandedId === p.address ? "500" : "400"}>
                                                { p.full_name }
                                            </Typography>
                                            { expandedId && lastUpdatedAggregated !== undefined && (
                                                <Typography fontSize={12} color="text.secondary">
                                                    Last updated { lastUpdatedAggregated } hours ago
                                                </Typography>
                                            ) }
                                        </Stack>
                                        <Fade in={expandedId === p.address}>
                                            <Stack direction="row" spacing={1}>
                                                <IconButton><MoreVert /></IconButton>
                                                <Button variant="outlined" color="info" startIcon={<MessageOutlined />}
                                                        onClick={async e => {
                                                            e.stopPropagation();
                                                            const chats = await db.chats.searchChats({});
                                                            const chat = chats.find(c => c.participant_ids.includes(p.address));
                                                            if (chat)
                                                                navigate("/messages/" + chat.hash);
                                                        }}>
                                                    Send a message
                                                </Button>
                                                <Button variant="contained" disableElevation color="success" startIcon={<PostAddOutlined />}
                                                        onClick={async () => {
                                                            await ModalProvider.show(RequestDataDialog, { address: p.address });
                                                        }}>
                                                    Request Data
                                                </Button>
                                            </Stack>
                                        </Fade>
                                    </Stack>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Stack spacing={2}>
                                        <Card variant="outlined" sx={{ px: 2, py: 1 }}>
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Avatar sx={{ width: "96px", height: "96px" }} src={p.avatar_url} />
                                                <Stack textAlign={!hasCondensedDetails ? "center" : "left"}>
                                                    <Stack spacing={-0.75}>
                                                        <Typography variant="h6">
                                                            { p.full_name }
                                                        </Typography>
                                                        <Typography fontSize={12} color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                                            { p.address }
                                                        </Typography>
                                                    </Stack>
                                                    <Box sx={{ display: "grid", gridTemplateRows: "1fr 1fr", rowGap: "8px", columnGap: "16px", gridAutoFlow: "column", py: 1 }}>
                                                        <Typography fontSize={14}>
                                                            <b>Gender:</b>
                                                &nbsp;
                                                            { !hasCondensedDetails && <br /> }
                                                            { p.gender ?? <i>unspecified</i> }
                                                        </Typography>
                                                        <Typography fontSize={14}>
                                                            <b>Date of birth:</b>
                                                &nbsp;
                                                            { !hasCondensedDetails && <br /> }
                                                            { formatTemporal(p.birth_date) ?? <i>unspecified</i> }
                                                        </Typography>
                                                        <Typography fontSize={14}>
                                                            <b>Blood type:</b>
                                                &nbsp;
                                                            { !hasCondensedDetails && <br /> }
                                                            { p.blood_type ?? <i>unspecified</i> }
                                                        </Typography>
                                                        <Typography fontSize={14}>
                                                            <b>Height:</b>
                                                &nbsp;
                                                            { !hasCondensedDetails && <br /> }
                                                            { p.height ? `${p.height} cm` : <i>unspecified</i> }
                                                        </Typography>
                                                        <Typography fontSize={14}>
                                                            <b>Weight:</b>
                                                &nbsp;
                                                            { !hasCondensedDetails && <br /> }
                                                            { p.weight ? `${p.weight} kg` : <i>unspecified</i> }
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Stack>
                                        </Card>
                                        <DataGroupsListWidget canCreateBlock={p.is_full_access} forUser={p.address}
                                                              groups={toJS(p.vm.groups)} />
                                        { p.is_full_access && (
                                            <Grid2 container spacing={2}>
                                                <Grid2 xs={6}>
                                                    <Button variant="outlined" onClick={() => ModalProvider.show(CreateRecordDialog, { forUser: p.address })} style={{ width: "100%", height: "100%", minHeight: "100px", maxHeight: "200px" }}>
                                                        <Stack alignItems="center">
                                                            <Add />
                                                            <Typography fontWeight="500">New record</Typography>
                                                        </Stack>
                                                    </Button>
                                                </Grid2>
                                                <Grid2 xs={6}>
                                                    <Button variant="outlined" onClick={() => ModalProvider.show(CreateBlockDialog, { forUser: p.address })} style={{ width: "100%", height: "100%", minHeight: "100px", maxHeight: "200px" }}>
                                                        <Stack alignItems="center">
                                                            <AddBoxOutlined />
                                                            <Typography fontWeight="500">New block</Typography>
                                                        </Stack>
                                                    </Button>
                                                </Grid2>
                                            </Grid2>
                                        ) }
                                    </Stack>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })
                    : <Typography color="text.secondary" align="center" sx={{ my: 5 }}>No patients have been added yet!</Typography> }

            </Stack>
        </>
    );
});
