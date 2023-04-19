import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { EventOutlined, AttachFile } from "@mui/icons-material";
import { Stack, Box, Badge, Card, CardActionArea, CardMedia, CardContent, Typography, CircularProgress, Backdrop } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { observer } from "mobx-react-lite";
import { FC, CSSProperties, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { SessionManager, sessionManager } from "../../../managers/session.manager";
import { useDatabase } from "../../../utils/use-database";

const generateGetFileBlobAA = () => new AsyncAction((sm: SessionManager, hash: string) =>
    sm.db.files.getFileBlob(hash, sm.encryption));

export const DataRecordItemWidget: FC<{
    avatar?: string
    avatarColor?: string
    imageHash?: string
    hash?: string
    title?: string
    description?: string
    time?: string
    hasAppointment?: boolean
    itemsCount?: number
    unread?: boolean
}> = observer(x => {
    const getFileBlob = useMemo(generateGetFileBlobAA, []);
    const [imageDataUri, setImageDataUri] = useState<string>();
    const navigate = useNavigate();

    useDatabase(async () => {
        if (x.imageHash) {
            const blob = await getFileBlob.tryRun(sessionManager, x.imageHash);
            blob && setImageDataUri(URL.createObjectURL(blob));
        }
    }, ["file_blobs"], [x.imageHash]);

    return (
        <Grid2 xs={12} sm={6} md={4}>
            <Badge overlap="circular"
                   anchorOrigin={{ vertical: "top", horizontal: "right" }}
                   variant="dot"
                   color={x.unread ? "error" : void 0}
                   sx={{
                       ".MuiBadge-badge": {
                           width: "16px",
                           height: "16px",
                           borderRadius: "8px",
                           top: 4,
                           right: 4
                       },
                       height: "100%",
                       width: "100%",
                   }}>
                <Card variant="outlined" sx={{ height: "100%", width: "100%" }}>
                    <CardActionArea sx={{ height: "100%" }}
                                    onClick={() => navigate("/records/" + x.hash)}>
                        <Stack sx={{ height: "100%" }}>
                            { x.imageHash && (
                                <CardMedia sx={{ height: "200px", zIndex: 1, position: "relative" }} image={imageDataUri}>
                                    { getFileBlob.pending && (
                                        <Backdrop sx={{ position: "absolute" }} open>
                                            <CircularProgress sx={{ color: "white" }} />
                                        </Backdrop>
                                    ) }
                                </CardMedia>
                            ) }
                            <CardContent style={{ padding: 12 }}>
                                <Typography fontSize={14} fontWeight={500} noWrap>{ x.title ?? "prescription" }</Typography>
                                { x.description && (
                                    <Typography fontSize={12}
                                                style={{
                                                    display: "-webkit-box",
                                                    "-webkit-line-clamp": "2",
                                                    overflow: "hidden",
                                                    whiteSpace: "pre-line",
                                                    "-webkit-box-orient": "vertical"
                                                } as CSSProperties}>
                                        <ReactMarkdown>{ x.description }</ReactMarkdown>
                                    </Typography>
                                ) }
                            </CardContent>
                            <Box flexGrow={1} />
                            <Stack direction="row" alignItems="center" color="text.secondary" sx={{ p: 1.5, pt: 0 }}>
                                { x.hasAppointment && <EventOutlined fontSize="small" /> }
                                { !!x.itemsCount && <><AttachFile fontSize="small" /><Typography fontWeight="500" fontSize={12}>+{ x.itemsCount }</Typography></> }
                                <Box flexGrow={1} />
                                { x.time && <Typography fontSize={12}>{ x.time }</Typography> }
                            </Stack>
                        </Stack>
                    </CardActionArea>
                </Card>
            </Badge>
        </Grid2>
    );
});
