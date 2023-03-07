import { Tune, Add, Search } from "@mui/icons-material";
import { Stack, Box, useTheme, Typography, IconButton, Button, useMediaQuery, CircularProgress } from "@mui/material";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { FC } from "react";
import { ModalProvider } from "../../../App2";
import { CreateBlockDialog } from "../../../dialogs/create-block.dialog";
import { DashboardViewModel } from "../dashboard.vm";
import { DataGroupsListWidget } from "./data-groups-list.widget";

export const MyMedicalDataWidget: FC<{ vm: DashboardViewModel }> = observer(x => {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

    return (
        <>
            { isDesktop && (
                <Stack alignItems="center" direction="row" spacing={1}>
                    <Typography variant="h5">My medical data</Typography>
                    <Box flexGrow={1} />
                    <IconButton>
                        <Tune />
                    </IconButton>
                    <IconButton>
                        <Search />
                    </IconButton>
                    <Button variant="outlined"
                            startIcon={<Add />}
                            onClick={() => ModalProvider.show(CreateBlockDialog, {})}>
                        Add new block
                    </Button>
                </Stack>
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
