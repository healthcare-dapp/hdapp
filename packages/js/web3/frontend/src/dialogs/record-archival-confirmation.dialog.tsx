import { ArchiveOutlined } from "@mui/icons-material";
import {
    Dialog,
    Button,
    Stack,
    useMediaQuery,
    useTheme,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import { FC } from "react";
import { ModalProvider } from "../App2";

export const RecordArchivalConfirmationDialog: FC<{ onClose(isConfirmed: boolean): void }> = x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="md"
                onClose={() => x.onClose(false)} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                Confirm record archival
            </DialogTitle>
            <DialogContent style={{
                margin: "auto",
                flex: "none"
            }}>
                <Stack spacing={2} alignItems="center">
                    <DialogContentText fontSize={14} align="center">
                        Archiving a medical record will prevent it from being synchronized with other users.
                    </DialogContentText>
                    <Stack direction={isMobileView ? "column-reverse" : "row"} spacing={1} justifyContent="flex-end" sx={{ pt: 2 }}
                           alignSelf={isMobileView ? "stretch" : "center"}>
                        <Button fullWidth={isMobileView}
                                onClick={() => {
                                    x.onClose(false);
                                }}>Cancel</Button>
                        <Button fullWidth={isMobileView}
                                variant="contained" disableElevation
                                onClick={() => {
                                    x.onClose(true);
                                }}
                                startIcon={<ArchiveOutlined />}>Archive</Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
