import { PersonAdd, SmartphoneOutlined, Settings, Logout } from "@mui/icons-material";
import {
    Box,
    useTheme,
    SwipeableDrawer,
    Avatar,
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Stack,
    Typography,
} from "@mui/material";
import makeBlockie from "ethereum-blockies-base64";
import { observer } from "mobx-react-lite";
import { FC, useEffect, useState } from "react";
import { sessionManager } from "../../managers/session.manager";

export const DrawerWidget: FC<{ openCounter?: number }> = observer(x => {
    const { wallet } = sessionManager;
    const theme = useTheme();
    const [drawerOpened, setDrawerOpened] = useState(false);

    useEffect(() => {
        !!x.openCounter && setDrawerOpened(true);
    }, [x.openCounter]);

    return (
        <SwipeableDrawer anchor="left"
                         open={!!drawerOpened}
                         onClose={() => setDrawerOpened(false)}
                         onOpen={() => setDrawerOpened(true)}>
            <Stack sx={{ width: 250, height: "100%" }}
                   role="presentation"
                   onClick={() => setDrawerOpened(false)}
                   onKeyDown={() => setDrawerOpened(false)}>
                <Box sx={{ backgroundColor: theme.palette.grey[800], p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 48, height: 48 }} src={wallet ? makeBlockie(wallet.address) : void 0} />
                        <Stack>
                            <Typography color="white" fontWeight="500">Ruslan Garifullin</Typography>
                            <Typography color="white" fontSize={12}>0xa3ea...5b1a</Typography>
                        </Stack>
                    </Stack>
                </Box>
                <Box sx={{ px: 2, py: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 48, height: 48 }} src={wallet ? makeBlockie(wallet.address) : void 0} />
                        <Stack>
                            <Typography fontWeight="500">Alexander Mironov</Typography>
                            <Typography fontSize={12}>0xa3ea...5b1a</Typography>
                        </Stack>
                    </Stack>
                </Box>
                <Box sx={{ px: 2, py: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 48, height: 48 }} src={wallet ? makeBlockie(wallet.address) : void 0} />
                        <Stack>
                            <Typography fontWeight="500">Camila Garifullina</Typography>
                            <Typography fontSize={12}>0xa3ea...5b1a</Typography>
                        </Stack>
                    </Stack>
                </Box>
                <List>
                    <ListItem disablePadding>
                        <ListItemButton>
                            <PersonAdd htmlColor={theme.palette.text.secondary} sx={{ mr: 2 }} />
                            <ListItemText primary="Add more accounts" />
                        </ListItemButton>
                    </ListItem>
                </List>
                <Box flexGrow={1} />
                <Divider />
                <List>
                    <ListItem disablePadding>
                        <ListItemButton>
                            <SmartphoneOutlined htmlColor={theme.palette.text.secondary} sx={{ mr: 2 }} />
                            <ListItemText primary="Pair another device" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton>
                            <Settings htmlColor={theme.palette.text.secondary} sx={{ mr: 2 }} />
                            <ListItemText primary="Settings" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton>
                            <Logout htmlColor={theme.palette.text.secondary} sx={{ mr: 2 }} />
                            <ListItemText primary="Sign out" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Stack>
        </SwipeableDrawer>
    );
});
