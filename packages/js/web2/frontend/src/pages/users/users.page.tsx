import { setJwtToken } from "@hdapp/shared/web2-common/api/http";
import { UsersService } from "@hdapp/shared/web2-common/api/services";
import { CreateUserDto, UserDto } from "@hdapp/shared/web2-common/dto/user.dto";
import { EmailAddress, emailAddressType } from "@hdapp/shared/web2-common/types/email-address.type";
import { Add, AdminPanelSettings, LocalPolice, MedicalInformation, Person, Refresh, Search, Tune } from "@mui/icons-material";
import { AppBar, Box, Button, Checkbox, FormHelperText, IconButton, InputAdornment, MenuItem, Select, Stack, TextField, Toolbar, Typography } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { DataGrid, GridColDef, GridRenderCellParams, useGridApiContext, useGridApiRef } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { forwardRef, useEffect, useState } from "react";
import { PageWidget } from "../../widgets/page";

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
        id: cellValues.row.id };
    console.log(data);
    console.log(data1);
    const b = await UsersService.updateUser(data, data.id.toString());
    console.log(b);
    console.log("Save complete");
    // cellValues.api.stopRowEditMode({ id: cellValues.id });
    // cellValues.api.getRow(cellValues.id).editable = false;
};
const discardClick = async (cellValues: GridRenderCellParams) => {
    const data: UserDto = cellValues.row;
    const b = await UsersService.switchBan(!data.is_banned, data.id.toString());
    console.log(b);
    console.log("Ban status switched to " + data.is_banned.valueOf());
};

const setting = {
    editable: true
};

const columns: GridColDef[] = [

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
                    <Button variant="contained" size="small" color="error" onClick={() =>discardClick(params)}>{ params.row.is_banned ? "UNBAN" : "BAN" }</Button>
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

    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");

    const createNewUser = () => {

        const handleClose = () => {
            setOpen(false);
        };

        const handleEmailChange = event => {
            setEmail(event.target.value);
        };

        const handleNameChange = event => {
            setName(event.target.value);
        };

        const handleDateOfBirthChange = event => {
            setDateOfBirth(event.target.value);
        };

        const handlePasswordChange = event => {
            setPassword(event.target.value);
        };

        const handleRoleChange = event => {
            setRole(event.target.value);
        };

        const handleCreateUser = async () => {
            console.log(email, name, dateOfBirth, password, role);
            const newuser: CreateUserDto = {
                email: email as EmailAddress,
                full_name: name,
                birth_date: dateOfBirth,
                medical_organization_name: "",
                has_doctor_capabilities: role === "Doctor",
                confirmation_document_ids: []
            };
            const userid = (await UsersService.createNewUserAdmin(newuser)).id;

            if (role === "Moderator")
                await UsersService.updateUser({ has_moderator_capabilities: true }, userid);
            handleClose();
        };

        return (
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>User Creator</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Write information for the new user
                    </DialogContentText>
                    <Stack spacing={1}>
                        <TextField autoFocus
                                   margin="dense"
                                   id="email"
                                   label="Email Address"
                                   fullWidth
                                   variant="standard"
                                   value={email}
                                   onChange={handleEmailChange} />
                        <TextField margin="dense"
                                   id="name"
                                   label="Full Name"
                                   fullWidth
                                   variant="standard"
                                   value={name}
                                   onChange={handleNameChange} />
                        <TextField margin="dense"
                                   id="date-of-birth"
                                   label="Date of birth"
                                   fullWidth
                                   variant="standard"
                                   value={dateOfBirth}
                                   onChange={handleDateOfBirthChange} />
                        <TextField margin="dense"
                                   id="pass"
                                   label="Password"
                                   fullWidth
                                   variant="standard"
                                   value={password}
                                   onChange={handlePasswordChange} />
                        <Select margin="dense" id="role" label="Choose Role" fullWidth variant="standard" value={role} onChange={handleRoleChange}>
                            <MenuItem value="Administator">Administator</MenuItem>
                            <MenuItem value="Moderator">Moderator</MenuItem>
                            <MenuItem value="Doctor">Doctor</MenuItem>
                            <MenuItem value="Patient">Patient</MenuItem>
                        </Select>
                        <FormHelperText>Select the role for the created user</FormHelperText>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreateUser}>Create new user</Button>
                </DialogActions>
            </Dialog>
        );
    };

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
                        <Button variant="outlined" startIcon={<Add />} color="primary" sx={{ ml: 1, flexShrink: 0 }} onClick={() => {
                            handleClickOpen();
                            createNewUser();
                        }}>
                            New user
                        </Button>
                    </Toolbar>
                </AppBar>
                <DataGrid checkboxSelection
                          columns={columns}
                          rows={users}
                          editMode="row"
                          style={{ border: 0, flexGrow: 1 }} />
                { createNewUser() }
            </Stack>
        </PageWidget>
    );
}));

