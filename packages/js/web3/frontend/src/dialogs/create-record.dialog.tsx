import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { Add, ArrowBack } from "@mui/icons-material";
import {
    Dialog,
    DialogTitle,
    Button,
    Stack,
    IconButton,
    Typography,
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
    ThemeProvider,
    Card,
} from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { stateToMarkdown } from "draft-js-export-markdown";
import { observer } from "mobx-react-lite";
import MUIRichTextEditor from "mui-rte";
import { FC, useState } from "react";
import { ModalProvider } from "../App2";
import { SessionManager, sessionManager } from "../managers/session.manager";
import { ProfileEntry } from "../services/profile.service";
import { RecordForm } from "../services/record.service";
import { trimWeb3Address } from "../utils/trim-web3-address";
import { useDatabase } from "../utils/use-database";
import { CreateBlockDialog } from "./create-block.dialog";
import type { EditorState } from "draft-js";

const addRecordAction = new AsyncAction(
    async (sm: SessionManager, form: RecordForm) => {
        const record = await sm.db.records.addRecord(form, sm.encryption);
        if (form.owned_by !== sm.web3.address) {
            await sm.web3.accessControlManager.grantPermissionsFor(
                record.hash,
                sm.web3.address,
                0
            );
        }
        return record;
    }
);

const addRecordStr = "__ADD_RECORD__";

const defaultTheme = createTheme();

Object.assign(defaultTheme, {
    overrides: {
        MUIRichTextEditor: {
            /* container: {
                minHeight: "300px"
            }, */
            root: {
                padding: "0 16px 8px",
                border: "1px solid rgba(0,0,0,0.27)",
                borderRadius: "4px",
            },
            container: {
                position: "relative"
            },
            editor: {
                height: "300px",
                overflow: "auto",
            },
            editorContainer: {
                width: "100%",
                minHeight: "300px",
                cursor: "text"
            },
            toolbar: {
                marginLeft: "-16px",
                marginBottom: "8px"
            }
        }
    }
});

export const CreateRecordDialog: FC<{ forUser?: string; blockId?: string; isDoctor?: boolean; onClose(): void }> = observer(x => {
    const { db, wallet, encryption } = sessionManager;
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("md"));
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [blockIds, setBlockIds] = useState<string[]>(x.blockId ? [x.blockId] : []);
    const [type, setType] = useState("");
    const [isBlockIdSelectorOpen, setIsBlockIdSelectorOpen] = useState(false);
    const [blockEntries, setBlockEntries] = useState<{ key: string; title: string; address: string }[]>([]);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [profile, setProfile] = useState<ProfileEntry>();

    useDatabase(async () => {
        const blks = await db.blocks.getBlocks();

        setBlockEntries(
            blks.filter(b => b.owned_by === (x.forUser ?? wallet.address))
                .map(b => ({ key: b.hash, title: b.friendly_name, address: b.owned_by }))
        );

        if (x.forUser)
            setProfile(await db.profiles.getProfile(x.forUser, encryption).catch(() => undefined));
    }, ["blocks", "profiles"]);

    async function handleRecordCreate() {
        const attachmentIds: string[] = [];
        for (const attachment of attachments) {
            const id = await db.files.uploadFile(
                attachment,
                sessionManager.wallet.address,
                sessionManager.encryption
            );
            attachmentIds.push(id);
        }

        await addRecordAction.run(
            sessionManager,
            {
                title,
                description,
                type,
                block_ids: blockIds,
                created_by: wallet.address,
                owned_by: x.forUser ?? wallet.address,
                attachment_ids: attachmentIds
            }
        );
        x.onClose();
    }

    return (
        <Dialog fullScreen={isMobileView} disablePortal maxWidth="lg" fullWidth onClose={() => x.onClose()}
                scroll={addRecordAction.pending ? "body" : "paper"} {...ModalProvider.modalProps(x)}>
            <DialogTitle align="center">
                <IconButton sx={{ position: "absolute", top: 0, left: 0, m: 1.5 }}
                            onClick={() => x.onClose()}>
                    <ArrowBack />
                </IconButton>
                Create medical record
            </DialogTitle>
            <Stack direction={isMobileView ? "column" : "row"} spacing={2} sx={{ px: 2, pb: 2 }}>
                <Stack spacing={2} sx={{ flexGrow: 1 }}>
                    { x.forUser && (
                        <TextField variant="outlined" label="Patient" disabled
                                   value={profile?.full_name ?? trimWeb3Address(x.forUser)} />
                    ) }
                    <TextField required variant="outlined" label="Title"
                               value={title} onChange={e => setTitle(e.target.value)} />
                    <ThemeProvider theme={defaultTheme}>
                        <MUIRichTextEditor defaultValue=""
                                           label="Description"
                                           controls={["bold", "italic", "underline", "strikethrough", "highlight", "undo", "redo", "link", "numberList", "bulletList", "quote", "code"]}
                                           onChange={(event: EditorState) => {
                                               setDescription(stateToMarkdown(event.getCurrentContent()));
                                           }} />
                    </ThemeProvider>
                </Stack>
                <Stack spacing={2}>
                    <FormControl size="small">
                        <InputLabel id="demo-multiple-chip-label">Blocks</InputLabel>
                        <Select labelId="demo-multiple-chip-label"
                                id="demo-multiple-chip"
                                multiple
                                open={isBlockIdSelectorOpen}
                                onClose={() => setIsBlockIdSelectorOpen(false)}
                                onOpen={() => setIsBlockIdSelectorOpen(true)}
                                value={blockIds}
                                onChange={async e => {
                                    const value = typeof e.target.value === "string"
                                        ? e.target.value.split(",")
                                        : e.target.value;

                                    if (value.includes(addRecordStr)) {
                                        setIsBlockIdSelectorOpen(false);
                                        const block = await ModalProvider.show(CreateBlockDialog, { forUser: x.forUser });
                                        if (!block)
                                            return;
                                        setBlockIds(ids => [...ids, block.hash]);
                                        return;
                                    }

                                    setBlockIds(value);
                                }}
                                input={<OutlinedInput id="select-multiple-chip" label="Blocks" />}
                                renderValue={selectedId => (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                        { selectedId.map(id => (
                                            <Chip key={id} label={blockEntries.find(e => e.key === id)?.title ?? ""} />
                                        )) }
                                    </Box>
                                )}>
                            { [...blockEntries, { key: addRecordStr, title: "Add new block", address: "" }].map(blk => (
                                <MenuItem key={blk.key}
                                          value={blk.key}>
                                    <Stack alignItems="center" direction="row" spacing={1}>
                                        { (blk.title === "Add new block") && <Add fontSize="small" /> }
                                        <span>{ blk.title }</span>
                                        { blk.address && blk.address !== wallet.address && (
                                            <span style={{ color: theme.palette.text.secondary }}>
                                                ({ trimWeb3Address(blk.address) })
                                            </span>
                                        ) }
                                    </Stack>
                                </MenuItem>
                            )) }
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <InputLabel id="demo-simple-select-label">Record type</InputLabel>
                        <Select labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={type}
                                label="Record type"
                                onChange={e => setType(e.target.value)}>
                            <MenuItem value={10}>Prescription</MenuItem>
                            <MenuItem value={20}>Legal paper</MenuItem>
                            <MenuItem value={30}>Other</MenuItem>
                        </Select>
                    </FormControl>
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
                        <Button color="error" onClick={() => x.onClose()}>Discard changes</Button>
                        <Button variant="contained" disableElevation startIcon={<Add />}
                                onClick={handleRecordCreate}>Create record</Button>
                    </Stack>
                </Stack>
            </Stack>
            { addRecordAction.pending && (
                <Backdrop sx={{ position: "absolute" }} open>
                    <CircularProgress />
                </Backdrop>
            ) }
        </Dialog>
    );
});
