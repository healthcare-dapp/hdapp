import { setJwtToken } from "@hdapp/shared/web2-common/api/http";
import { UsersService } from "@hdapp/shared/web2-common/api/services";
import { UserDto } from "@hdapp/shared/web2-common/dto/user.dto";
import { Add, AdminPanelSettings, LocalPolice, MedicalInformation, Person, Refresh, Search, Tune } from "@mui/icons-material";
import { AppBar, Box, Button, Checkbox, IconButton, InputAdornment, Stack, TextField, Toolbar, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { forwardRef, useEffect, useState } from "react";
import { PageWidget } from "../../widgets/page";

const columns: GridColDef[] = [
    {
        field: "web3_address",
        flex: 1,
        headerName: "Web3 Address",
        renderCell(params) {
            return (
                <Typography color="info.main" fontSize="14px">
                    <a style={{ color: "inherit" }} target="_blank" href={`https://mumbai.polygonscan.com/address/${params.value}`} rel="noreferrer">
                        { params.value }
                    </a>
                </Typography>
            );
        }
    },
    {
        field: "email",
        width: 200,
        headerName: "E-mail"
    },
    {
        field: "full_name",
        width: 200,
        headerName: "Full name"
    },
    {
        field: "birth_date",
        width: 120,
        headerName: "Date of birth"
    },
    {
        field: "role",
        width: 150,
        headerName: "Role",
        renderCell(params) {
            const icon = params.row.has_administrator_capabilities
                ? <AdminPanelSettings />
                : params.row.has_moderator_capabilities
                    ? <LocalPolice />
                    : params.row.has_doctor_capabilities
                        ? <MedicalInformation />
                        : <Person />;
            const text = params.row.has_administrator_capabilities
                ? "Administrator"
                : params.row.has_moderator_capabilities
                    ? "Moderator"
                    : params.row.has_doctor_capabilities
                        ? "Doctor"
                        : "Client";
            return (
                <Stack direction="row" alignItems="center" justifyContent="center" style={{ width: "100%" }} spacing={1}>
                    { icon }
                    <Typography fontSize="14px">{ text }</Typography>
                </Stack>
            );
        }
    },
    {
        field: "is_banned",
        width: 100,
        headerName: "Banned?",
        renderCell(params) {
            return (
                <Checkbox readOnly checked={!!params.value} color="error" />
            );
        }
    },
    {
        field: "actions",
        headerName: "",
        width: 110,
        renderCell(params) {
            return (
                <Stack direction="row" justifyContent="space-around" style={{ width: "100%" }}
                       onClick={e => e.stopPropagation()}>
                    <Button variant="outlined" size="small" color="error">Ban</Button>
                    <Button variant="outlined" size="small" color="primary">Ban</Button>
                </Stack>
            );
        }
    },
];

// for now
setJwtToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjc3NzUwNDI0LCJleHAiOjE2Nzc4MzY4MjR9.O0oYsEwDQmPU8fHlE6MyGOdrLGSZIYzDExuDZruEYqI");

export const UsersPage = observer(forwardRef((props, ref) => {
    const [users, setUsers] = useState<UserDto[]>([]);
    useEffect(() => {
        (async () => {
            const response = await UsersService.findPaged({ has_web3_address: true });
            setUsers(response.items);
        })();
    }, []);
    return (
        <PageWidget>
            <Stack height="100%">
                <AppBar variant="outlined" position="static" color="inherit" sx={{ backgroundColor: "#eee", border: 0 }}>
                    <Toolbar variant="dense" style={{ paddingRight: "16px" }}>
                        <Typography variant="h6" color="inherit" component="div">
                            Users
                        </Typography>
                        <Box sx={{ flex: 1, ml: 3 }} />
                        <Box sx={{ py: 1, mx: "auto", maxWidth: 450, width: "100%", flexGrow: 1 }}>
                            <TextField size="small" variant="outlined" placeholder="Search..."
                                       sx={{ width: "100%" }}
                                       InputProps={{
                                           startAdornment: (
                                               <InputAdornment position="start">
                                                   <Search />
                                               </InputAdornment>
                                           )
                                       }} />
                        </Box>
                        <IconButton color="inherit" sx={{ ml: 1 }}>
                            <Tune />
                        </IconButton>
                        <IconButton color="inherit">
                            <Refresh />
                        </IconButton>
                        <Box sx={{ flex: 1 }} />
                        <Button variant="outlined" startIcon={<Add />} color="primary" sx={{ ml: 1, flexShrink: 0 }}>
                            New user
                        </Button>
                    </Toolbar>
                </AppBar>
                <DataGrid checkboxSelection
                          columns={columns}
                          rows={users}
                          style={{ border: 0, flexGrow: 1 }} />
            </Stack>
        </PageWidget>
    );
}));

