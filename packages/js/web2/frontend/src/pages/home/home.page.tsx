import { Box, Button, Container, Stack } from "@mui/material";
import { observer } from "mobx-react-lite";
import { forwardRef } from "react";
import { router } from "../../router";
import { Logo } from "../../widgets/sidebar";

export const HomePage = observer(forwardRef((props, ref) => {
    return (
        <Container>
            <Stack direction="row" alignItems="center"
                   spacing={2}
                   sx={{ position: "sticky", top: 0, left: 0, width: "100%", py: 1, px: 2 }}>
                <Logo />
                <Box flexGrow={1} />
                <Button variant="outlined"
                        onClick={() => router.navigate("/register")}>
                    Create an account
                </Button>
                <Button variant="contained" disableElevation color="success"
                        onClick={() => location.assign("/app")}>Sign in</Button>
            </Stack>
        </Container>
    );
}));

