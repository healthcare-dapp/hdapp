import { formatTemporal } from "@hdapp/shared/web2-common/utils/temporal";
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
import { EventLogEntry, eventLogService } from "../../services/event-log.service";
import { trimWeb3Address } from "../../utils/trim-web3-address";
import { useDatabase } from "../../utils/use-database";
import { BottomBarWidget } from "../../widgets/bottom-bar";
import { DrawerWidget } from "../../widgets/drawer";
import { HeaderWidget } from "../../widgets/header";
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

    useDatabase(async () => {
        const logEntries = await eventLogService.getEventLogs();
        setLogs(logEntries);
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
                                                slotProps={{ textField: { size: "small", margin: "dense", variant: "outlined" } }}
                                                renderInput={params => <TextField {...params} InputProps={{ ...(params.InputProps ?? {}), readOnly: true }} />} />
                                    <span>—</span>
                                    <DatePicker label="To"
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
                                            label="User">
                                        <MenuItem value={10}>Prescription</MenuItem>
                                        <MenuItem value={20}>Legal paper</MenuItem>
                                        <MenuItem value={30}>Other</MenuItem>
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
