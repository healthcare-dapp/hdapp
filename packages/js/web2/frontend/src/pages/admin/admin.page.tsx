import { AppBar, Toolbar, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { forwardRef } from "react";
import { PageWidget } from "../../widgets/page";

export const AdminPage = observer(forwardRef((props, ref) => {
    return (
        <PageWidget>
            <AppBar variant="outlined" position="static" color="inherit" sx={{ backgroundColor: "#eee", border: 0 }}>
                <Toolbar variant="dense">
                    <Typography variant="h6" color="inherit" component="div">
                        Administration
                    </Typography>
                </Toolbar>
            </AppBar>
        </PageWidget>
    );
}));

