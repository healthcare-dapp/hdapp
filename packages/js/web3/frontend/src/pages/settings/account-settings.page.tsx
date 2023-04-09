import { PaidOutlined } from "@mui/icons-material";
import { Button, Card, Stack, Typography, useTheme } from "@mui/material";
import { observer } from "mobx-react-lite";
import { sessionManager } from "../../managers/session.manager";
import { SettingsPageBase } from "./settings.page";

export const AccountSettingsPage = observer(() => {
    const { wallet, account } = sessionManager;
    const theme = useTheme();

    return (
        <SettingsPageBase>
            <Stack spacing={1} flex={1}>
                <Typography variant="h6">
                    Account credentials
                </Typography>
                <Card variant="outlined">
                    <Stack p={2}>
                        <Typography fontSize="16px" color="text.secondary">
                            Network
                        </Typography>
                        <Typography style={{ color: "#8247e5" }} fontSize="16px" fontWeight="600">
                            Polygon Mumbai
                        </Typography>
                        <br />
                        <Typography fontSize="16px" color="text.secondary">
                            Web3 address
                        </Typography>
                        <Typography fontSize="16px" fontWeight="500">
                            { wallet.address }
                        </Typography>
                        <br />
                        <Typography fontSize="16px" color="text.secondary">
                            Private key
                        </Typography>
                        <Typography fontSize="16px" fontWeight="500">
                            <a href="#">Click to reveal</a>
                        </Typography>
                    </Stack>
                </Card>
                <br />
                <Typography variant="h6">
                    Account wallet information
                </Typography>
                <Card variant="outlined">
                    <Button variant="outlined" startIcon={<PaidOutlined />}
                            sx={{ float: "right", m: 2 }}>Top up</Button>
                    <Stack p={2}>
                        <Typography fontSize="16px" color="text.secondary">
                            Current balance
                        </Typography>
                        <Typography fontSize="32px">
                            { account.balance } <span style={{ fontSize: "18px", color: theme.palette.text.secondary }}>MATIC</span>
                        </Typography>
                        <br />
                        <Stack direction="row" spacing={3}>
                            <Stack>
                                <Typography fontSize="16px" color="text.secondary">
                                    Distributed by system
                                </Typography>
                                <Typography fontSize="16px" fontWeight="500">
                                    { account.distributed } MATIC
                                </Typography>
                            </Stack>
                            <Stack>
                                <Typography fontSize="16px" color="text.secondary">
                                    Used gas fees recently
                                </Typography>
                                <Typography fontSize="16px" fontWeight="500">
                                    { account.feesSpent } MATIC
                                </Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                </Card>
                <br />
                <Typography variant="h6">
                    Transaction history
                </Typography>
                <Card variant="outlined">
                    <Stack p={2}>
                        <Typography fontSize="16px">
                            For a detailed transaction history, please visit <a href={account.blockExplorerUrl}>PolygonScan</a>
                        </Typography>
                    </Stack>
                </Card>
            </Stack>
        </SettingsPageBase>
    );
});
