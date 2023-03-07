import { ArrowForward, ImageOutlined } from "@mui/icons-material";
import {
    Avatar,
    Badge,
    Button,
    Card,
    CardContent,
    MenuItem,
    MenuList,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export const MyChatsWidget: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    return (
        <Card variant="outlined" sx={{ width: "100%" }}>
            <CardContent>
                <Stack direction="row">
                    <Typography variant="h6" component="div">
                        Latest messages
                    </Typography>
                    <Button size="small" endIcon={<ArrowForward />}
                            style={{ marginLeft: "auto" }}
                            onClick={() => navigate("/messages")}>View more</Button>
                </Stack>
            </CardContent>
            <MenuList sx={{ pt: 0 }}>
                { /* <MenuItem onClick={() => navigate("/messages/0")}>
                    <Stack spacing={2} direction="row" alignItems="center" width="100%">
                        <Badge overlap="circular"
                               anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                               variant="dot"
                               color="success"
                               sx={{ ".MuiBadge-badge": { width: "12px", height: "12px", borderRadius: "6px", border: "2px solid white" } }}>
                            <Avatar sx={{ background: theme.palette.success.light, width: 40, height: 40 }} />
                        </Badge>
                        <Stack width={0} flexGrow={1}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Typography variant="subtitle2">
                                    Anna Cutemon
                                </Typography>
                                <Badge color="error" badgeContent={3} />
                                <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                    32 minutes ago
                                </Typography>
                            </Stack>
                            <Typography noWrap variant="subtitle2" fontWeight="500">
                                When would you like to make an appointment? At 13:30 or 15:30?
                            </Typography>
                        </Stack>
                    </Stack>
                </MenuItem> */ }
                <MenuItem onClick={() => navigate("/messages/1")}>
                    <Stack spacing={2} direction="row" alignItems="center" width="100%">
                        <Badge overlap="circular"
                               anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                               variant="dot"
                               sx={{ ".MuiBadge-badge": { width: "12px", height: "12px", borderRadius: "6px", border: "2px solid white", background: theme.palette.grey[500] } }}>
                            <Avatar sx={{ width: 40, height: 40, backgroundColor: theme.palette.warning.light }} />
                        </Badge>
                        <Stack width={0} flexGrow={1}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Typography variant="subtitle2">
                                    Tom Hanks
                                </Typography>
                                <Badge color="error" badgeContent={1} />
                                <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                    1 hour ago
                                </Typography>
                            </Stack>
                            <Typography noWrap variant="subtitle2" fontWeight="500">
                                <Stack spacing={0.5} direction="row">
                                    <ImageOutlined fontSize="small" />
                                    <span>Image</span>
                                    <span style={{ fontWeight: 400, color: theme.palette.text.secondary }}>&mdash;</span>
                                    <span>I have uploaded your x-ray re…</span>
                                </Stack>
                            </Typography>
                        </Stack>
                    </Stack>
                </MenuItem>
                <MenuItem onClick={() => navigate("/messages/2")}>
                    <Stack spacing={2} direction="row" alignItems="center" width="100%">
                        <Badge overlap="circular"
                               anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                               variant="dot"
                               sx={{ ".MuiBadge-badge": { width: "12px", height: "12px", borderRadius: "6px", border: "2px solid white", background: theme.palette.grey[500] } }}>
                            <Avatar sx={{ width: 40, height: 40, backgroundColor: theme.palette.secondary.light }} />
                        </Badge>
                        <Stack width={0} flexGrow={1}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="subtitle2">
                                    Alexander Mironov
                                </Typography>
                                <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                    1 day ago
                                </Typography>
                            </Stack>
                            <Typography noWrap variant="subtitle2" sx={{ fontWeight: 400 }}>Please do not forget to install the HDApp mobile app.</Typography>
                        </Stack>
                    </Stack>
                </MenuItem>
                <MenuItem onClick={() => navigate("/messages/3")}>
                    <Stack spacing={2} direction="row" alignItems="center" width="100%">
                        <Badge overlap="circular"
                               anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                               variant="dot"
                               sx={{ ".MuiBadge-badge": { width: "12px", height: "12px", borderRadius: "6px", border: "2px solid white", background: theme.palette.grey[500] } }}>
                            <Avatar sx={{ width: 40, height: 40, backgroundColor: theme.palette.primary.light }} />
                        </Badge>
                        <Stack width={0} flexGrow={1}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="subtitle2">
                                    Tatiana Smirnova
                                </Typography>
                                <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400, marginLeft: "auto" }}>
                                    4 days ago
                                </Typography>
                            </Stack>
                            <Typography noWrap variant="subtitle2" sx={{ fontWeight: 400 }}>Video</Typography>
                        </Stack>
                    </Stack>
                </MenuItem>
            </MenuList>
        </Card>
    );
};
