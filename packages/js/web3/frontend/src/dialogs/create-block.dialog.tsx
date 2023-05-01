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
import { SessionManager, sessionManager } from "../managers/session.manager";
import { BlockEntry, BlockForm } from "../services/block.service";
import { ProfileEntry } from "../services/profile.service";
import { trimWeb3Address } from "../utils/trim-web3-address";
import { useDatabase } from "../utils/use-database";

const upsertBlockAction = new AsyncAction(async (sm: SessionManager, form: BlockForm, blockHash?: string) => {
    const entry = await (async () => {
        if (blockHash) {
            await sm.db.blocks.patchBlock(blockHash, form);
            return await sm.db.blocks.getBlock(blockHash);
        }
        return await sm.db.blocks.addBlock(form);
    })();

    if (form.owned_by !== sm.web3.address) {
        await sm.web3.accessControlManager.grantPermissionsFor(
            entry.hash,
            sm.web3.address,
            0
        );
    }

    return entry;
});

export const CreateBlockDialog: FC<{ blockHash?: string; forUser?: string; isDoctor?: boolean; onClose?(block?: BlockEntry): void }> = observer(x => {
    const { db, encryption, wallet } = sessionManager;
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [name, setName] = useState("");
    const [metaTagIds, setMetaTagIds] = useState<string[]>([]);
    const [profile, setProfile] = useState<ProfileEntry>();

    useDatabase(async () => {
        if (x.forUser)
            setProfile(await db.profiles.getProfile(x.forUser, encryption).catch(() => undefined));

        if (!x.blockHash)
            return;
        const blockEntity = await db.blocks.getBlock(x.blockHash);
        setName(blockEntity.friendly_name);
        setMetaTagIds(blockEntity.meta_tag_ids);
    }, ["blocks", "profiles"], [x.blockHash, x.forUser]);

    async function handleCreateBlock() {
        const block = await upsertBlockAction.run(
            sessionManager,
            {
                friendly_name: name,
                meta_tag_ids: metaTagIds,
                created_by: wallet.address,
                owned_by: x.forUser ?? wallet.address
            },
            x.blockHash
        );
        x.onClose?.(block);
    }

    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="sm" fullWidth onClose={() => x.onClose?.()}
                scroll={upsertBlockAction.pending ? "body" : "paper"} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose?.()}>
                    <ArrowBack />
                </IconButton>
                { x.blockHash ? "Update" : "Create" } medical record block
            </DialogTitle>
            <Stack spacing={2} sx={{ p: 2, pt: 0 }}>
                { x.forUser && (
                    <TextField variant="outlined" label="Patient" disabled
                               value={profile?.full_name ?? trimWeb3Address(x.forUser)} />
                ) }
                <TextField required variant="outlined" label="Name"
                           value={name} onChange={e => setName(e.target.value)} />
                <FormControl size="small">
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
                <Stack spacing={1} direction="row">
                    <Box flexGrow={1} />
                    <Button color="error" onClick={() => x.onClose?.()}>Discard changes</Button>
                    <Button variant="contained" disableElevation startIcon={<Add />}
                            onClick={handleCreateBlock}>{ x.blockHash ? "Update" : "Create" } block</Button>
                </Stack>
            </Stack>
            { upsertBlockAction.pending && (
                <Backdrop sx={{ position: "absolute" }} open>
                    <CircularProgress />
                </Backdrop>
            ) }
        </Dialog>
    );
});
