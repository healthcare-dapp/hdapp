import { CalendarMonthOutlined, ForumOutlined, MapOutlined, Notes, ViewDayOutlined } from "@mui/icons-material";
import {
    alpha,
    Badge,
    Box,
    Container,
    Paper,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { NavLink, redirect, useMatches } from "react-router-dom";
import RasterLogo512Outlined from "../../assets/raster/logo512_outlined.png";
import { HeaderAccountWidget } from "./account.widget";
import { HeaderNotificationsWidget } from "./notifications.widget";

const LogoImg = styled("img")({
    objectFit: "contain",
    height: 48,
    width: 48
});

const LogoText = styled(Typography)(({ theme }) => ({
    color: theme.palette.primary.main,
    [theme.breakpoints.down("md")]: {
        display: "none"
    },
}));

export const Logo = () => (
    <Stack direction="row" alignItems="center" spacing={1}
           style={{ cursor: "pointer" }}
           onClick={e => {
               e.preventDefault();
               void redirect("/");
           }}>
        <LogoImg src={RasterLogo512Outlined} />
        <LogoText variant="h6">
            Healthcare DApp
        </LogoText>
    </Stack>
);

const Header = styled(Box)`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
`;

const NavLinkStyled = styled(NavLink)(({ theme }) => ({
    color: theme.palette.text.secondary,
    borderRadius: "4px",
    textDecoration: "none",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily,
    "&:hover": {
        color: theme.palette.text.primary,
    },
    "&.active": {
        fontWeight: 600,
        color: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.16)
    },
    "&:not(.active) > div > span:not(.MuiBadge-root)": {
        [theme.breakpoints.down("lg")]: {
            display: "none"
        }
    }
}));

export const HeaderWidget = observer(() => {
    const matches = useMatches();
    const [connectionQuality, setConnectionQuality] = useState<"bad" | "okay" | "good">("good");
    const theme = useTheme();
    const canShowHeader = useMediaQuery(theme.breakpoints.up("md"));
    const isBigEnough = useMediaQuery(theme.breakpoints.up("md"));
    const isVeryBigEnough = useMediaQuery(theme.breakpoints.up("lg"));

    const [match] = matches;

    if (!canShowHeader)
        return null;

    return (
        <>
            <Header>
                <Container>
                    <Paper elevation={1}
                           sx={{
                               py: 1,
                               px: 2,
                               mx: isVeryBigEnough ? -2 : -3,
                               borderTopLeftRadius: 0,
                               borderTopRightRadius: 0,
                               borderBottomLeftRadius: !isVeryBigEnough ? 0 : void 0,
                               borderBottomRightRadius: !isVeryBigEnough ? 0 : void 0,
                           }}>
                        <Stack direction="row" alignItems="center"
                               spacing={2}>
                            <Logo />
                            <Box sx={{ flex: 1 }} />
                            { isBigEnough && (
                                <Stack direction="row" alignItems="center">
                                    <NavLinkStyled className={cn => cn.isActive ? "active" : void 0}
                                                   to="/">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <ViewDayOutlined fontSize="medium" />
                                            <span>My data</span>
                                        </Stack>
                                    </NavLinkStyled>
                                    <NavLinkStyled className={cn => cn.isActive ? "active" : void 0}
                                                   to="/appointments">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Badge color="error" badgeContent={1}><CalendarMonthOutlined fontSize="medium" /></Badge>
                                            <span>Appointments</span>
                                        </Stack>
                                    </NavLinkStyled>
                                    <NavLinkStyled className={cn => cn.isActive ? "active" : void 0}
                                                   to="/messages">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Badge color="error" badgeContent={/* 3 */1}><ForumOutlined fontSize="medium" /></Badge>
                                            <span>Messages</span>
                                        </Stack>
                                    </NavLinkStyled>
                                    <NavLinkStyled className={cn => cn.isActive ? "active" : void 0}
                                                   to="/maps">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <MapOutlined fontSize="medium" />
                                            <span>Maps</span>
                                        </Stack>
                                    </NavLinkStyled>
                                    <NavLinkStyled className={cn => cn.isActive ? "active" : void 0}
                                                   to="/logs">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Notes fontSize="medium" />
                                            <span>Logs</span>
                                        </Stack>
                                    </NavLinkStyled>
                                </Stack>
                            ) }
                            <Box sx={{ flex: 1 }} />
                            { /* isBigEnough && (
                        <Chip icon={connectionQuality === "good" ? <Wifi /> : connectionQuality === "okay" ? <Wifi2Bar /> : <WifiOff />}
                              label={connectionQuality !== "bad" ? "Connection stable" : "Connection was lost"}
                              sx={{ fontWeight: 500 }}
                              color={connectionQuality === "good" ? "success" : connectionQuality === "okay" ? "warning" : "error"}
                              variant={connectionQuality !== "bad" ? "outlined" : "filled"}
                              onClick={() => {
                                  switch (connectionQuality) {
                                      case "bad":
                                          setConnectionQuality("okay");
                                          break;
                                      case "okay":
                                          setConnectionQuality("good");
                                          break;
                                      case "good":
                                          setConnectionQuality("bad");
                                          break;
                                  }
                              }} />
                    ) */ }
                            <HeaderNotificationsWidget />
                            <HeaderAccountWidget />
                        </Stack>
                    </Paper>
                </Container>
            </Header>
            <Box height="64px" />
        </>
    );
});
