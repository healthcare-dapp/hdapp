import { Dialog, useMediaQuery, useTheme } from "@mui/material";
import { observer } from "mobx-react-lite";
import { FC } from "react";
import { ModalProvider } from "../App2";
import { SignInPage } from "../pages/sign-in/sign-in.page";

export const AddAccountDialog: FC<{ onClose?(): void }> = observer(x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));

    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="md" fullWidth
                onClose={() => x.onClose?.()}
                sx={{ ".MuiDialog-paper": { background: "none", boxShadow: "none" } }}
                {...ModalProvider.modalProps(x)}>
            <SignInPage isAddingAccount onClose={x.onClose} />
        </Dialog>
    );
});
