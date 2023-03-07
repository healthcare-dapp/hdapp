import { formatTemporal, temporalFormats } from "@hdapp/shared/web2-common/utils";
import { ChronoUnit, LocalDateTime } from "@js-joda/core";
import { ExpandMore, KeyboardArrowUp, KeyboardArrowDown, Edit, ShieldOutlined, Shield } from "@mui/icons-material";
import { Stack, Box, Accordion, AccordionSummary, Typography, AvatarGroup, Avatar, AccordionDetails, Button, IconButton, useTheme, useMediaQuery } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import { FC, useState } from "react";
import { RecordGroup } from "../dashboard.vm";
import { DataRecordItemWidget } from "./data-record-item.widget";
import { DataRecordsGridWidget } from "./data-records-grid.widget";

export const DataGroupItemWidget: FC<{ group: RecordGroup }> = x => {
    const theme = useTheme();
    const canShowSharingInfo = useMediaQuery(theme.breakpoints.up("sm"));
    const [isExpanded, setIsExpanded] = useState(false);
    const [isArchiveOpened, setIsArchiveOpened] = useState(false);
    const [firstSharedWith, secondSharedWith, ...moreSharedWith] = x.group.shared_with;
    return (
        <Accordion expanded={isExpanded} onChange={() => setIsExpanded(v => !v)}>
            <AccordionSummary expandIcon={<ExpandMore />}
                              sx={{ alignItems: "center", height: 38 }}
                              classes={{ content: "summary" }}>
                <Stack direction="row" spacing={1} alignItems="center"
                       sx={{ flexGrow: 1, mr: 1 }}>
                    <Stack style={{ flexGrow: 1 }}>
                        <Typography>
                            { x.group.title }
                        </Typography>
                        { isExpanded && (
                            <Typography fontSize={12} color="text.secondary">
                                Last updated { x.group.aggregated_updated_at.until(LocalDateTime.now(), ChronoUnit.HOURS) } hours ago
                            </Typography>
                        ) }
                    </Stack>
                    { canShowSharingInfo && (
                        <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                            { firstSharedWith && !secondSharedWith && `${firstSharedWith.full_name} have access` }
                            { firstSharedWith && secondSharedWith && !moreSharedWith.length && `${firstSharedWith.full_name} and ${secondSharedWith.full_name} have access` }
                            { firstSharedWith && secondSharedWith && !!moreSharedWith.length && `${firstSharedWith.full_name} and ${moreSharedWith.length + 1} more doctors have access` }
                        </Typography>
                    ) }
                    <AvatarGroup componentsProps={{ additionalAvatar: { sx: { width: 32, height: 32, fontSize: 16 } } }}
                                 total={x.group.shared_with.length}>
                        { x.group.shared_with.map(user => (
                            <Avatar key={user.address} sx={{ backgroundColor: user.avatar, width: 32, height: 32 }} />
                        )) }
                    </AvatarGroup>
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                <Stack spacing={2}>
                    <DataRecordsGridWidget>
                        { x.group.records.map(record => (
                            <DataRecordItemWidget key={record.hash}
                                                  hash={record.hash}
                                                  title={record.title}
                                                  imageHash={record.attachment_ids[0]}
                                                  hasAppointment={!!record.appointment_ids.length}
                                                  time={formatTemporal(record.created_at, temporalFormats.MMMddyyyy)}
                                                  description={record.description}
                                                  itemsCount={record.attachment_ids.length} />
                        )) }
                    </DataRecordsGridWidget>
                    <Stack direction="row" spacing={1}>
                        <Button variant="text" color="primary"
                                startIcon={isArchiveOpened ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                onClick={() => setIsArchiveOpened(v => !v)}>
                            { isArchiveOpened ? "Hide" : "Show" } archived
                        </Button>
                        <Box flexGrow={1} />
                        { canShowSharingInfo ? (
                            <Button variant="outlined" color="primary" startIcon={<Edit />}>
                                Edit section
                            </Button>
                        ) : (
                            <IconButton>
                                <Edit />
                            </IconButton>
                        ) }
                        { canShowSharingInfo ? (
                            <Button variant="contained" disableElevation color="success" startIcon={<ShieldOutlined />}>
                                Manage access
                            </Button>
                        ) : (
                            <IconButton color="success">
                                <Shield />
                            </IconButton>
                        ) }
                    </Stack>
                    { isArchiveOpened && (
                        <>
                            <Typography px={1}>
                                <b>Archived records</b>
                            </Typography>
                            <Grid2 container spacing={2}>
                                <DataRecordItemWidget />
                            </Grid2>
                        </>
                    ) }
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
};
