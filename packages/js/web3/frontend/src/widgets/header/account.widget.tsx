import { PersonAdd, Smartphone, Settings, Logout } from "@mui/icons-material";
import { Chip, Avatar, Divider, ListItemIcon, Menu, MenuItem, MenuList, Stack, Typography, useTheme, useMediaQuery, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import makeBlockie from "ethereum-blockies-base64";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { sessionManager } from "../../managers/session.manager";
import { walletManager } from "../../managers/wallet.manager";
import { trimWeb3Address } from "../../utils/trim-web3-address";

export const HeaderAccountWidget = observer(() => {
    const { wallet } = sessionManager;
    const [accountMenu, setAccountMenu] = useState<null | HTMLElement>(null);
    const open = Boolean(accountMenu);
    const theme = useTheme();
    const isBigEnough = useMediaQuery(theme.breakpoints.up("sm"));

    const [openModal, setOpenModal] = useState(false);

    if (!wallet)
        return null;

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAccountMenu(event.currentTarget);
    };

    const handleClose = () => {
        setAccountMenu(null);
    };

    return (
        <>
            { isBigEnough ? (
                <Chip avatar={<Avatar src={makeBlockie(wallet.address)} />}
                      label={trimWeb3Address(wallet.address)}
                      sx={{ fontWeight: 500 }}
                      onClick={handleClick}
                      aria-controls={open ? "account-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? "true" : undefined} />
            )
                : (
                    <Avatar src={makeBlockie(wallet.address)}
                            onClick={handleClick}
                            aria-controls={open ? "account-menu" : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? "true" : undefined} />
                ) }
            <Menu anchorEl={accountMenu}
                  id="account-menu"
                  open={open}
                  onClose={handleClose}
                  onClick={handleClose}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  sx={{ p: 0 }}>
                <MenuList dense sx={{ p: 0, minWidth: 250 }}>
                    <MenuItem disabled>
                        <Typography variant="subtitle2">Connected accounts</Typography>
                    </MenuItem>
                    { walletManager.list.map(w => (
                        <MenuItem key={w.address} onClick={handleClose}>
                            <Stack direction="row" alignItems="center" spacing={2}
                                   style={{ width: "100%" }}>
                                <Avatar src={makeBlockie(w.address)} sx={{ width: 20, height: 20 }} />
                                <Stack spacing={-1} style={{ flex: 1 }}>
                                    <Typography variant="subtitle2">{ w.user.full_name }</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 400 }}>{ trimWeb3Address(w.address) }</Typography>
                                </Stack>
                                { w.address === wallet.address && (
                                    <span style={{
                                        backgroundColor: useTheme().palette.success.main,
                                        width: 8,
                                        height: 8,
                                        borderRadius: 100
                                    }} />
                                ) }
                            </Stack>
                        </MenuItem>
                    )) }

                    <MenuItem onClick={handleClose}>
                        <ListItemIcon>
                            <PersonAdd fontSize="small" />
                        </ListItemIcon>
                        Add another account
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleClose}>
                        <ListItemIcon>
                            <Smartphone fontSize="small" />
                        </ListItemIcon>
                        Pair another device
                    </MenuItem>
                    <MenuItem onClick={handleClose}>
                        <ListItemIcon>
                            <Settings fontSize="small" />
                        </ListItemIcon>
                        Settings
                    </MenuItem>
                    <MenuItem onClick={() => {
                        setOpenModal(true);
                        handleClose();
                    }}>
                        <ListItemIcon>
                            <Logout fontSize="small" />
                        </ListItemIcon>
                        Sign out
                    </MenuItem>
                </MenuList>
            </Menu>
            <Dialog open={openModal}
                    onClose={() => setOpenModal(false)}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description">
                <DialogTitle id="alert-dialog-title">
                    Are you sure you would like to sign out?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        You will need to pair this device again next time you log in.
                        <br />
                        <b>Be careful!</b> If this is your only active device, you will <b>lose access to your medical data forever</b>!
                    </DialogContentText>
                </DialogContent>
                <DialogActions disableSpacing sx={{ flexDirection: isBigEnough ? "row" : "column", gap: "8px" }}>
                    <Button color="error">I'm aware, please sign out</Button>
                    <Button onClick={() => setOpenModal(false)} variant="contained" disableElevation autoFocus>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
});
