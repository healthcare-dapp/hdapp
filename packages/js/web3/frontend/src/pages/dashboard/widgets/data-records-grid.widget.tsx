import { Add } from "@mui/icons-material";
import { Button, Stack, Typography } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import { FC, PropsWithChildren } from "react";
import { ModalProvider } from "../../../App2";
import { CreateRecordDialog } from "../../../dialogs/create-record.dialog";

export const DataRecordsGridWidget: FC<PropsWithChildren> = x => {
    return (
        <Grid2 container spacing={2}>
            { x.children }
            <Grid2 xs={12} sm={6} md={4}>
                <Button variant="outlined" onClick={() => ModalProvider.show(CreateRecordDialog, { onClose() {} })} style={{ width: "100%", height: "100%", minHeight: "100px", maxHeight: "200px" }}>
                    <Stack alignItems="center">
                        <Add />
                        <Typography fontWeight="500">New record</Typography>
                    </Stack>
                </Button>
            </Grid2>
        </Grid2>
    );
};
