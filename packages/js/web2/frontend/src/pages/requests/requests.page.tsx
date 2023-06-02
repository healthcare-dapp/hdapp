import { MediaService, UsersService } from "@hdapp/shared/web2-common/api/services";
import { FileDto } from "@hdapp/shared/web2-common/dto";
import { UserDto } from "@hdapp/shared/web2-common/dto/user.dto";
import { Check, Refresh, Search, Tune } from "@mui/icons-material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { AppBar, Box, Button, Chip, IconButton, InputAdornment, Stack, TextField, Toolbar, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { forwardRef, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PageWidget } from "../../widgets/page";

const approveClick = async (cellValues: GridRenderCellParams) => {
    if (confirm("Are you sure you want to approve this account?")) {
        const data: UserDto = cellValues.row;
        const b = await UsersService.approveDoctor(data.id.toString());
        toast.success("Doctor was approved!", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
        console.log(b);
    } else {
        console.log("The doctor was not approved");
    }
};

const rejectClick = async (cellValues: GridRenderCellParams) => {
    console.log("Idk, should we delete account?");
    toast.error("Doctor was rejected!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
    });
};

const downloadClick = async (cellValues: FileDto) => {
    try {
        console.log("Downloading file");
        toast.info("Downloading file " + cellValues.file_name, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
        console.log(cellValues.file_name);
        const blob = await MediaService.download(cellValues.id, cellValues.file_name);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", cellValues.file_name);
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        link.setAttribute("directory", "");
        document.body.appendChild(link);
        link.click();

    } catch (e) {
        console.error("Error downloading file: ", e);
    }
};
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
        renderCell(params: GridRenderCellParams<UserDto, FileDto[]>) {
            return (
                <Stack direction="row" spacing={1}>

                    <Button variant="contained" disableElevation size="small" color="primary"
                            startIcon={<FileDownloadIcon />}
                            onClick={() => {
                                console.log(params);
                                if (confirm("Download files from this user?")) {
                                    console.log("Downloading files");
                                    console.log(params.value);
                                    for (const file of params.value!) {
                                        downloadClick(file).catch(e =>
                                            console.log(e));

                                    }
                                } else {
                                    console.log("Download cancelled");
                                }
                            }}>Download</Button>
                    { params.value!.map(file => (
                        <Chip key={file.file_name} label={file.file_name} />
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
                    <Button variant="outlined" size="small" color="error" onClick={() => {
                        rejectClick(params);
                    }}>Reject</Button>
                    <Button variant="contained" disableElevation size="small" color="success"
                            startIcon={<Check />}
                            onClick={() => {
                                approveClick(params);
                            }}>Approve</Button>
                </Stack>
            );
        }
    },
];

export const RequestsPage = observer(forwardRef((props, ref) => {
    const [requests, setRequests] = useState<UserDto[]>([]);
    useEffect(() => {
        (async () => {
            const response = await UsersService.findPaged({ has_doctor_capabilities: true, has_web3_address: false });
            setRequests(response.items);
            console.log(response.items);
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

