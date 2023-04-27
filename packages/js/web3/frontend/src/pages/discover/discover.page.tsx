import { UsersService } from "@hdapp/shared/web2-common/api/services";
import { PublicUserDto, PublicUserSearchFiltersDto } from "@hdapp/shared/web2-common/dto";
import { AsyncAction } from "@hdapp/shared/web2-common/utils/async-action";
import { KeyboardArrowUpOutlined, Menu as MenuIcon, Search } from "@mui/icons-material";
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
    CardActionArea,
    Card,
    Backdrop,
    CircularProgress,
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { BottomBarWidget } from "../../widgets/bottom-bar/index";
import { DrawerWidget } from "../../widgets/drawer/index";
import { FancyList } from "../../widgets/fancy-list/fancy-list.widget";
import { HeaderWidget } from "../../widgets/header/index";
import { ShareQrWidget } from "../../widgets/share-qr/share-qr.widget";

const getFiltersAction = new AsyncAction(UsersService.getPublicProfileFilters);
const findProfilesPagedAction = new AsyncAction(UsersService.findPublicProfilesPaged);

export const DiscoverPage = observer(() => {
    const [openCounter, setOpenCounter] = useState(0);
    const theme = useTheme();
    const canShowSidebar = useMediaQuery(theme.breakpoints.up("md"));
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<PublicUserDto[]>([]);
    const [filters, setFilters] = useState<PublicUserSearchFiltersDto>();
    const [areasOfFocusFilter, setAreasOfFocusFilter] = useState<string>();
    const [locationFilter, setLocationFilter] = useState<string>();
    const [organizationFilter, setOrganizationFilter] = useState<string>();
    const [activeId, setActiveId] = useState<string>();

    useEffect(() => {
        (async () => {
            setFilters(await getFiltersAction.run());
        })();
    }, []);

    useEffect(() => {
        (async () => {
            setUsers((await findProfilesPagedAction.forceRun({
                query,
                areas_of_focus: areasOfFocusFilter,
                location: locationFilter,
                organization_id: organizationFilter,
            })).items);
        })();
    }, [areasOfFocusFilter, query, locationFilter, organizationFilter]);

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
                                Find new doctors
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
                <Typography variant="h4" mb={3} fontSize={32}>Find new doctors</Typography>
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
                                <Typography variant="subtitle1" color="text.secondary" mt={2} fontSize={12}>Area of focus</Typography>
                                <ListItemButton onClick={() => setAreasOfFocusFilter(undefined)}
                                                selected={!areasOfFocusFilter}>
                                    <Typography>All</Typography>
                                </ListItemButton>
                                { filters?.areas_of_focus.map(item => (
                                    <ListItemButton onClick={() => setAreasOfFocusFilter(item.value)}
                                                    selected={areasOfFocusFilter === item.value}
                                                    key={item.value}>
                                        <Typography>{ item.value }</Typography>
                                        <Box flex={1} />
                                        <Badge badgeContent={item.count} color="primary" sx={{ mr: 1 }} />
                                    </ListItemButton>
                                )) }
                                <Typography variant="subtitle1" color="text.secondary" mt={2} fontSize={12}>Location</Typography>
                                <ListItemButton onClick={() => setLocationFilter(undefined)}
                                                selected={!locationFilter}>
                                    <Typography>All</Typography>
                                </ListItemButton>
                                { filters?.locations.map(item => (
                                    <ListItemButton onClick={() => setLocationFilter(item.value)}
                                                    selected={locationFilter === item.value}
                                                    key={item.value}>
                                        <Typography>{ item.value }</Typography>
                                        <Box flex={1} />
                                        <Badge badgeContent={item.count} color="primary" sx={{ mr: 1 }} />
                                    </ListItemButton>
                                )) }
                                <Typography variant="subtitle1" color="text.secondary" mt={2} fontSize={12}>Medical organization</Typography>
                                <ListItemButton onClick={() => setOrganizationFilter(undefined)}
                                                selected={!organizationFilter}>
                                    <Typography>All</Typography>
                                </ListItemButton>
                                { filters?.organizations.map(item => (
                                    <ListItemButton onClick={() => setOrganizationFilter(item.id)}
                                                    selected={organizationFilter === item.id}
                                                    key={item.id}>
                                        <Typography>{ item.name }</Typography>
                                        <Box flex={1} />
                                        <Badge badgeContent={item.count} color="primary" sx={{ mr: 1 }} />
                                    </ListItemButton>
                                )) }
                            </FancyList>
                        </Stack>
                    </Grid2>
                    <Grid2 xs={12} sm={8} lg={9} xl={9}
                           sx={{ display: "flex", flexDirection: "column", pb: 1, minHeight: 400 }}>
                        <Stack>
                            { users.length
                                ? users.map(profile => (
                                    <Card key={profile.web3_address} style={activeId !== profile.web3_address ? { border: "none" } : undefined}
                                          variant="outlined">
                                        <CardActionArea disableRipple={activeId === profile.web3_address}
                                                        disabled={activeId === profile.web3_address}
                                                        onClick={() => setActiveId(activeId === profile.web3_address ? undefined : profile.web3_address!)}
                                                        sx={{ p: 2 }}
                                                        style={{ pointerEvents: "auto", userSelect: "text" }}>
                                            <Stack direction="row" alignItems="flex-start" spacing={2}>
                                                <Avatar sx={{ width: "96px", height: "96px" }} src={profile.public_profile?.avatar} />
                                                <Stack textAlign="left" spacing={0.5}>
                                                    <Stack spacing={-0.5}>
                                                        <Typography variant="h6">
                                                            { profile.public_profile?.full_name }
                                                        </Typography>
                                                        <Typography fontSize={12} color={theme.palette.grey[600]}
                                                                    sx={{ fontWeight: 400 }}>
                                                            { profile.web3_address }
                                                        </Typography>
                                                    </Stack>
                                                    { profile.public_profile?.areasOfFocus && (
                                                        <Typography fontSize={14}>
                                                            <b>Areas of focus:</b>
                                                    &nbsp;
                                                            { profile.public_profile?.areasOfFocus }
                                                        </Typography>
                                                    ) }
                                                    { profile.public_profile?.location && (
                                                        <Typography fontSize={14}>
                                                            <b>Location:</b>
                                                    &nbsp;
                                                            { profile.public_profile?.location }
                                                        </Typography>
                                                    ) }
                                                    { activeId === profile.web3_address && (
                                                        <>
                                                            { profile.public_profile?.specialty && (
                                                                <Typography fontSize={14}>
                                                                    <b>Specialty:</b>
                                                    &nbsp;
                                                                    { profile.public_profile?.specialty }
                                                                </Typography>
                                                            ) }
                                                            { profile.public_profile?.languages?.length && (
                                                                <Typography fontSize={14}>
                                                                    <b>Languages:</b>
                                                    &nbsp;
                                                                    { profile.public_profile?.languages.join(", ") }
                                                                </Typography>
                                                            ) }
                                                            { profile.public_profile?.socials?.length && (
                                                                <Typography fontSize={14}>
                                                                    <b>Contacts:</b>
                                                                    <br />
                                                                    { profile.public_profile?.socials.map(social => (
                                                                        <>
                                                                            <b>{ social.name }:</b> { social.value }<br />
                                                                        </>
                                                                    )) }
                                                                </Typography>
                                                            ) }
                                                        </>
                                                    ) }

                                                </Stack>
                                                <Box flex={1} />
                                                { activeId === profile.web3_address && (
                                                    <IconButton onClick={() => setActiveId(undefined)}>
                                                        <KeyboardArrowUpOutlined />
                                                    </IconButton>
                                                ) }
                                            </Stack>
                                        </CardActionArea>
                                    </Card>
                                )) : (
                                    <Typography color="text.secondary">
                                        No doctors found.
                                    </Typography>
                                ) }
                        </Stack>
                    </Grid2>
                </Grid2>
            </Container>
            <Backdrop sx={{ color: "#fff", zIndex: theme.zIndex.drawer + 1 }}
                      open={getFiltersAction.pending || findProfilesPagedAction.pending}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <BottomBarWidget />
            <ShareQrWidget />
        </>
    );
});
