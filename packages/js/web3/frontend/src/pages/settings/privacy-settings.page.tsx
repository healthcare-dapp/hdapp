import { AsyncAction } from "@hdapp/shared/web2-common/utils/async-action";
import { formatTemporal } from "@hdapp/shared/web2-common/utils/temporal";
import { ComputerOutlined, PersonRemove } from "@mui/icons-material";
import { Avatar, Box, Button, Card, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { SessionManager, sessionManager } from "../../managers/session.manager";
import { ProfileEntry, ProfileSearchRequest } from "../../services/profile.service";
import { SettingsPageBase } from "./settings.page";

const getProfilesAction = new AsyncAction((sm: SessionManager, request: ProfileSearchRequest) =>
    sm.db.profiles.searchProfiles(request, sm.encryption));

export const PrivacySettingsPage = observer(() => {
    const { db, encryption, wallet } = sessionManager;
    const [contacts, setContacts] = useState<ProfileEntry[]>([]);
    const [contactAvatars, setContactAvatars] = useState<Record<string, string>>({});

    useEffect(() => {
        (async () => {
            const profiles = (await getProfilesAction.run(sessionManager, {}))
                .filter(p => p.address !== wallet.address);
            setContacts(profiles);

            const avatars = await Promise.all(
                profiles
                    .filter(p => p.avatar_hash && !contactAvatars[p.avatar_hash])
                    .map(p => db.files.getFileBlob(p.avatar_hash!, encryption)
                        .then(f => ({ [p.avatar_hash!]: URL.createObjectURL(f) })))
            );
            setContactAvatars(Object.assign({}, ...avatars));
        })();
    }, []);

    return (
        <SettingsPageBase>
            <Stack spacing={1} flex={1}>
                <Typography variant="h6">
                    My profile visibility
                </Typography>
                <Card variant="outlined">
                    <Stack p={2}>
                        <FormControlLabel control={<Checkbox defaultChecked />}
                                          label="Share my profile information with my contacts" />
                        <Stack py={0} pl={3}>
                            <FormControlLabel control={<Checkbox defaultChecked />} style={{ marginLeft: 0, marginRight: 0 }}
                                              label="Share my date of birth" />
                            <FormControlLabel control={<Checkbox defaultChecked />} style={{ marginLeft: 0, marginRight: 0 }}
                                              label="Share my gender" />
                            <FormControlLabel control={<Checkbox defaultChecked />} style={{ marginLeft: 0, marginRight: 0 }}
                                              label="Share my general medical data" />
                        </Stack>
                        <br />
                        <FormControlLabel control={<Checkbox />}
                                          label="Make my profile discoverable using my Web3 address" />
                    </Stack>
                </Card>
                <br />
                <Typography variant="h6">
                    Your contacts
                </Typography>
                <Card variant="outlined">
                    <Stack p={2} spacing={1}>
                        { contacts.length
                            ? contacts.map(user => (
                                <Stack alignItems="center" direction="row"
                                       key={user.address} spacing={1}>
                                    <Avatar src={contactAvatars[user.address]}><ComputerOutlined /></Avatar>
                                    <Stack>
                                        <Typography fontSize={16} fontWeight={500}>{ user.full_name }</Typography>
                                        <Typography fontSize={12}>
                                            { user.address }
                                        </Typography>
                                        <Typography fontSize={12}>Last updated at: { formatTemporal(user.updated_at) }</Typography>
                                    </Stack>
                                    <Box flex={1} />
                                    <Button variant="outlined" color="error" startIcon={<PersonRemove />}>
                                        Block
                                    </Button>
                                </Stack>
                            ))
                            : <Typography color="text.secondary" align="center">No contacts have been added yet.</Typography> }
                    </Stack>
                </Card>
            </Stack>
        </SettingsPageBase>
    );
});
