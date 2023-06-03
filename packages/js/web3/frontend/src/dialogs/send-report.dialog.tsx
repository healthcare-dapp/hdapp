import { MediaService, ReportService } from "@hdapp/shared/web2-common/api/services";
import { CreateReportDto, SendReportDto } from "@hdapp/shared/web2-common/dto/report";
import { Web3Address } from "@hdapp/shared/web2-common/types/web3-address.type";
import { Instant } from "@js-joda/core";
import { Add, ArrowBack, Send } from "@mui/icons-material";
import {
    Dialog,
    DialogTitle,
    Button,
    Stack,
    IconButton,
    Typography,
    useMediaQuery,
    useTheme,
    TextField,
    Chip,
    Card,
} from "@mui/material";
import { Signer } from "ethers";
import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import { ModalProvider } from "../App2";
import { sessionManager } from "../managers/session.manager";
import { ProfileEntry } from "../services/profile.service";
import { useDatabase } from "../utils/use-database";

const uploadFiles = async (attachments: File[]) => {
    try {
        const formData = new FormData();
        attachments.forEach(file => formData.append("files", file));
        const files = await MediaService.upload(formData);
        alert("Files are succesfully uploaded");
        return files.map(file => file.id);
    } catch (e) {
        console.error("Upload Exception:", e);
    }
    return [];
};

const sendReport = async (
    profile: ProfileEntry | undefined,
    description: string,
    attachments: File[],
    signer: Signer
) => {
    try {
        const fileIDs = await uploadFiles(attachments);
        const cr: CreateReportDto = {
            description: description,
            attachment_ids: fileIDs
        };
        toast.success("Files are successfully uploaded", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
        const message = JSON.stringify({ timestamp: Instant.now().toString() });

        const data: SendReportDto = {
            address: profile?.address as Web3Address,
            message: message,
            signed: await signer.signMessage(message),
            report: cr
        };
        await ReportService.fileNewReport(data, profile?.address);
        toast.success("Report has been sent", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
    } catch (e) {
        toast.error("An error occured when sending a report", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
    }
};

export const SendReportDialog: FC<{ onClose(): void }> = observer(x => {
    const { db, encryption, wallet, web3 } = sessionManager;
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [description, setDescription] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [profile, setProfile] = useState<ProfileEntry>();

    useDatabase(async () => {
        setProfile(await db.profiles.getProfile(wallet.address, encryption).catch(() => undefined));
    }, ["profiles"]);

    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="sm" fullWidth
                onClose={() => x.onClose()} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose()}>
                    <ArrowBack />
                </IconButton>
                Send a report
            </DialogTitle>
            <Stack spacing={2} sx={{ px: 2, pb: 2 }}>
                { profile && (
                    <TextField variant="outlined" label="Report sender" disabled
                               value={profile?.full_name} />
                ) }
                <TextField multiline minRows={3} required variant="outlined" label="Description"
                           value={description} onChange={e => setDescription(e.target.value)} />
                <Card variant="outlined" sx={{ pr: 2, py: 2, paddingLeft: "14px" }}>
                    <Stack spacing={1}>
                        <Typography fontWeight="500">Attachments</Typography>
                        <div style={{ width: 0, minWidth: "100%" }}>
                            { attachments.map((file, index) => (
                                <Chip variant="outlined"
                                      key={index}
                                      onDelete={() => {
                                          setAttachments(attachments.filter(a => a !== file));
                                      }}
                                      label={file.name} />
                            )) }
                        </div>
                        <div style={{ position: "relative" }}>
                            <Button variant="outlined" startIcon={<Add />}>
                                Select file...
                            </Button>
                            <input type="file" style={{ opacity: 0, position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                                   onChange={e => setAttachments(a => [...a, ...e.target.files! as unknown as File[]])} />
                        </div>
                    </Stack>
                </Card>
                <Stack spacing={1} justifyContent="center" direction="row">
                    <Button color="error" onClick={() => x.onClose()}>Discard</Button>
                    <Button variant="contained" color="error" disableElevation startIcon={<Send />}
                            onClick={async () => {
                                await sendReport(profile, description, attachments, web3.signer);
                                x.onClose();
                            }}>Send report</Button>
                </Stack>
            </Stack>
        </Dialog>
    );
});
