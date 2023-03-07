import { ArrowForward } from "@mui/icons-material";
import {
    Avatar,
    Button,
    Card,
    CardContent,
    MenuItem,
    MenuList,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";

export const LogsWidget: React.FC = () => {
    const theme = useTheme();

    return (
        <Card variant="outlined" sx={{ width: "100%" }}>
            <CardContent>
                <Stack direction="row">
                    <Typography variant="h6" component="div">
                        Latest logs
                    </Typography>
                    <Button size="small" endIcon={<ArrowForward />}
                            style={{ marginLeft: "auto" }}>View more</Button>
                </Stack>
            </CardContent>
            <MenuList sx={{ pt: 0 }}>
                { /* <MenuItem>
                    <Stack spacing={1} width="100%">
                        <Stack spacing={2} direction="row" alignItems="center" width="100%">
                            <Avatar sx={{ width: 40, height: 40, backgroundColor: theme.palette.success.light }} />
                            <Stack width={0} flexGrow={1}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography variant="subtitle2">
                                        Anna Cutemon
                                    </Typography>
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                        (0x23...54af)
                                    </Typography>
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                        3 hours ago
                                    </Typography>
                                </Stack>
                                <Typography noWrap variant="subtitle2" sx={{ fontWeight: 400 }}>Physchiatrist at the State Hospital of St. Petersburg</Typography>
                            </Stack>
                        </Stack>
                        <Typography whiteSpace="normal" variant="subtitle2" fontSize={12} pl={7} sx={{ fontWeight: 400 }}>Added a record in block "Infections"</Typography>
                        <Typography whiteSpace="normal" variant="subtitle2" fontSize={12} pl={7} sx={{ fontWeight: 400 }}>Gained access to your personal data</Typography>
                    </Stack>
                </MenuItem>
                <MenuItem>
                    <Stack spacing={1} width="100%">
                        <Stack spacing={2} direction="row" alignItems="center" width="100%">
                            <Avatar sx={{ width: 40, height: 40, backgroundColor: theme.palette.success.light }} />
                            <Stack width={0} flexGrow={1}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography variant="subtitle2">
                                        Anna Cutemon
                                    </Typography>
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                        (0x23...54af)
                                    </Typography>
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                        2 days ago
                                    </Typography>
                                </Stack>
                                <Typography noWrap variant="subtitle2" sx={{ fontWeight: 400 }}>Physchiatrist at the State Hospital of St. Petersburg</Typography>
                            </Stack>
                        </Stack>
                        <Typography whiteSpace="normal" variant="subtitle2" fontSize={12} pl={7} sx={{ fontWeight: 400 }}>Gained access to your records in block "Infections"</Typography>
                        <Typography whiteSpace="normal" variant="subtitle2" fontSize={12} pl={7} sx={{ fontWeight: 400 }}>Gained access to your personal data</Typography>
                        <Typography whiteSpace="normal" variant="subtitle2" fontSize={12} pl={7} sx={{ fontWeight: 400 }}>Accepted your connection request</Typography>
                    </Stack>
                </MenuItem> */ }
                <MenuItem>
                    <Stack spacing={1} width="100%">
                        <Stack spacing={2} direction="row" alignItems="center" width="100%">
                            <Avatar sx={{ width: 40, height: 40, backgroundColor: theme.palette.secondary.light }} />
                            <Stack width={0} flexGrow={1}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography variant="subtitle2">
                                        Alexander Mironov
                                    </Typography>
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                        (0xcc...a112)
                                    </Typography>
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                        4 days ago
                                    </Typography>
                                </Stack>
                                <Typography noWrap variant="subtitle2" sx={{ fontWeight: 400 }}>Physchiatrist at the State Hospital of St. Petersburg</Typography>
                            </Stack>
                        </Stack>
                        <Typography whiteSpace="normal" variant="subtitle2" fontSize={12} pl={7} sx={{ fontWeight: 400 }}>Gained access to your records in block "Infections"</Typography>
                    </Stack>
                </MenuItem>
                <MenuItem>
                    <Stack spacing={1} width="100%">
                        <Stack spacing={2} direction="row" alignItems="center" width="100%">
                            <Avatar sx={{ width: 40, height: 40, backgroundColor: theme.palette.warning.light }} />
                            <Stack width={0} flexGrow={1}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography variant="subtitle2">
                                        Tom Hanks
                                    </Typography>
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                        (0xd3...51be)
                                    </Typography>
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                        5 days ago
                                    </Typography>
                                </Stack>
                                <Typography noWrap variant="subtitle2" sx={{ fontWeight: 400 }}>Workout expert at WorldClass Moscow</Typography>
                            </Stack>
                        </Stack>
                        <Typography whiteSpace="normal" variant="subtitle2" fontSize={12} pl={7} sx={{ fontWeight: 400 }}>Gained access to your records in block "Fitness"</Typography>
                    </Stack>
                </MenuItem>
                <MenuItem>
                    <Stack spacing={1} width="100%">
                        <Stack spacing={2} direction="row" alignItems="center" width="100%">
                            <Avatar sx={{ width: 40, height: 40, backgroundColor: theme.palette.warning.light }} />
                            <Stack width={0} flexGrow={1}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography variant="subtitle2">
                                        Tom Hanks
                                    </Typography>
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} sx={{ fontWeight: 400 }}>
                                        (0xd3...51be)
                                    </Typography>
                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                        8 days ago
                                    </Typography>
                                </Stack>
                                <Typography noWrap variant="subtitle2" sx={{ fontWeight: 400 }}>Workout expert at WorldClass Moscow</Typography>
                            </Stack>
                        </Stack>
                        <Typography whiteSpace="normal" variant="subtitle2" fontSize={12} pl={7} sx={{ fontWeight: 400 }}>Accepted your connection request</Typography>
                    </Stack>
                </MenuItem>
            </MenuList>
        </Card>
    );
};
