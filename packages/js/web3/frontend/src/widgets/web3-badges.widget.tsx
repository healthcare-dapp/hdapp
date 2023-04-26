import { DoNotDisturbOnOutlined, Verified, PublicOutlined } from "@mui/icons-material";
import { Chip, Stack } from "@mui/material";
import { FC } from "react";

export const Web3Badges: FC<{ size?: "small"; account: { isBanned?: boolean; isDoctor?: boolean; isProfilePublic?: boolean } }> = x => {
    return (
        <Stack direction="row"
               style={{ display: "inline-flex" }}
               spacing={x.size === "small" ? 0.5 : 1}>
            { x.account.isBanned && (
                x.size === "small"
                    ? <span style={{ display: "inline-flex" }} title="Banned"><DoNotDisturbOnOutlined fontSize="small" color="error" /></span>
                    : <Chip color="error" icon={<DoNotDisturbOnOutlined />} label="Banned" size="small" />
            ) }
            { x.account.isDoctor && (
                x.size === "small"
                    ? <span style={{ display: "inline-flex" }} title="Verified Doctor"><Verified fontSize="small" color="success" /></span>
                    : <Chip color="success" icon={<Verified />} label="Verified Doctor" size="small" />
            ) }
            { x.account.isProfilePublic && (
                x.size === "small"
                    ? <span style={{ display: "inline-flex" }} title="Public account"><PublicOutlined fontSize="small" color="primary" /></span>
                    : <Chip color="primary" icon={<PublicOutlined />} label="Public" size="small" />
            ) }
        </Stack>
    );
};
