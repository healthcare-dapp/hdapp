import { Card, Stack } from "@mui/material";
import { PropsWithChildren } from "react";
import { SidebarWidget } from "../sidebar";

export const PageWidget: React.FC<PropsWithChildren> = x => {
    return (
        <Stack direction="row" spacing={2} p={2} height="100vh" width="100%">
            <SidebarWidget />
            <Card variant="outlined" sx={{ width: "100%", height: "100%", overflow: "overlay" }}>
                { x.children }
            </Card>
        </Stack>
    );
};
