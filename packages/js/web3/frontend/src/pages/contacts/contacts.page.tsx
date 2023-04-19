import { formatTemporal } from "@hdapp/shared/web2-common/utils/temporal";
import { LocalDateTime } from "@js-joda/core";
import { CorporateFareOutlined, List, LocalHospital, Menu as MenuIcon, MessageOutlined, Search } from "@mui/icons-material";
import {
    Box,
    Container,
    useMediaQuery,
    AppBar,
    IconButton,
    Typography,
    useTheme,
    Toolbar,
    Stack,
    TextField,
    ListItemButton,
    Badge,
    Avatar,
    Card,
    CardActionArea,
    Button,
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { sessionManager } from "../../managers/session.manager";
import { deviceService } from "../../services/device.service";
import { fileService } from "../../services/file.service";
import { ProfileEntry, profileService } from "../../services/profile.service";
import { superIncludes } from "../../utils/super-includes";
import { trimWeb3Address } from "../../utils/trim-web3-address";
import { useDatabase } from "../../utils/use-database";
import { BottomBarWidget } from "../../widgets/bottom-bar";
import { DrawerWidget } from "../../widgets/drawer";
import { FancyList } from "../../widgets/fancy-list/fancy-list.widget";
import { HeaderWidget } from "../../widgets/header";
import { ShareQrWidget } from "../../widgets/share-qr/share-qr.widget";

export const ContactsPage = observer(() => {
    const [openCounter, setOpenCounter] = useState(0);
    const theme = useTheme();
    const canShowSidebar = useMediaQuery(theme.breakpoints.up("md"));
    const [query, setQuery] = useState("");
    const [tab, setTab] = useState("");
    const [profiles, setProfiles] = useState<(ProfileEntry & { last_active_at?: LocalDateTime; avatar_url?: string })[]>([]);
    const [activeProfile, setActiveProfile] = useState<string>();

    useDatabase(async () => {
        const entries = await profileService.searchProfiles({ filters: { query } }, sessionManager.encryption);
        setProfiles(
            await Promise.all(
                entries.map(async entry => {
                    return {
                        ...entry,
                        last_active_at: (await deviceService.getDevicesOwnedBy(entry.address, sessionManager.encryption))
                            .sort((a, b) => a.last_active_at.compareTo(b.last_active_at))
                            .shift()?.last_active_at,
                        avatar_url: entry.avatar_hash
                            ? await fileService.getFileBlob(entry.avatar_hash, sessionManager.encryption)
                                .then(blob => URL.createObjectURL(blob))
                                .catch(() => void 0)
                            : void 0
                    };
                })
            )
        );
    }, ["devices", "files", "profiles"], [query]);

    const groupedProfiles = profiles
        .filter(profile => {
            const fields = profile.medical_organization_name
                ? [profile.full_name, profile.medical_organization_name, profile.address]
                : [profile.full_name, profile.address];
            if (query && !superIncludes(query, fields))
                return false;
            if (tab === "doctors" && !profile.medical_organization_name)
                return false;
            if (tab && profile.medical_organization_name !== tab)
                return false;
            return true;
        })
        .sort((a, b) => a.full_name.localeCompare(b.full_name))
        .flatMap((p, i, arr) => {
            if (i === 0 || arr[i - 1].full_name[0].toLowerCase() !== p.full_name[0].toLowerCase())
                return [p.full_name[0].toUpperCase(), p];

            return p;
        });

    return (
        <>
            <DrawerWidget openCounter={openCounter} />
            <HeaderWidget />
            { !canShowSidebar && (
                <>
                    <AppBar elevation={2} color="default" position="fixed">
                        <Toolbar style={{ paddingRight: "8px" }}>
                            <IconButton size="large"
                                        edge="start"
                                        color="inherit"
                                        aria-label="menu"
                                        sx={{ mr: 2 }}
                                        onClick={() => setOpenCounter(openCounter + 1)}>
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                Contacts
                            </Typography>
                            <div>
                                <IconButton size="large"
                                            color="inherit">
                                    <Search />
                                </IconButton>
                            </div>
                        </Toolbar>
                    </AppBar>
                    <Box mt={7} />
                </>
            ) }
            <Container sx={{ pt: 3, flex: 1, display: "flex", flexDirection: "column" }}>
                <Typography variant="h4" mb={3} fontSize={32}>My contacts</Typography>

                <Grid2 container columnSpacing={2} sx={{ flex: 1 }}>
                    <Grid2 xs={12} sm={4} lg={3} xl={3}>
                        <Stack spacing={2}>
                            <TextField margin="dense"
                                       placeholder="Search..."
                                       fullWidth
                                       size="small"
                                       value={query}
                                       onChange={e => setQuery(e.target.value)}
                                       style={{ margin: 0, marginTop: 4 }}
                                       InputProps={{ startAdornment: <Search fontSize="small" sx={{ color: "text.secondary", marginRight: "10px" }} /> }}
                                       variant="outlined" />
                            <FancyList>
                                <ListItemButton onClick={() => setTab("")}
                                                selected={tab === ""}>
                                    <List />
                                    <Typography>All</Typography>
                                </ListItemButton>
                                <ListItemButton onClick={() => setTab("devices")}
                                                selected={tab === "devices"}>
                                    <LocalHospital />
                                    <Typography>Doctors</Typography>
                                </ListItemButton>
                                <Typography variant="subtitle1" color="text.secondary" mt={2} fontSize={12}>Medical organization</Typography>
                                <ListItemButton onClick={() => setTab("Dobromed")}
                                                selected={tab === "Dobromed"}>
                                    <CorporateFareOutlined />
                                    <Typography>Dobromed</Typography>
                                    <Box flex={1} />
                                    <Badge badgeContent={1} color="primary" sx={{ mr: 1 }} />
                                </ListItemButton>
                            </FancyList>
                        </Stack>
                    </Grid2>
                    <Grid2 xs={12} sm={8} lg={9} xl={9}
                           sx={{ display: "flex", flexDirection: "column", pb: 1, minHeight: 400 }}>
                        <Stack>
                            { groupedProfiles.length
                                ? groupedProfiles.map(profile => typeof profile === "string"
                                    ? <Typography key={profile} fontWeight={600} color="text.secondary" px={2} fontSize={12}>{ profile }</Typography>
                                    : activeProfile === profile.address ? (
                                        <Card key={profile.address + "-expanded"} variant="outlined">
                                            <CardActionArea onClick={() => setActiveProfile(undefined)} sx={{ p: 2 }}>
                                                <Stack direction="row" alignItems="center" spacing={2}>
                                                    <Avatar sx={{ width: "96px", height: "96px" }} src={profile.avatar_url} />
                                                    <Stack textAlign="left" spacing={0.5}>
                                                        <Stack spacing={-0.5}>
                                                            <Typography variant="h6">
                                                                { profile.full_name }
                                                            </Typography>
                                                            <Typography fontSize={12} color={theme.palette.grey[600]}
                                                                        sx={{ fontWeight: 400 }}>
                                                                { profile.address }
                                                            </Typography>
                                                        </Stack>
                                                        <Box sx={{ display: "flex", flexWrap: "wrap", rowGap: "8px", columnGap: "16px", gridAutoFlow: "column" }}>
                                                            <Typography fontSize={14}>
                                                                <b>Gender:</b>
                                                    &nbsp;
                                                                { profile.gender }
                                                            </Typography>
                                                            <Typography fontSize={14}>
                                                                <b>Date of birth:</b>
                                                    &nbsp;
                                                                { formatTemporal(profile.birth_date) }
                                                            </Typography>
                                                        </Box>
                                                        <Typography fontSize={14}>
                                                            <b>Medical organization:</b>
                                                    &nbsp;
                                                            { profile.medical_organization_name }
                                                        </Typography>
                                                    </Stack>
                                                    <Box flex={1} />
                                                    <Stack alignSelf="stretch">
                                                        <Button variant="outlined" color="info" startIcon={<MessageOutlined />}>
                                                            Send a message
                                                        </Button>
                                                    </Stack>
                                                </Stack>
                                            </CardActionArea>
                                        </Card>
                                    ) : (
                                        <ListItemButton key={profile.address} onClick={() => setActiveProfile(profile.address)}>
                                            <Stack spacing={1} direction="row" alignItems="center" width="100%">
                                                <Avatar sx={{ width: 40, height: 40 }}
                                                        src={profile.avatar_url} />
                                                <Stack direction="column" alignItems="flex-start" width={0} flexGrow={1}>
                                                    <Typography variant="subtitle2">
                                                        { profile.full_name }
                                                    </Typography>
                                                    <Typography variant="subtitle2" color={theme.palette.grey[600]} fontSize={12} style={{ fontWeight: 400 }}>
                                                        { trimWeb3Address(profile.address) }
                                                    </Typography>
                                                </Stack>
                                                <Box flex={1} />
                                                <Typography fontSize={14}>
                                                    { !profile.last_active_at?.isEqual(LocalDateTime.MIN) ? formatTemporal(profile.last_active_at) : "offline" }
                                                </Typography>
                                            </Stack>
                                        </ListItemButton>
                                    ))
                                : (
                                    <Typography color="text.secondary">
                                        No contacts found.
                                    </Typography>
                                ) }
                        </Stack>
                    </Grid2>
                </Grid2>
            </Container>
            <BottomBarWidget />
            <ShareQrWidget />
        </>
    );
});
