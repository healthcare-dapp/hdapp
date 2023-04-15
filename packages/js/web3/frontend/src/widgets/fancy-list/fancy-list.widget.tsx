import { alpha, List, styled } from "@mui/material";

export const FancyList = styled(List)(({ theme }) => ({
    padding: "8px 0",
    gap: 8,
    display: "flex",
    flexDirection: "column",
    "& .MuiListItemButton-root": {
        cursor: "pointer",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 12px",
        flex: 0,
        "&:hover": {
            backgroundColor: theme.palette.grey[200]
        },
        "&.Mui-selected": {
            backgroundColor: alpha(theme.palette.primary.main, 0.15),
            "& .MuiTypography-root": {
                color: theme.palette.primary.main,
                fontWeight: 500
            }
        }
    },
    "& .MuiSvgIcon-root": {
        color: theme.palette.primary.main,
        fontSize: 24
    }
}));
