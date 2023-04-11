import { Devices, Hub, Key } from "@mui/icons-material";
import { Avatar, Box, Button, Container, Link, Stack, styled, Typography, useTheme } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { observer } from "mobx-react-lite";
import { forwardRef } from "react";
import StockImage from "../../assets/raster/stock.jpg";
import { router } from "../../router";
import { Logo } from "../../widgets/sidebar";

const FooterLink = styled(Link)`
    font-family: ${({ theme }) => theme.typography.fontFamily};
    color: ${({ theme }) => theme.palette.text.primary};
    text-decoration: none;

    &:hover {
        text-decoration: underline
    }
`;

export const HomePage = observer(forwardRef((props, ref) => {
    const theme = useTheme();

    return (
        <Container>
            <Stack direction="row" alignItems="center"
                   spacing={2}
                   sx={{ position: "sticky", top: 10, left: 0, width: "100%", py: 1, px: 2, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", borderRadius: "12px", margin: "10px 0", zIndex: 100 }}>
                <Logo />
                <Box flexGrow={1} />
                <Button variant="outlined"
                        onClick={() => router.navigate("/register")}>
                    Create an account
                </Button>
                <Button variant="contained" disableElevation color="success"
                        onClick={() => location.assign("/app")}>Sign in</Button>
            </Stack>
            <Stack gap={1} justifyContent="center" px={3} alignItems="flex-start"
                   sx={{
                       position: "relative",
                       backgroundColor: "#909790",
                       backgroundImage: `url(${StockImage})`,
                       backgroundSize: "cover",
                       backgroundPosition: "center center",
                       height: "500px",
                       padding: "0 80px",
                       borderRadius: "24px",
                       color: "white",
                       boxShadow: "inset 0 0 0 1000px rgba(0,0,0,0.2)",
                       margin: "0 -10px"
                   }}>
                <Typography fontSize={60} fontWeight={700} style={{ lineHeight: "20px" }}>Secure</Typography>
                <Typography fontSize={48}>medical data storage</Typography>
                <Typography fontSize={18} style={{ maxWidth: 320 }}>Simple, decentralized, private health data storage and sharing available worldwide.</Typography>
                <br />
                <Stack direction="row" spacing={2}>
                    <Button variant="contained"
                            color="success"
                            size="large"
                            onClick={() => router.navigate("/register")}>
                        Sign up for free
                    </Button>
                    <Button style={{ color: "white" }}
                            size="large"
                            onClick={() => location.assign("/app")}>Sign in</Button>
                </Stack>
            </Stack>
            <br />
            <Grid2 columnSpacing={4} sx={{ py: 4 }} container>
                <Grid2 xs={4}>
                    <Stack spacing={1} alignItems="center">
                        <Avatar sx={{ width: 160, height: 160, background: theme.palette.primary.main }}>
                            <Hub sx={{ fontSize: 100 }} />
                        </Avatar>
                        <span />
                        <Typography align="center" fontSize={20} fontWeight={500}>Decentralized data exchange</Typography>
                        <Typography align="center" fontSize={16}>All your health data is being exchanged using peer-to-peer means, which ensures that nobody can intercept your data.</Typography>
                    </Stack>
                </Grid2>
                <Grid2 xs={4}>
                    <Stack spacing={1} alignItems="center">
                        <Avatar sx={{ width: 160, height: 160, background: theme.palette.success.main }}>
                            <Devices sx={{ fontSize: 100 }} />
                        </Avatar>
                        <span />
                        <Typography align="center" fontSize={20} fontWeight={500}>Optimized for your devices</Typography>
                        <Typography align="center" fontSize={16}>Access your health data whereever you go, be it a mobile phone, tablet, or a computer, anytime.</Typography>
                    </Stack>
                </Grid2>
                <Grid2 xs={4}>
                    <Stack spacing={1} alignItems="center">
                        <Avatar sx={{ width: 160, height: 160, background: theme.palette.secondary.main }}>
                            <Key sx={{ fontSize: 100 }} />
                        </Avatar>
                        <span />
                        <Typography align="center" fontSize={20} fontWeight={500}>Encrypted and accessible offline</Typography>
                        <Typography align="center" fontSize={16}>All your health data is always synchronized and available locally, while being stored in an encrypted environment.</Typography>
                    </Stack>
                </Grid2>
            </Grid2>
            <br />
            <Stack alignItems="center"
                   spacing={1}
                   style={{
                       padding: "40px 0",
                       borderRadius: "24px",
                       background: theme.palette.grey[300]
                   }}>
                <Typography fontSize={32} fontWeight={500} align="center">Say "no" to health data on paper</Typography>
                <Typography fontSize={18} align="center">Connect with your specialists on Healthcare DApp and never lose your health data anymore.</Typography>
                <span />
                <span />
                <span />
                <Button variant="contained"
                        color="success"
                        size="large"
                        disableElevation
                        onClick={() => router.navigate("/register")}>
                    Sign up for free
                </Button>
            </Stack>
            <br />
            <Stack alignItems="center"
                   spacing={1}
                   style={{
                       padding: "40px 0",
                       borderRadius: "24px",
                       background: theme.palette.grey[300]
                   }}>
                <Typography fontSize={32} fontWeight={500} align="center">Are you a medical organization?</Typography>
                <Typography fontSize={18} align="center">Do not lose out on potential clients. Let's find ways how we can integrate your organization with Healthcare DApp now.</Typography>
                <span />
                <span />
                <span />
                <Button variant="contained"
                        color="info"
                        size="large"
                        disableElevation
                        href="mailto:hdapp@ruzik.xyz">
                    Contact us
                </Button>
            </Stack>
            <br />
            <Stack alignItems="center"
                   justifyContent="center"
                   spacing={2}
                   direction="row"
                   style={{
                       padding: "30px 0",
                       borderRadius: "10px 10px 0 0",
                       background: theme.palette.grey[300]
                   }}>
                <FooterLink href="#/about">About us</FooterLink>
                <span>-</span>
                <FooterLink href="#/tos">Terms of Service</FooterLink>
                <span>-</span>
                <FooterLink href="#/tos">Privacy Policy</FooterLink>
                <span>-</span>
                <FooterLink href="mailto:hdapp@ruzik.xyz">&copy; 2022 Healthcare DApp</FooterLink>
            </Stack>
        </Container>
    );
}));

