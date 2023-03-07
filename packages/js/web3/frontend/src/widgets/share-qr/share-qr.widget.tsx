import { QrCodeRounded } from "@mui/icons-material";
import { useMediaQuery, useTheme, Fab } from "@mui/material";
import { FC } from "react";
import { ModalProvider } from "../../App2";
import { QrCodeDialog } from "../../dialogs/qr-code.dialog";

export const ShareQrWidget: FC = () => {
    const theme = useTheme();
    const canShowFab = useMediaQuery(theme.breakpoints.down("sm"));

    if (!canShowFab)
        return null;

    return (
        <Fab color="success" aria-label="add"
             sx={{
                 position: "fixed",
                 bottom: 56,
                 right: 0
             }} style={{ margin: 16 }}
             onClick={() => ModalProvider.show(QrCodeDialog, { onClose() {} })}>
            <QrCodeRounded />
        </Fab>
    );
};
