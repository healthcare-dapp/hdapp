import { setJwtToken } from "@hdapp/shared/web2-common/api/http";
import { UsersService } from "@hdapp/shared/web2-common/api/services";
import { UserDto } from "@hdapp/shared/web2-common/dto/user.dto";
import { Add, AdminPanelSettings, LocalPolice, MedicalInformation, Person, Refresh, Search, Tune } from "@mui/icons-material";
import { AppBar, Box, Button, Checkbox, IconButton, InputAdornment, Stack, TextField, Toolbar, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, useGridApiContext, useGridApiRef } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { forwardRef, useEffect, useState } from "react";
import { PageWidget } from "../../widgets/page";

// const editClick = async (cellValues: GridRenderCellParams) => {
//     console.log("CLICK");
//     setting.editable = true;
//     cellValues.api.getRow(cellValues.row.id).editable=true;
//     cellValues.api.startRowEditMode({ id: cellValues.row.id });
//     //apiRef.current.startRowEditMode({ id: cellValues.row.id });
// };

const saveClick = async (cellValues: GridRenderCellParams) => {
    const data: UserDto = cellValues.row;
    const data1: UserDto = { web3_address: cellValues.row.web3_address,
        email: cellValues.row.email,
        full_name: cellValues.row.full_name,
        birth_date: cellValues.row.birth_date,
        medical_organization_name: cellValues.row.medical_organization_name,
        confirmation_documents: cellValues.row.confirmation_documents,
        has_doctor_capabilities: cellValues.row.has_doctor_capabilities,
        has_moderator_capabilities: cellValues.row.has_moderator_capabilities,
        has_administrator_capabilities: cellValues.row.has_administrator_capabilities,
        has_verified_email: cellValues.row.has_verified_email,
        is_verified_doctor: cellValues.row.is_verified_doctor,
        is_banned: cellValues.row.is_banned,
        id: cellValues.row.id
    };
    console.log(data);
    console.log(data1);
    const b = await UsersService.updateUser(data1);
    console.log(b);
    console.log("Save complete");
    // cellValues.api.stopRowEditMode({ id: cellValues.id });
    // cellValues.api.getRow(cellValues.id).editable = false;
};
const discardClick = async (cellValues: GridRenderCellParams) => {
    const data: UserDto = cellValues.row;
    data.is_banned = !data.is_banned;
    const b = await UsersService.updateUser(data);
    console.log(b);
    console.log("Ban status switched to " + data.is_banned.valueOf());
};

const setting = {
    editable: true
};

const columns: GridColDef[] = [
    // {
    //     field: "editButton",
    //     headerName: "",
    //     width: 90,
    //     renderCell(params) {
    //         return (
    //             <Button variant="contained" size="small" color="primary" onClick={() => {
    //                 editClick(params);
    //             }}>Edit</Button>
    //         );
    //     }
    // },
    {
        field: "web3_address",
        flex: 1,
        headerName: "Web3 Address",
        renderCell(params) {
            return (
                <Typography color="info.main" fontSize="14px">
                    <a style={{ color: "inherit" }} target="_blank" href={`https://mumbai.polygonscan.com/address/${params.value}`} rel="noreferrer" contentEditable={false}>
                        { params.value }
                    </a>
                </Typography>
            );
        }
    },
    {
        field: "email",
        width: 200,
        headerName: "E-mail",
    },
    {
        field: "full_name",
        width: 200,
        headerName: "Full name",
        editable: setting.editable
    },
    {
        field: "birth_date",
        width: 120,
        headerName: "Date of birth",
        editable: setting.editable
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
        editable: setting.editable,
        renderCell(params) {
            return (
                <Checkbox checked={!!params.value} color="error" />
            );
        }
    },
    {
        field: "actions",
        headerName: "",
        width: 200,
        renderCell(params) {
            return (
                <Stack direction="row" justifyContent="space-around" style={{ width: "100%" }}
                       onClick={e => e.stopPropagation()}>
                    <Button variant="contained" size="small" color="primary" onClick={() =>saveClick(params)}>save</Button>
                    <Button variant="contained" size="small" color="error" onClick={() =>discardClick(params)}>ban</Button>
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
                          editMode="row"
                          style={{ border: 0, flexGrow: 1 }} />
            </Stack>
        </PageWidget>
    );
}));

