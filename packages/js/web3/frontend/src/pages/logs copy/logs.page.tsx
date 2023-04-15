import { formatTemporal } from "@hdapp/shared/web2-common/utils/temporal";
import { LocalDate } from "@js-joda/core";
import { Menu as MenuIcon, Search, Tune } from "@mui/icons-material";
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { sessionManager } from "../../managers/session.manager";
import { EventLogEntry, eventLogService } from "../../services/event-log.service";
import { ProfileEntry, profileService } from "../../services/profile.service";
import { superIncludes } from "../../utils/super-includes";
import { trimWeb3Address } from "../../utils/trim-web3-address";
import { useDatabase } from "../../utils/use-database";
import { BottomBarWidget } from "../../widgets/bottom-bar/index";
import { DrawerWidget } from "../../widgets/drawer/index";
import { HeaderWidget } from "../../widgets/header/index";
import { ShareQrWidget } from "../../widgets/share-qr/share-qr.widget";

const columns: GridColDef<EventLogEntry>[] = [
    {
        field: "created_at",
        headerName: "Timestamp",
        width: 135,
        renderCell(params) {
            return formatTemporal(params.row.created_at);
        }
    },
    {
        field: "title",
        width: 200,
        headerName: "Title"
    },
    {
        field: "description",
        width: 350,
        headerName: "Description"
    },
    {
        field: "created_by",
        width: 250,
        headerName: "Creator",
        renderCell(params) {
            return trimWeb3Address(params.row.created_by);
        }
    }
];

export const LogsPage = observer(() => {
    const [openCounter, setOpenCounter] = useState(0);
    const theme = useTheme();
    const canShowSidebar = useMediaQuery(theme.breakpoints.up("md"));
    const [logs, setLogs] = useState<EventLogEntry[]>([]);
    const [query, setQuery] = useState("");
    const [createdBefore, setCreatedBefore] = useState<LocalDate>();
    const [createdAfter, setCreatedAfter] = useState<LocalDate>();
    const [createdByFilter, setCreatedByFilter] = useState<string>();
    const [profiles, setProfiles] = useState<ProfileEntry[]>([]);

    useDatabase(async () => {
        const logEntries = await eventLogService.getEventLogs();
        setLogs(logEntries);
        setProfiles(await profileService.searchProfiles({}, sessionManager.encryption));
    }, ["event-logs", "profiles"]);

    const filteredLogs = logs.filter(log => {
        if (createdByFilter && log.created_by !== createdByFilter)
            return false;
        if (query && !superIncludes(query, [log.description, log.title]))
            return false;
        return true;
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
                                Logs
                            </Typography>
                            <div>
                                <IconButton size="large"
                                            color="inherit">
                                    <Tune />
                                </IconButton>
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
                <Grid2 container columnSpacing={2} sx={{ flex: 1 }}>
                    <Grid2 xs={12} sm={7} lg={8} xl={8}
                           sx={{ display: "flex", flexDirection: "column", pb: 1, minHeight: 400 }}>
                        <Typography variant="h4" mb={3} fontSize={32}>My logs</Typography>
                        <DataGrid<EventLogEntry> columns={columns} rows={logs}
                                                 getRowId={s => s.hash} />
                    </Grid2>
                    <Grid2 xs={12} sm={5} lg={4} xl={4}>
                        <Stack spacing={2}>
                            <TextField margin="dense"
                                       placeholder="Search..."
                                       fullWidth
                                       size="small"
                                       style={{ margin: 0, marginTop: 4 }}
                                       InputProps={{ startAdornment: <Search fontSize="small" sx={{ color: "text.secondary", marginRight: "10px" }} /> }}
                                       variant="outlined" />
                            <Stack spacing={1}>
                                <Typography fontWeight={600}>
                                    Date range
                                </Typography>
                                <Stack alignItems="center" spacing={1} direction="row">
                                    <DatePicker label="From"
                                                value={createdAfter
                                                    ? new Date(createdAfter.toString())
                                                    : null}
                                                onChange={e => {
                                                    if (e)
                                                        setCreatedAfter(LocalDate.parse(e.toISOString().slice(0, e.toISOString().indexOf("T"))));
                                                }}
                                                slotProps={{ textField: { size: "small", margin: "dense", variant: "outlined" } }}
                                                renderInput={params => <TextField {...params} InputProps={{ ...(params.InputProps ?? {}), readOnly: true }} />} />
                                    <span>—</span>
                                    <DatePicker label="To"
                                                value={createdBefore
                                                    ? new Date(createdBefore.toString())
                                                    : null}
                                                onChange={e => {
                                                    if (e)
                                                        setCreatedBefore(LocalDate.parse(e.toISOString().slice(0, e.toISOString().indexOf("T"))));
                                                }}
                                                slotProps={{ textField: { size: "small", margin: "dense", variant: "outlined" } }}
                                                renderInput={params => <TextField {...params} InputProps={{ ...(params.InputProps ?? {}), readOnly: true }} />} />
                                </Stack>
                            </Stack>
                            <Stack spacing={1}>
                                <Typography fontWeight={600}>
                                    Created by
                                </Typography>
                                <FormControl size="small">
                                    <InputLabel id="demo-simple-select-label">User</InputLabel>
                                    <Select labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            value={createdByFilter ?? null}
                                            onChange={e => {
                                                if (e)
                                                    setCreatedByFilter(e.target.value ?? void 0);
                                            }}
                                            label="User">
                                        <MenuItem value={undefined}><i>Unspecified</i></MenuItem>
                                        { profiles.map(profile => (
                                            <MenuItem key={profile.address} value={profile.address}>{ profile.full_name }</MenuItem>
                                        )) }
                                    </Select>
                                </FormControl>
                            </Stack>
                            <span />
                            <Stack direction="row" spacing={2}>
                                <Button variant="outlined"
                                        fullWidth
                                        color="primary">Reset</Button>
                                <Button variant="contained" disableElevation
                                        fullWidth
                                        color="primary">Apply filters</Button>
                            </Stack>
                        </Stack>
                    </Grid2>
                </Grid2>
            </Container>
            <BottomBarWidget />
            <ShareQrWidget />
        </>
    );
});
