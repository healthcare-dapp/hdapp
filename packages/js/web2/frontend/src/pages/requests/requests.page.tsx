import { UsersService } from "@hdapp/shared/web2-common/api/services";
import { UserDto } from "@hdapp/shared/web2-common/dto/user.dto";
import { Check, Refresh, Search, Tune } from "@mui/icons-material";
import { AppBar, Box, Button, Chip, IconButton, InputAdornment, Stack, TextField, Toolbar, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { forwardRef, useEffect, useState } from "react";
import { PageWidget } from "../../widgets/page";

const columns: GridColDef[] = [
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
        field: "medical_organization_name",
        width: 220,
        headerName: "Medical Organization"
    },
    {
        field: "confirmation_documents",
        headerName: "Confirmation Documents",
        flex: 1,
        renderCell(params) {
            return (
                <Stack direction="row" spacing={1}>
                    { params.value.map((id: string) => (
                        <Chip key={id} label={id} />
                    )) }
                </Stack>
            );
        }
    },
    {
        field: "actions",
        headerName: "",
        width: 220,
        renderCell(params) {
            return (
                <Stack direction="row" justifyContent="space-around" style={{ width: "100%" }}
                       onClick={e => e.stopPropagation()}>
                    <Button variant="outlined" size="small" color="error">Reject</Button>
                    <Button variant="contained" disableElevation size="small" color="success"
                            startIcon={<Check />}>Approve</Button>
                </Stack>
            );
        }
    },
];

export const RequestsPage = observer(forwardRef((props, ref) => {
    const [requests, setRequests] = useState<UserDto[]>([]);
    useEffect(() => {
        (async () => {
            const response = await UsersService.findPaged({ has_web3_address: false, has_doctor_capabilities: true, is_banned: false });
            setRequests(response.items);
        })();
    }, []);
    return (
        <PageWidget>
            <AppBar variant="outlined" position="static" color="inherit" sx={{ backgroundColor: "#eee", border: 0 }}>
                <Toolbar variant="dense">
                    <Typography variant="h6" color="inherit" component="div">
                        Registration requests
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
                    <Box sx={{ flex: 1 }} />
                    <IconButton color="inherit" sx={{ ml: 1 }}>
                        <Tune />
                    </IconButton>
                    <IconButton color="inherit">
                        <Refresh />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <DataGrid checkboxSelection
                      columns={columns}
                      rows={requests}
                      style={{ border: 0 }} />
        </PageWidget>
    );
}));

