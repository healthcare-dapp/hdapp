import { StatisticsService } from "@hdapp/shared/web2-common/api/services/statistics.service";
import { StatisticsDto } from "@hdapp/shared/web2-common/dto/statistics.dto";
import { BadgeOutlined, List, People } from "@mui/icons-material";
import { Button, Card, Container, Stack, Typography, useTheme } from "@mui/material";
import { observer } from "mobx-react-lite";
import { forwardRef, useEffect, useState } from "react";
import { PageWidget } from "../../widgets/page";

export const DashboardPage = observer(forwardRef((props, ref) => {
    const theme = useTheme();
    const [statistics, setStatistics] = useState<StatisticsDto>();

    useEffect(() => {
        (async () => {
            const response = await StatisticsService.get();
            setStatistics(response);
        })();
    }, []);

    return (
        <PageWidget>
            <Container maxWidth="md">
                <Stack spacing={3} sx={{ pt: 5, pb: 3 }}>
                    <Typography variant="h4">Welcome, Alexander!</Typography>
                    <Stack spacing={2} direction="row">
                        <Typography variant="h6">Users statistics</Typography>
                        <Button startIcon={<BadgeOutlined />} style={{ marginLeft: "auto" }}>Manage requests</Button>
                        <Button startIcon={<People />}>Manage users</Button>
                    </Stack>
                    { statistics && (
                        <>
                            <Stack direction="row" spacing={3}>
                                <Card variant="outlined"
                                      sx={{ py: 1, px: 2, minWidth: 200 }}>
                                    <Typography>
                                        Total users
                                    </Typography>
                                    <Typography variant="h3">
                                        { statistics.users.total }
                                    </Typography>
                                </Card>
                                <Card variant="outlined"
                                      sx={{ py: 1, px: 2, minWidth: 200 }}>
                                    <Typography>
                                        Active users
                                    </Typography>
                                    <Typography variant="h3">
                                        { statistics.users.active }
                                    </Typography>
                                    <Typography fontSize={12} color="text.secondary">
                                        last month
                                    </Typography>
                                </Card>
                                <Card variant="outlined"
                                      sx={{ py: 1, px: 2, minWidth: 200 }}>
                                    <Typography>
                                        New users
                                    </Typography>
                                    <Typography variant="h3">
                                        { statistics.users.new }
                                    </Typography>
                                    <Typography fontSize={12} color="text.secondary">
                                        last month
                                    </Typography>
                                </Card>
                            </Stack>
                            <Stack direction="row" spacing={3}>
                                <Card variant="outlined"
                                      sx={{ py: 1, px: 2, minWidth: 200 }}>
                                    <Typography>
                                        Total Doctors
                                    </Typography>
                                    <Typography variant="h3">
                                        { statistics.users.totalDoctors }
                                    </Typography>
                                </Card>
                                <Card variant="outlined"
                                      sx={{ py: 1, px: 2, minWidth: 200, backgroundColor: theme.palette.warning.main, color: "white" }}>
                                    <Typography>
                                        Requests pending
                                    </Typography>
                                    <Typography variant="h3">
                                        { statistics.users.pending }
                                    </Typography>
                                </Card>
                            </Stack>
                        </>
                    ) }

                    <Stack direction="row">
                        <Typography variant="h6">Transaction statistics</Typography>
                        <Button startIcon={<List />} sx={{ ml: "auto" }}>View on Etherscan</Button>
                    </Stack>
                    <Stack direction="row" spacing={3}>
                        <Card variant="outlined"
                              sx={{ py: 1, px: 2, minWidth: 200 }}>
                            <Typography>
                                Processed transactions
                            </Typography>
                            <Typography variant="h3">
                                3.6K
                            </Typography>
                            <Typography fontSize={12} color="text.secondary">
                                last 24 hours
                            </Typography>
                        </Card>
                        <Card variant="outlined"
                              sx={{ py: 1, px: 2, minWidth: 200, backgroundColor: theme.palette.error.main, color: "white" }}>
                            <Typography>
                                Failed transactions
                            </Typography>
                            <Typography variant="h3">
                                24
                            </Typography>
                            <Typography fontSize={12}>
                                last 24 hours
                            </Typography>
                        </Card>
                    </Stack>
                    <Stack direction="row" spacing={3}>
                        <Card variant="outlined"
                              sx={{ py: 1, px: 2, minWidth: 200 }}>
                            <Typography>
                                Fees spent
                            </Typography>
                            <Typography variant="h3">
                                12.57
                            </Typography>
                            <Typography fontSize={12} color="text.secondary">
                                last 24 hours, $MATIC
                            </Typography>
                        </Card>
                        <Card variant="outlined"
                              sx={{ py: 1, px: 2, minWidth: 200 }}>
                            <Typography>
                                Coins distributed
                            </Typography>
                            <Typography variant="h3">
                                13.61
                            </Typography>
                            <Typography fontSize={12} color="text.secondary">
                                last 24 hours, $MATIC
                            </Typography>
                        </Card>
                        <Card variant="outlined"
                              sx={{ py: 1, px: 2, minWidth: 200 }}>
                            <Typography>
                                Current excessive supply
                            </Typography>
                            <Typography variant="h3">
                                52.1
                            </Typography>
                            <Typography fontSize={12} color="text.secondary">
                                $MATIC
                            </Typography>
                        </Card>
                    </Stack>
                    <Typography variant="h6">Services statistics</Typography>
                    <Stack direction="row" spacing={3}>
                        <Card variant="outlined"
                              sx={{ py: 1, px: 2, minWidth: 200 }}>
                            <Typography>
                                Total WebRTC connections established
                            </Typography>
                            <Typography variant="h3">
                                790
                            </Typography>
                            <Typography fontSize={12} color="text.secondary">
                                last 24 hours
                            </Typography>
                        </Card>
                    </Stack>
                    <Stack direction="row" spacing={3}>
                        <Card variant="outlined"
                              sx={{ py: 1, px: 2, minWidth: 200 }}>
                            <Typography>
                                Total content blocks
                            </Typography>
                            <Typography variant="h3">
                                5.7K
                            </Typography>
                        </Card>
                        <Card variant="outlined"
                              sx={{ py: 1, px: 2, minWidth: 200 }}>
                            <Typography>
                                New content blocks
                            </Typography>
                            <Typography variant="h3">
                                325
                            </Typography>
                            <Typography fontSize={12} color="text.secondary">
                                last 24 hours
                            </Typography>
                        </Card>
                    </Stack>
                </Stack>
            </Container>
        </PageWidget>
    );
}));

