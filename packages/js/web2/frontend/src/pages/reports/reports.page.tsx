import { MediaService, UsersService } from "@hdapp/shared/web2-common/api/services";
import { FileDto, UserDto } from "@hdapp/shared/web2-common/dto";
import { ReportDto } from "@hdapp/shared/web2-common/dto/report";
import { Check, Refresh, Search, Tune } from "@mui/icons-material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { AppBar, Avatar, Box, Button, Chip, IconButton, InputAdornment, Stack, TextField, Toolbar, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { forwardRef, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PageWidget } from "../../widgets/page/index";

const approveClick = async (cellValues: GridRenderCellParams) => {
    if (confirm("Are you sure you want to approve this account?")) {
        const data: ReportDto = cellValues.row;
        const b = await UsersService.approveDoctor(data.id.toString());
        console.log(b);
    } else {
        console.log("The doctor is not approved");
    }

};

const rejectClick = async (cellValues: GridRenderCellParams) => {
    console.log("Idk, should we delete account?");
};

const downloadClick = async () => {
    try {
        console.log("Downloading report");
        toast.info("Downloading report", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
        const blob = await MediaService.download("226450929573433344", "ReportFile.pdf");
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "ReportFile.pdf");
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
        field: "user",
        width: 200,
        headerName: "User",
        renderCell(params: GridRenderCellParams<ReportDto[], UserDto | undefined>) {
            return <Chip key={params.value!.id} label={params.value!.full_name} avatar={<Avatar />} />;
        }
    },
    {
        field: "description",
        flex: 1,
        headerName: "Description"
    },
    {
        field: "attachments",
        headerName: "Attachments",
        width: 150,
        renderCell(params: GridRenderCellParams<ReportDto[], FileDto[]>) {
            return (
                <Stack direction="row" spacing={1}>

                    <Button variant="contained" disableElevation size="small" color="primary"
                            startIcon={<FileDownloadIcon />}
                            onClick={() => {
                                downloadClick();
                            }}>Download</Button>
                    { params.value!.map(name => (
                        <Chip key={name.file_name} label={name.file_name} />
                    )) }
                </Stack>
            );
        }
    },
    {
        field: "status",
        width: 150,
        headerName: "Status",
        renderCell(params) {
            return <b>{ params.value }</b>;
        }
    },
    {
        field: "actions",
        headerName: "",
        width: 300,
        renderCell(params) {
            return (
                <Stack direction="row" justifyContent="space-around" style={{ width: "100%" }}
                       onClick={e => e.stopPropagation()}>
                    <Button variant="contained" disableElevation size="small" color="primary"
                            onClick={() => {
                                toast.success("Report is marked as resolved", {
                                    position: "top-right",
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: "light",
                                });
                            }}
                            startIcon={<Check />}>Mark as resolved</Button>
                </Stack>
            );
        }
    },
];

export const ReportsPage = observer(forwardRef((props, ref) => {
    const [reports, setReports] = useState<ReportDto[]>([]);
    useEffect(() => {
        (async () => {
            setReports([
                {
                    id: 1,
                    description: "My first report",
                    attachment_ids: [],
                    attachments: [],
                    status: "Unresolved",
                    user_id: "1",
                    user: {
                        id: 1,
                        full_name: "Alexander Mironov"
                    }
                },
                {
                    id: 2,
                    description: "The report system seems rather buggy, the email won't arrive!",
                    attachment_ids: [],
                    attachments: [],
                    status: "Resolved",
                    user_id: "2",
                    user: {
                        id: 2,
                        full_name: "Doctor X"
                    }
                },
                {
                    id: 3,
                    description: "How do I identify uniquele to my patiens? They seem to confuse me with some other docotors. Are there any features to help?",
                    attachment_ids: [],
                    attachments: [],
                    status: "Resolved",
                    user_id: "3",
                    user: {
                        id: 3,
                        full_name: "Anna Cutemon"
                    }
                }
            ]);
        })();
    }, []);
    return (
        <PageWidget>
            <AppBar variant="outlined" position="static" color="inherit" sx={{ backgroundColor: "#eee", border: 0 }}>
                <Toolbar variant="dense">
                    <Typography variant="h6" color="inherit" component="div">
                        User Reports
                    </Typography>
                    <Box sx={{ flex: 1, ml: 3 }} />
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
                      rows={reports}
                      style={{ border: 0 }} />
        </PageWidget>
    );
}));

