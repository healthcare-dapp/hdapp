import { AsyncAction, formatTemporal, temporalFormats } from "@hdapp/shared/web2-common/utils";
import { ExpandMore, AddPhotoAlternate, Edit } from "@mui/icons-material";
import { Stack, Box, useTheme, Accordion, AccordionSummary, Typography, AccordionDetails, Avatar, Button, useMediaQuery, CircularProgress } from "@mui/material";
import { FC, useState } from "react";
import { sessionManager } from "../../../managers/session.manager";
import { ProfileEntry, profileService } from "../../../services/profile.service";
import { useDatabase } from "../../../utils/use-database";

const getProfileAction = new AsyncAction(profileService.getProfile);

export const MyProfileWidget: FC = x => {
    const theme = useTheme();
    const isAlwaysExpanded = useMediaQuery(theme.breakpoints.up("md"));
    const hasCondensedDetails = useMediaQuery(theme.breakpoints.up("sm"));
    const isChangeAvatarPositionAltered = useMediaQuery(theme.breakpoints.up("sm"));
    const [isExpanded, setIsExpanded] = useState(false);
    const [profile, setProfile] = useState<ProfileEntry>();

    useDatabase(async () => {
        const result = await getProfileAction.run(sessionManager.wallet.address, sessionManager.encryption);
        setProfile(result);
    });

    return (
        <Accordion variant="outlined" expanded={isAlwaysExpanded || isExpanded}
                   onChange={() => setIsExpanded(v => !v)}
                   style={{ borderRadius: "4px" }}>
            <AccordionSummary expandIcon={!isAlwaysExpanded ? <ExpandMore /> : void 0}
                              aria-controls="panel1bh-content"
                              id="panel1bh-header"
                              sx={{ alignItems: "center", height: 38 }}
                              classes={{ content: "summary" }}>
                <Typography fontSize={16} fontWeight={500} component="div">
                    My profile
                </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
                <Stack direction={hasCondensedDetails ? "row" : "column"}
                       spacing={3} sx={{ pl: 3, pr: 1, pt: 0, pb: 1 }}
                       alignItems={hasCondensedDetails ? "flex-start" : "center"}>
                    <Avatar sx={{ width: 160, height: 160 }}
                            src={profile?.avatar
                                ? URL.createObjectURL(profile.avatar)
                                : void 0} />
                    { getProfileAction.pending
                        ? <CircularProgress style={{ alignSelf: "center", margin: "40px 0" }} />
                        : profile ? (
                            <Stack spacing={2} sx={{ flexGrow: 1, height: "100%" }}>
                                <Stack textAlign={!hasCondensedDetails ? "center" : "left"}>
                                    <Typography variant="h6">
                                        { profile.full_name }
                                    </Typography>
                                    { /* <Typography variant="subtitle2" color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                        Also known as: Гарифуллин Руслан Ильфатович
                                    </Typography> */ }
                                </Stack>
                                <Box sx={{ display: "grid", gridTemplateRows: "1fr 1fr 1fr", gap: 1, gridAutoFlow: "column" }}>
                                    <Typography>
                                        <b>Gender:</b>
                                        &nbsp;
                                        { !hasCondensedDetails && <br /> }
                                        { profile.gender ?? <i>unspecified</i> }
                                    </Typography>
                                    <Typography>
                                        <b>Date of birth:</b>
                                        &nbsp;
                                        { !hasCondensedDetails && <br /> }
                                        { formatTemporal(profile.birth_date, temporalFormats.MMMddyyyy) }
                                    </Typography>
                                    <Typography>
                                        <b>Blood type:</b>
                                        &nbsp;
                                        { !hasCondensedDetails && <br /> }
                                        { profile.blood_type ?? <i>unspecified</i> }
                                    </Typography>
                                    <Typography>
                                        <b>Height:</b>
                                        &nbsp;
                                        { !hasCondensedDetails && <br /> }
                                        { profile.height ? `${profile.height} cm` : <i>unspecified</i> }
                                    </Typography>
                                    <Typography>
                                        <b>Weight:</b>
                                        &nbsp;
                                        { !hasCondensedDetails && <br /> }
                                        { profile.weight ? `${profile.weight} kg` : <i>unspecified</i> }
                                    </Typography>
                                </Box>
                            </Stack>
                        ) : <Typography color="error" align="center" style={{ alignSelf: "center", justifyContent: "center", padding: "20px 0" }}>There was an error loading your profile.</Typography> }
                </Stack>
                <Stack p={1} direction="row">
                    { isChangeAvatarPositionAltered ? (
                        <Box textAlign="center"
                             width="160px"
                             ml={2}>
                            <Button size="small" startIcon={<AddPhotoAlternate />}>
                                Change Avatar
                            </Button>
                        </Box>
                    ) : (
                        <Button size="small" startIcon={<AddPhotoAlternate />}>
                            Change Avatar
                        </Button>
                    ) }
                    <Button size="small" startIcon={<Edit />}
                            style={{ marginLeft: "auto" }}>Edit</Button>
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
};
