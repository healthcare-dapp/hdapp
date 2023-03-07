import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/system/Stack";
import axios, { isAxiosError } from "axios";
import { FormEvent, useState } from "react";
import { router } from "../../router";

export function AdminLogin() {
    const [email, changeEmail] = useState(" ");
    const [password, changePass] = useState(" ");
    const [errorsEmail, setErrorEmail] = useState(true);
    const [helperEmail, setHelperEmail] = useState("Email cannot be empty");

    const validateEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
        changeEmail(event.target.value);
        if (event.target.value.trim().length === 0) {
            setErrorEmail(true);
            setHelperEmail("Email cannot be empty");
        } else if (!event.target.value.toLocaleLowerCase().match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
            setErrorEmail(true);
            setHelperEmail("Incorrect Email provided");
        } else {
            setErrorEmail(false);
            setHelperEmail("");
        }
    };

    const login = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const form = {
            email: email,
            password: formData.get("password")
        };
        console.log(form);
        try {
            const response = await axios.post("https://hdapp.ruslang.xyz/api/auth/login", form);
            console.log(response.data);
            alert("Sign Up succesfull. Welcome back administrator");
            void router.navigate("/admin");
        } catch (e) {
            if (!isAxiosError(e))
                return alert(e);
            if (e.response?.status === 401)
                alert("Unauthorized access. You are not an administrator");
            else
                alert(e);
        }
    };

    return (
        <Container component="main">
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
                <Card variant="outlined" sx={{ maxWidth: 650, marginTop: 5, p: 2, width: 1, alignItems: "center" }}>{
                    <Box component="form" onSubmit={login} noValidate sx={{ mt: 3 }}>
                        <Stack spacing={1.5}>
                            <TextField required
                                       fullWidth
                                       onChange={validateEmail}
                                       error={errorsEmail}
                                       helperText={helperEmail}
                                       label="Email"
                                       id="email"
                                       name={email}
                                       autoFocus />

                            <TextField required
                                       fullWidth
                                       label="Password"
                                       type="password"
                                       name="password"
                                       id="password" />

                            <Button type="submit"
                                    variant="contained"
                                    disabled={errorsEmail}
                                    sx={{ mt: 3, mb: 2 }}>
                                LOGIN
                            </Button>
                        </Stack>
                    </Box>
                }
                </Card>
            </Box>
        </Container>
    );
}

