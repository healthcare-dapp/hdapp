import { ArrowBack, Search, Share, TimerOutlined } from "@mui/icons-material";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    TextField,
    Button,
    Stack,
    IconButton,
    useMediaQuery,
    useTheme,
    Typography,
    FormControl,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
} from "@mui/material";
import { FC, useState } from "react";
import { ModalProvider } from "../App2";

export const ShareRecordDialog: FC<{ onClose?(): void }> = x => {
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [note, setNote] = useState("");
    const [query, setQuery] = useState("");
    const [expiryDuration, setExpiryDuration] = useState(60 * 60 * 24);
    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="xs"
                onClose={() => x.onClose?.()} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose?.()}>
                    <ArrowBack />
                </IconButton>
                Share medical record
            </DialogTitle>
            <DialogContent style={{
                margin: "auto",
                flex: "none"
            }}>
                <Stack spacing={2} alignItems="center">
                    <DialogContentText fontSize={14}>
                        Select a user to share your medical record with:
                    </DialogContentText>
                    <TextField margin="dense"
                               placeholder="Search your contacts..."
                               type="password"
                               fullWidth
                               size="small"
                               InputProps={{ startAdornment: <Search fontSize="small" sx={{ color: "text.secondary", marginRight: "10px" }} /> }}
                               variant="outlined"
                               value={query}
                               onChange={e => setQuery(e.target.value)} />
                    <Typography fontSize="14px" align="center" color="text.secondary"
                                style={{ height: 150 }}>
                        You do not have any contacts added.
                    </Typography>
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
                               helperText="You can leave a note for the receipient alongside with your medical record" />
                    <FormControl size="small" fullWidth>
                        <InputLabel id="demo-multiple-chip-label">Expires in</InputLabel>
                        <Select labelId="demo-multiple-chip-label"
                                id="demo-multiple-chip"
                                value={expiryDuration}
                                onChange={e => {
                                    setExpiryDuration(+e.target.value);
                                }}
                                input={<OutlinedInput startAdornment={<TimerOutlined fontSize="small" sx={{ color: "text.secondary", marginRight: "10px" }} />} id="select-multiple-chip" label="Expires in" />}>
                            <MenuItem value={60 * 60 * 24}>
                                1 day
                            </MenuItem>
                            <MenuItem value={60 * 60 * 24 * 3}>
                                3 days
                            </MenuItem>
                            <MenuItem value={60 * 60 * 24 * 7}>
                                1 week
                            </MenuItem>
                            <MenuItem value={60 * 60 * 24 * 7}>
                                1 month
                            </MenuItem>
                            <MenuItem value={Infinity}>
                                Indefinitely
                            </MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" disableElevation
                            onClick={() => x.onClose?.()}
                            startIcon={<Share />}
                            color="success">
                        Share medical record
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
