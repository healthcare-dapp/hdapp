import { Add } from "@mui/icons-material";
import { Button, Stack, useTheme, useMediaQuery, Typography } from "@mui/material";
import { FC } from "react";
import { ModalProvider } from "../../../App2";
import { CreateBlockDialog } from "../../../dialogs/create-block.dialog";
import { RecordGroup } from "../dashboard.vm";
import { DataGroupItemWidget } from "./data-group-item.widget";

export const DataGroupsListWidget: FC<{ groups: RecordGroup[] }> = x => {
    const theme = useTheme();
    const canShowSidebar = useMediaQuery(theme.breakpoints.up("md"));
    return (
        <Stack>
            { x.groups.length
                ? x.groups.map(group => (
                    <DataGroupItemWidget key={group.key} group={group} />
                ))
                : <Typography color="text.secondary" align="center" sx={{ my: 5 }}>No medical data has been added yet!</Typography> }
            { !canShowSidebar && (
                <Button variant="outlined" sx={{ mt: 2 }} startIcon={<Add />}
                        onClick={() => ModalProvider.show(CreateBlockDialog, {})}>Add new block</Button>
            ) }
        </Stack>
    );
};
