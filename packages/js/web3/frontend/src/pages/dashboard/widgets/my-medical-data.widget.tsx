import { Tune, Add, Search } from "@mui/icons-material";
import { Stack, Box, useTheme, Typography, IconButton, Button, useMediaQuery, CircularProgress, TextField, Card, FormControlLabel, Radio, FormControl, InputLabel, Select, MenuItem, Checkbox } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
import { ModalProvider } from "../../../App2";
import { CreateBlockDialog } from "../../../dialogs/create-block.dialog";
import { DashboardViewModel } from "../dashboard.vm";
import { DataGroupsListWidget } from "./data-groups-list.widget";

export const MyMedicalDataWidget: FC<{ vm: DashboardViewModel }> = observer(x => {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const [isSearchOpened, setIsSearchOpened] = useState(false);
    const [areFiltersOpened, setAreFiltersOpened] = useState(false);

    return (
        <>
            { isDesktop && (
                <Stack alignItems="center" direction="row" spacing={1}>
                    <Typography variant="h5">My medical data</Typography>
                    <Box flexGrow={1} />
                    <IconButton onClick={() => setAreFiltersOpened(b => !b)}
                                color={areFiltersOpened ? "primary" : void 0}>
                        <Tune />
                    </IconButton>
                    <IconButton onClick={() => setIsSearchOpened(b => !b)}
                                color={isSearchOpened ? "primary" : void 0}>
                        <Search />
                    </IconButton>
                    <Button variant="outlined"
                            startIcon={<Add />}
                            onClick={() => ModalProvider.show(CreateBlockDialog, {})}>
                        Add new block
                    </Button>
                </Stack>
            ) }
            { isSearchOpened && (
                <TextField margin="dense"
                           placeholder="Search..."
                           fullWidth
                           size="small"
                           InputProps={{ startAdornment: <Search fontSize="small" sx={{ color: "text.secondary", marginRight: "10px" }} /> }}
                           variant="outlined" />
            ) }
            { areFiltersOpened && (
                <Card variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={3}>
                        <Stack spacing={0} sx={{ whiteSpace: "nowrap" }}>
                            <Typography fontWeight={600}>Group by</Typography>
                            <FormControlLabel control={<Radio checked />} label="Block name" />
                            <FormControlLabel control={<Radio />} label="Author" />
                            <FormControlLabel control={<Radio />} label="By month" />
                            <FormControlLabel control={<Radio />} label="By year" />
                            <Box mb={2} />
                            <Typography fontWeight={600}>Sort by</Typography>
                            <FormControlLabel control={<Radio checked />} label="Creation date" />
                            <FormControlLabel control={<Radio />} label="Title" />
                        </Stack>
                        <Stack spacing={1}>
                            <Typography fontWeight={600}>Filter by creation date</Typography>
                            <Stack alignItems="center" spacing={1} direction="row">
                                <DatePicker label="From"
                                            slotProps={{ textField: { size: "small", margin: "dense", variant: "outlined" } }}
                                            renderInput={params => <TextField {...params} InputProps={{ ...(params.InputProps ?? {}), readOnly: true }} />} />
                                <span>—</span>
                                <DatePicker label="To"
                                            slotProps={{ textField: { size: "small", margin: "dense", variant: "outlined" } }}
                                            renderInput={params => <TextField {...params} InputProps={{ ...(params.InputProps ?? {}), readOnly: true }} />} />
                            </Stack>
                            <span />
                            <Typography fontWeight={600}>Filter by author</Typography>
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
                            <span />
                            <Typography fontWeight={600}>Filter by blocks</Typography>
                            <FormControl size="small">
                                <InputLabel id="demo-simple-select-label">Block name</InputLabel>
                                <Select labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        label="Block name">
                                    <MenuItem value={10}>Prescription</MenuItem>
                                    <MenuItem value={20}>Legal paper</MenuItem>
                                    <MenuItem value={30}>Other</MenuItem>
                                </Select>
                            </FormControl>
                            <span />
                            <Stack direction="row" spacing={2}>
                                <FormControlLabel control={<Checkbox />} label="Has attachments" />
                                <FormControlLabel control={<Checkbox />} label="Is archived" />
                            </Stack>
                        </Stack>
                    </Stack>
                </Card>
            ) }
            { x.vm.loadRecords.pending
                ? (
                    <>
                        <br />
                        <CircularProgress sx={{ alignSelf: "center" }} />
                    </>
                )
                : <DataGroupsListWidget groups={toJS(x.vm.groups)} /> }

        </>
    );
});
