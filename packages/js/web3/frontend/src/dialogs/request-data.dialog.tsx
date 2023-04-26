import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { Add, ArrowBack, Share } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    TextField,
    Stack,
    IconButton,
    useMediaQuery,
    useTheme,
    FormControl,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    Box,
    Backdrop,
    CircularProgress,
    Chip,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ModalProvider } from "../App2";
import { SessionManager, sessionManager } from "../managers/session.manager";

const performRequestAction = new AsyncAction(async (
    sm: SessionManager,
    address: string,
    metaTagIds: string[],
    note: string
) => {
    const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify({ metaTagIds, note }),
        sm.device.private_key
    ).toString(CryptoJS.format.Hex);

    await sm.web3.accessControlManager.requestPermissions(
        address,
        "0x" + encrypted
    );
});

export const RequestDataDialog = observer<{ address: string; onClose?(): void }>(x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [note, setNote] = useState("");
    const [metaTagIds, setMetaTagIds] = useState<string[]>([]);

    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="xs" fullWidth
                onClose={() => x.onClose?.()} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose?.()}>
                    <ArrowBack />
                </IconButton>
                Request medical data
                <DialogContentText fontSize={14}>
                    Specify what kind of medical data is required
                </DialogContentText>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} alignItems="center" style={{ height: "100%" }}>
                    <FormControl fullWidth size="small">
                        <InputLabel id="demo-multiple-chip-label">Category</InputLabel>
                        <Select labelId="demo-multiple-chip-label"
                                id="demo-multiple-chip"
                                multiple
                                value={metaTagIds}
                                onChange={e => setMetaTagIds(e.target.value.toString().split(","))}
                                input={<OutlinedInput id="select-multiple-chip" label="Category" />}
                                renderValue={selected => (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                        { selected.map(value => (
                                            <Chip key={value} label={value} />
                                        )) }
                                    </Box>
                                )}>
                            { ["Infections", "X-Rays", "Fitness"].map(metaTagId => (
                                <MenuItem key={metaTagId}
                                          value={metaTagId}>
                                    <Stack alignItems="center" direction="row" spacing={1}>
                                        { metaTagId.includes("Add") && <Add fontSize="small" /> }
                                        <span>{ metaTagId }</span>
                                    </Stack>
                                </MenuItem>
                            )) }
                        </Select>
                    </FormControl>
                    <TextField autoFocus
                               margin="dense"
                               label="Additional note"
                               type="password"
                               fullWidth
                               multiline
                               minRows={2}
                               variant="outlined"
                               value={note}
                               size="small"
                               onChange={e => setNote(e.target.value)}
                               helperText="Note about this medical record" />
                    <LoadingButton variant="contained" disableElevation
                                   onClick={async () => {
                                       await performRequestAction.run(
                                           sessionManager,
                                           x.address,
                                           metaTagIds,
                                           note,
                                       );
                                       x.onClose?.();
                                   }}
                                   disabled={!metaTagIds.length && !note}
                                   startIcon={<Share />}
                                   loading={performRequestAction.pending}
                                   color="success">
                        Request data
                    </LoadingButton>
                </Stack>
            </DialogContent>
            <Backdrop sx={{ color: "#fff", zIndex: theme.zIndex.drawer + 1 }}
                      open={performRequestAction.pending}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Dialog>
    );
});
