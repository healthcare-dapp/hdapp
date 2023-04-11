import { LocalDate } from "@js-joda/core";
import { Tune, Add, Search } from "@mui/icons-material";
import { Stack, Box, useTheme, Typography, IconButton, Button, useMediaQuery, CircularProgress, TextField, Card, FormControlLabel, Radio, FormControl, InputLabel, Select, MenuItem, Checkbox } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
import { ModalProvider } from "../../../App2";
import { CreateBlockDialog } from "../../../dialogs/create-block.dialog";
import { sessionManager } from "../../../managers/session.manager";
import { BlockEntry, blockService } from "../../../services/block.service";
import { ProfileEntry, profileService } from "../../../services/profile.service";
import { useDatabase } from "../../../utils/use-database";
import { DashboardViewModel, RecordGroupType } from "../dashboard.vm";
import { DataGroupsListWidget } from "./data-groups-list.widget";

export const MyMedicalDataWidget: FC<{ vm: DashboardViewModel }> = observer(x => {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const [isSearchOpened, setIsSearchOpened] = useState(false);
    const [areFiltersOpened, setAreFiltersOpened] = useState(false);
    const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
    const [blocks, setBlocks] = useState<BlockEntry[]>([]);

    useDatabase(async () => {
        setBlocks(await blockService.getBlocks());
        setProfiles(await profileService.searchProfiles({}, sessionManager.encryption));
    });

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
                           value={x.vm.recordSearchRequest.filters?.query}
                           onChange={e => {
                               x.vm.recordSearchRequest = {
                                   ...x.vm.recordSearchRequest,
                                   filters: {
                                       ...x.vm.recordSearchRequest.filters,
                                       query: e.target.value
                                   }
                               };
                           }}
                           size="small"
                           InputProps={{ startAdornment: <Search fontSize="small" sx={{ color: "text.secondary", marginRight: "10px" }} /> }}
                           variant="outlined" />
            ) }
            { areFiltersOpened && (
                <Card variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={3}>
                        <Stack spacing={0} sx={{ whiteSpace: "nowrap" }}>
                            <Typography fontWeight={600}>Grouping</Typography>
                            <FormControlLabel control={(
                                <Radio onChange={() => { x.vm.groupBy = RecordGroupType.ByBlock; }}
                                       checked={x.vm.groupBy === RecordGroupType.ByBlock} />
                            )} label="By block name" />
                            <FormControlLabel control={(
                                <Radio onChange={() => { x.vm.groupBy = RecordGroupType.ByCreator; }}
                                       checked={x.vm.groupBy === RecordGroupType.ByCreator} />
                            )} label="By author" />
                            <FormControlLabel control={(
                                <Radio onChange={() => { x.vm.groupBy = RecordGroupType.ByMonthCreated; }}
                                       checked={x.vm.groupBy === RecordGroupType.ByMonthCreated} />
                            )} label="By month created" />
                            <FormControlLabel control={(
                                <Radio onChange={() => { x.vm.groupBy = RecordGroupType.ByYearCreated; }}
                                       checked={x.vm.groupBy === RecordGroupType.ByYearCreated} />
                            )} label="By year created" />
                            <Box mb={2} />
                            <Typography fontWeight={600}>Sorting</Typography>
                            <FormControlLabel control={(
                                <Radio onChange={() => { x.vm.recordSearchRequest = { ...x.vm.recordSearchRequest, sort_by: "created_at" }; }}
                                       checked={x.vm.recordSearchRequest.sort_by === "created_at"} />
                            )} label="By date created" />
                            <FormControlLabel control={(
                                <Radio onChange={() => { x.vm.recordSearchRequest = { ...x.vm.recordSearchRequest, sort_by: "title" }; }}
                                       checked={x.vm.recordSearchRequest.sort_by === "title"} />
                            )} label="By title" />
                        </Stack>
                        <Stack spacing={1}>
                            <Typography fontWeight={600}>Filter by creation date</Typography>
                            <Stack alignItems="center" spacing={1} direction="row">
                                <DatePicker label="From"
                                            value={x.vm.recordSearchRequest.filters?.created_after
                                                ? new Date(x.vm.recordSearchRequest.filters.created_after.toString())
                                                : null}
                                            onChange={e => {
                                                if (e)
                                                    x.vm.recordSearchRequest = {
                                                        ...x.vm.recordSearchRequest,
                                                        filters: {
                                                            ...x.vm.recordSearchRequest.filters,
                                                            created_after: LocalDate.parse(e.toISOString().slice(0, e.toISOString().indexOf("T")))
                                                        }
                                                    };
                                            }}
                                            slotProps={{ textField: { size: "small", margin: "dense", variant: "outlined" } }}
                                            renderInput={params => <TextField {...params} InputProps={{ ...(params.InputProps ?? {}), readOnly: true }} />} />
                                <span>—</span>
                                <DatePicker label="To"
                                            value={x.vm.recordSearchRequest.filters?.created_before
                                                ? new Date(x.vm.recordSearchRequest.filters.created_before.toString())
                                                : null}
                                            onChange={e => {
                                                if (e)
                                                    x.vm.recordSearchRequest = {
                                                        ...x.vm.recordSearchRequest,
                                                        filters: {
                                                            ...x.vm.recordSearchRequest.filters,
                                                            created_before: LocalDate.parse(e.toISOString().slice(0, e.toISOString().indexOf("T")))
                                                        }
                                                    };
                                            }}
                                            slotProps={{ textField: { size: "small", margin: "dense", variant: "outlined" } }}
                                            renderInput={params => <TextField {...params} InputProps={{ ...(params.InputProps ?? {}), readOnly: true }} />} />
                            </Stack>
                            <span />
                            <Typography fontWeight={600}>Filter by author</Typography>
                            <FormControl size="small">
                                <InputLabel id="demo-simple-select-label">User</InputLabel>
                                <Select labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        value={x.vm.recordSearchRequest.filters?.created_by}
                                        onChange={e => {
                                            if (e)
                                                x.vm.recordSearchRequest = {
                                                    ...x.vm.recordSearchRequest,
                                                    filters: {
                                                        ...x.vm.recordSearchRequest.filters,
                                                        created_by: e.target.value
                                                    }
                                                };
                                        }}
                                        label="User">
                                    <MenuItem value={undefined}><i>Unspecified</i></MenuItem>
                                    { profiles.map(profile => (
                                        <MenuItem key={profile.address} value={profile.address}>{ profile.full_name }</MenuItem>
                                    )) }
                                </Select>
                            </FormControl>
                            <span />
                            <Typography fontWeight={600}>Filter by blocks</Typography>
                            <FormControl size="small">
                                <InputLabel id="demo-simple-select-label">Block name</InputLabel>
                                <Select labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        label="Block name"
                                        value={x.vm.recordSearchRequest.filters?.block_id}
                                        onChange={e => {
                                            if (e)
                                                x.vm.recordSearchRequest = {
                                                    ...x.vm.recordSearchRequest,
                                                    filters: {
                                                        ...x.vm.recordSearchRequest.filters,
                                                        block_id: e.target.value
                                                    }
                                                };
                                        }}>
                                    <MenuItem value={undefined}><i>Unspecified</i></MenuItem>
                                    { blocks.map(block => (
                                        <MenuItem key={block.hash} value={block.hash}>{ block.friendly_name }</MenuItem>
                                    )) }
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
