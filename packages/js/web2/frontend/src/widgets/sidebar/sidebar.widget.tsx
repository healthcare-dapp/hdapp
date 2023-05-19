import { AdminPanelSettingsOutlined, BadgeOutlined, Dashboard, People, ReportOutlined } from "@mui/icons-material";
import { Avatar, Card, Link, List, ListItemButton, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { alpha } from "@mui/system";
import { observer } from "mobx-react-lite";
import { useLocation, useNavigate } from "react-router";
import RasterLogo512Outlined from "../../assets/raster/logo512_outlined.png";
import { router } from "../../router";

const LogoImg = styled("img")({
    objectFit: "contain",
    height: 48,
    width: 48
});

export const Logo: React.FC<{ admin?: boolean }> = x => (
    <Stack direction="row" alignItems="center" spacing={1}
           sx={{ cursor: "pointer" }}
           onClick={e => {
               e.preventDefault();
               void router.navigate(x.admin ? "/admin" : "/");
           }}>
        <LogoImg src={RasterLogo512Outlined} />
        <Stack spacing={x.admin ? -1 : 0}>
            <Typography color="primary.main" variant="h6">
                Healthcare DApp
            </Typography>
            { x.admin && (
                <Typography color="info.main" variant="h6" fontSize={14}>
                    Admin Panel
                </Typography>
            ) }
        </Stack>
    </Stack>
);

const FancyList = styled(List)(({ theme }) => ({
    padding: 8,
    gap: 8,
    display: "flex",
    flexDirection: "column",
    "& .MuiListItemButton-root": {
        cursor: "pointer",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 12px",
        "&:hover": {
            backgroundColor: theme.palette.grey[200]
        },
        "&.Mui-selected": {
            backgroundColor: alpha(theme.palette.primary.main, 0.15),
            "& .MuiTypography-root": {
                color: theme.palette.primary.main,
                fontWeight: 500
            }
        }
    },
    "& .MuiSvgIcon-root": {
        color: theme.palette.primary.main,
        fontSize: 24
    }
}));

export const SidebarWidget = observer(() => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <Stack spacing={2} sx={{ minWidth: 250 }}>
            <Card variant="outlined" sx={{ py: 1, px: 2 }}>
                <Logo admin />
            </Card>
            <Card variant="outlined" sx={{ py: 1, px: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar />
                    <Stack spacing={0}>
                        <Typography>Alexander Mironov</Typography>
                        <Typography fontSize={13} fontWeight={500}>
                            <Link href="#" color="info.main" sx={{ textDecoration: "none" }}>
                                Sign out
                            </Link>
                        </Typography>
                    </Stack>
                </Stack>
            </Card>
            <Card variant="outlined">
                <FancyList>
                    <ListItemButton onClick={() => navigate("/admin")}
                                    selected={location.pathname === "/admin"}>
                        <Dashboard />
                        <Typography>Dashboard</Typography>
                    </ListItemButton>
                    <ListItemButton onClick={() => navigate("/admin/users")}
                                    selected={location.pathname === "/admin/users"}>
                        <People />
                        <Typography>Users</Typography>
                    </ListItemButton>
                    <ListItemButton onClick={() => navigate("/admin/requests")}
                                    selected={location.pathname === "/admin/requests"}>
                        <BadgeOutlined />
                        <Typography>Registration requests</Typography>
                    </ListItemButton>
                    <ListItemButton onClick={() => navigate("/admin/reports")}
                                    selected={location.pathname === "/admin/reports"}>
                        <ReportOutlined />
                        <Typography>Reports</Typography>
                    </ListItemButton>
                    <ListItemButton onClick={() => navigate("/admin/administration")}
                                    selected={location.pathname === "/admin/administration"}>
                        <AdminPanelSettingsOutlined />
                        <Typography>Administration</Typography>
                    </ListItemButton>
                </FancyList>
            </Card>
        </Stack>
    );
});
