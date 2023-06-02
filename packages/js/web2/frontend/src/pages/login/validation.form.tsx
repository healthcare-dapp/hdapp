import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import axios, { isAxiosError } from "axios";
import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { ValidateName } from "../../pages/registration/form.control";
import { router } from "../../router";

export function AdminLogin() {
    const [email, changeEmail] = useState(" ");
    const [password, changePass] = useState(" ");

    const login = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const form = {
            email: formData.get("email"),
            password: formData.get("password")
        };
        console.log(form);
        try {
            const response = await axios.post("https://hdapp.ruslang.xyz/api/auth/login", form);
            console.log(response.data);
            toast.success("Sign Up succesfull. Welcome to the panel administrator", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            void router.navigate("/admin");
        } catch (e) {
            if (!isAxiosError(e))
                toast.error(e, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
            if (e.response?.status === 401)
                toast.error("Unauthorized access. You are not an administrator", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
            else
                alert(e);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Box sx={{
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}>
                <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                </Avatar>
                <Typography component="h1" variant="h5">
                    Admin Login
                </Typography>
                <Box component="form" onSubmit={login} noValidate sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField required
                                       fullWidth
                                       label="Email"
                                       id="email"
                                       name="email"
                                       autoFocus />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField required
                                       fullWidth
                                       label="Password"
                                       type="password"
                                       name="password"
                                       id="password" />

                        </Grid>

                        <Grid item xs={8}>
                            <Button type="submit"
                                    variant="contained"
                                    sx={{ mt: 3, mb: 2 }}>
                                LOGIN
                            </Button>
                        </Grid>
                        <ValidateName />
                    </Grid>
                </Box>
            </Box>
        </Container>
    );
}

