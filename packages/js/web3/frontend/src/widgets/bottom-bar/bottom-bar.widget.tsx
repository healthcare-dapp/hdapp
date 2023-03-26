import { ViewDayOutlined, CalendarMonthOutlined, ForumOutlined, NotificationsOutlined, Notes } from "@mui/icons-material";
import { BottomNavigationAction, Box, Badge, BottomNavigation, styled, useMediaQuery, useTheme } from "@mui/material";
import { alpha } from "@mui/system";
import { observer } from "mobx-react-lite";
import { FC } from "react";
import { useMatches, useNavigate } from "react-router-dom";
import { sessionManager } from "../../managers/session.manager";

const BottomBar = styled(BottomNavigation)(({ theme, showLabels }) => ({
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    height: 56,
    zIndex: 100,
    boxShadow: theme.shadows[3],
    "& > .Mui-selected": {
        backgroundColor: alpha(theme.palette.primary.main, 0.04),
        boxShadow: "inset 0 -2px 0 " + theme.palette.primary.main,
    },
    ".MuiBottomNavigationAction-root": {
        minWidth: 56
    }
}));

export const BottomBarWidget: FC = observer(() => {
    const matches = useMatches();
    const navigate = useNavigate();
    const theme = useTheme();
    const canShowBottomBar = useMediaQuery(theme.breakpoints.down("md"));
    const canShowBottomBarText = useMediaQuery(theme.breakpoints.up("sm"));
    const notifications = sessionManager.notifications.array;

    const [match] = matches;

    if (!canShowBottomBar)
        return null;

    return (
        <>
            <Box sx={{ height: "56px" }} />
            <BottomBar showLabels={canShowBottomBarText} value={match?.pathname} onChange={(_, t) => navigate(t)}>
                <BottomNavigationAction value="/"
                                        label={canShowBottomBarText ? "My data" : void 0}
                                        icon={<ViewDayOutlined />} />
                <BottomNavigationAction value="/appointments"
                                        label={canShowBottomBarText ? "Appointments" : void 0}
                                        icon={<Badge color="error"><CalendarMonthOutlined /></Badge>} />
                <BottomNavigationAction value="/messages"
                                        label={canShowBottomBarText ? "Messages" : void 0}
                                        icon={<Badge color="error"><ForumOutlined /></Badge>} />
                { /* <BottomNavigationAction value="/maps"
                                        label={canShowBottomBarText ? "Maps" : void 0}
                                        icon={<MapOutlined />} /> */ }
                <BottomNavigationAction value="/logs"
                                        label={canShowBottomBarText ? "logs" : void 0}
                                        icon={<Notes />} />
                <BottomNavigationAction value="/notifications"
                                        label={canShowBottomBarText ? "Notifications" : void 0}
                                        icon={<Badge color="error" badgeContent={notifications.length}><NotificationsOutlined /></Badge>} />
            </BottomBar>
        </>
    );
});
