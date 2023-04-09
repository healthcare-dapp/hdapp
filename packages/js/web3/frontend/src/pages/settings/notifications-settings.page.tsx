import { Card, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { SettingsPageBase } from "./settings.page";

export const NotificationsSettingsPage = observer(() => {
    return (
        <SettingsPageBase>
            <Stack spacing={1} flex={1}>
                <Typography variant="h6">
                    Default behavior
                </Typography>
                <Card variant="outlined">
                    <Stack p={2}>
                        <FormControlLabel control={<Checkbox disabled defaultChecked />}
                                          label="Create a notification in the notification list" />
                        <FormControlLabel control={<Checkbox defaultChecked />}
                                          label="Show a popup message" />
                        <FormControlLabel control={<Checkbox defaultChecked />}
                                          label="Play a sound" />
                        <FormControlLabel control={<Checkbox />}
                                          label="Send a notification using your device's means" />
                        <FormControlLabel control={<Checkbox disabled />}
                                          label="Send an e-mail" />
                    </Stack>
                </Card>
                <br />
                <Typography variant="h6">
                    Per-event notification settings
                </Typography>
                <Card variant="outlined">
                    <Stack p={2}>
                        todo
                    </Stack>
                </Card>
                <br />
                <Typography variant="h6">
                    Custom notification sound
                </Typography>
                <Card variant="outlined">
                    <Stack p={2}>
                        todo
                    </Stack>
                </Card>
            </Stack>
        </SettingsPageBase>
    );
});
