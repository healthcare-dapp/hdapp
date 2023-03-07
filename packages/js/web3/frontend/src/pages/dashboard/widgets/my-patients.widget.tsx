import { ExpandMore, MoreVert, MessageOutlined, PostAddOutlined, Search } from "@mui/icons-material";
import { Stack, Box, Typography, IconButton, Accordion, AccordionSummary, Avatar, Fade, Button, AccordionDetails, Card, useMediaQuery, useTheme } from "@mui/material";
import { FC, useState } from "react";
import Paper1 from "../../../assets/raster/mocks/paper1.png";
import Paper2 from "../../../assets/raster/mocks/paper2.jpg";
import Paper3 from "../../../assets/raster/mocks/paper3.png";
import Paper4 from "../../../assets/raster/mocks/paper4.png";
import { DataRecordItemWidget } from "./data-record-item.widget";
import { DataRecordsGridWidget } from "./data-records-grid.widget";

export const MyPatientsWidget: FC = x => {
    const theme = useTheme();
    const hasCondensedDetails = useMediaQuery(theme.breakpoints.up("sm"));
    const [isExpanded, setIsExpanded] = useState(false);

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
                <Accordion expanded={isExpanded} onChange={() => setIsExpanded(v => !v)}>
                    <AccordionSummary expandIcon={<ExpandMore />}
                                      aria-controls="panel1bh-content"
                                      id="panel1bh-header"
                                      sx={{ alignItems: "center", height: 38 }}
                                      classes={{ content: "summary" }}>
                        <Stack direction="row" spacing={2} alignItems="center"
                               sx={{ flexGrow: 1, mr: 1 }}>
                            <Avatar sx={{ width: 32, height: 32 }} />
                            <Stack spacing={-0.25} style={{ flexGrow: 1 }}>
                                <Typography fontWeight={isExpanded ? "500" : "400"}>
                                    Ruslan Garifullin
                                </Typography>
                                { isExpanded && (
                                    <Typography fontSize={12} color="text.secondary">
                                        Last updated 3 days ago
                                    </Typography>
                                ) }
                            </Stack>
                            <Fade in={isExpanded}>
                                <Stack direction="row" spacing={1}>
                                    <IconButton><MoreVert /></IconButton>
                                    <Button variant="outlined" color="info" startIcon={<MessageOutlined />}>
                                        Send a message
                                    </Button>
                                    <Button variant="contained" disableElevation color="success" startIcon={<PostAddOutlined />}>
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
                                    <Avatar sx={{ width: "96px", height: "96px" }} /><Stack textAlign={!hasCondensedDetails ? "center" : "left"}>
                                        <Stack spacing={-0.75}>
                                            <Typography variant="h6">
                                                Ruslan Garifullin
                                            </Typography>
                                            <Typography fontSize={12} color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                                Also known as: Гарифуллин Руслан Ильфатович
                                            </Typography>
                                        </Stack>
                                        <Box sx={{ display: "grid", gridTemplateRows: "1fr 1fr", rowGap: "8px", columnGap: "16px", gridAutoFlow: "column", py: 1 }}>
                                            <Typography fontSize={14}>
                                                <b>Gender:</b>
                                                &nbsp;
                                                { !hasCondensedDetails && <br /> }
                                                Male
                                            </Typography>
                                            <Typography fontSize={14}>
                                                <b>Date of birth:</b>
                                                &nbsp;
                                                { !hasCondensedDetails && <br /> }
                                                April 21, 2002
                                            </Typography>
                                            <Typography fontSize={14}>
                                                <b>Blood type:</b>
                                                &nbsp;
                                                { !hasCondensedDetails && <br /> }
                                                AB-
                                            </Typography>
                                            <Typography fontSize={14}>
                                                <b>Height:</b>
                                                &nbsp;
                                                { !hasCondensedDetails && <br /> }
                                                182 cm
                                            </Typography>
                                            <Typography fontSize={14}>
                                                <b>Weight:</b>
                                                &nbsp;
                                                { !hasCondensedDetails && <br /> }
                                                65 kg
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </Card>
                            <DataRecordsGridWidget>
                                <DataRecordItemWidget imageHash={Paper1} title="Prescription until 3rd March" description={`Please obtain and take the following pills:
- Ibuprofen 200mg three times per day
- Ciprolet 10mg two times per day`} itemsCount={2} hasAppointment unread time="3 hours ago" avatarColor={theme.palette.success.light} />
                                <DataRecordItemWidget imageHash={Paper2} title="Results of medical assessment" description="The tests indicate that you might have a bacterial infection. I advise you to"
                                                      itemsCount={4} time="6 days ago" />
                                <DataRecordItemWidget imageHash={Paper3} title="Additional tests required" description="I have reviewed your test results you sent on 19th, however more data is needed to draw a conclusion"
                                                      time="Feb 22, 2023" />
                                <DataRecordItemWidget imageHash={Paper4} title="Prescription until 22nd February" hasAppointment time="Feb 13, 2022" />

                            </DataRecordsGridWidget>
                        </Stack>
                    </AccordionDetails>
                </Accordion>
            </Stack>
        </>
    );
};
