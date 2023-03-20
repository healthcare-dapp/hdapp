import { Card, Stack, styled } from "@mui/material";
import { PropsWithChildren } from "react";
import { SidebarWidget } from "../sidebar";

const OverflowCard = styled(Card)`
    width: 100%;
    height: 100%;
    overflow: auto;
    overflow: overlay;
`;

export const PageWidget: React.FC<PropsWithChildren> = x => {
    return (
        <Stack direction="row" spacing={2} p={2} height="100vh" width="100%">
            <SidebarWidget />
            <OverflowCard variant="outlined">
                { x.children }
            </OverflowCard>
        </Stack>
    );
};
