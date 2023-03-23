import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { Add, ArrowBack } from "@mui/icons-material";
import {
    Dialog,
    DialogTitle,
    Button,
    Stack,
    IconButton,
    Box,
    useMediaQuery,
    useTheme,
    TextField,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    Backdrop,
    CircularProgress,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
import { ModalProvider } from "../App2";
import { sessionManager } from "../managers/session.manager";
import { BlockEntry, BlockForm, blockService } from "../services/block.service";

const addBlockAction = new AsyncAction((form: BlockForm) => blockService.addBlock(form));

export const CreateBlockDialog: FC<{ isDoctor?: boolean; onClose?(block?: BlockEntry): void }> = observer(x => {
    const { wallet } = sessionManager;
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [name, setName] = useState("");
    const [metaTagIds, setMetaTagIds] = useState<string[]>([]);

    async function handleCreateBlock() {
        const block = await addBlockAction.run({
            friendly_name: name,
            meta_tag_ids: metaTagIds,
            created_by: wallet.address,
            owned_by: wallet.address
        });
        x.onClose?.(block);
    }

    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="sm" fullWidth onClose={() => x.onClose?.()}
                scroll={addBlockAction.pending ? "body" : "paper"} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose?.()}>
                    <ArrowBack />
                </IconButton>
                Create medical record block
            </DialogTitle>
            <Stack spacing={2} sx={{ p: 2, pt: 0 }}>
                <TextField required variant="outlined" label="Name"
                           value={name} onChange={e => setName(e.target.value)} />
                <FormControl size="small">
                    <InputLabel id="demo-multiple-chip-label">Medical Data Types</InputLabel>
                    <Select labelId="demo-multiple-chip-label"
                            id="demo-multiple-chip"
                            multiple
                            value={metaTagIds}
                            onChange={e => setMetaTagIds(e.target.value.toString().split(","))}
                            input={<OutlinedInput id="select-multiple-chip" label="Medical Data Types" />}
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
                <Stack spacing={1} direction="row">
                    <Box flexGrow={1} />
                    <Button color="error">Discard changes</Button>
                    <Button variant="contained" disableElevation startIcon={<Add />}
                            onClick={handleCreateBlock}>Create block</Button>
                </Stack>
            </Stack>
            { addBlockAction.pending && (
                <Backdrop sx={{ position: "absolute" }} open>
                    <CircularProgress />
                </Backdrop>
            ) }
        </Dialog>
    );
});
