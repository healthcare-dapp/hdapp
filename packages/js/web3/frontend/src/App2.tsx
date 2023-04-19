import { CircularProgress, Stack, Theme, useTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { FC, ReactElement, useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { SendConnectionConfirmationDialog } from "./dialogs/send-connection-confirmation.dialog";
import { WaitingForConnectionDialog } from "./dialogs/waiting-for-connection.dialog";
import { sessionManager } from "./managers/session.manager";
import { walletManager } from "./managers/wallet.manager";
import { LockScreenPage } from "./pages/lock-screen";
import { SignInPage } from "./pages/sign-in";
import { router } from "./router";
import { sharedDbService } from "./services/db.service";

type ModalPropsInternal = {
    __modalId: string
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ModalProps<R = any> {
    onClose?(r?: R): void
}

export const ModalProvider = new (class {
    private _modals = new Map<string, ReactElement>();
    private _aboutToCloseModals: string[] = [];
    private _theme: Theme | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    setTheme(theme: Theme) {
        this._theme = theme;
    }

    show<P extends ModalProps>(Component2: FC<P>, props?: Omit<P, "onClose">): Promise<Parameters<NonNullable<P["onClose"]>>[0]> {
        const id = Date.now().toString();
        return new Promise(resolve => {
            this._modals.set(
                id,
                // @ts-ignore
                <Component2 {...props} key={id} __modalId={id} onClose={r => {
                    runInAction(() => {
                        this._aboutToCloseModals.push(id);
                    });
                    setTimeout(() => {
                        runInAction(() => {
                            this._modals.delete(id);
                        });
                    }, this._theme!.transitions.duration.leavingScreen);
                    resolve(r);
                }} />
            );
        });
    }

    get modals() {
        return [...this._modals.values()];
    }

    modalProps(props: Record<string, unknown>) {
        return {
            open: !this._aboutToCloseModals.includes((props as ModalPropsInternal).__modalId)
        };
    }
})();

export const AppRoot = observer(function App() {
    const [isDbLoading, setIsDbLoading] = useState(!sharedDbService.isInitialized);
    const hasWalletsListEverLoaded = !!walletManager.load.result || !!walletManager.load.error;
    const isWalletsListLoading = walletManager.load.pending;
    const hasWallets = walletManager.list.length;
    const theme = useTheme();

    ModalProvider.setTheme(theme);

    useEffect(() => {
        setIsDbLoading(!sharedDbService.isInitialized);
        sharedDbService.on("ready", () => setIsDbLoading(false));
    }, []);

    useEffect(() => {
        (async () => {
            if (!sessionManager.isSignedIn)
                return;

            const url = new URL(location.href);
            const address = url.searchParams.get("connect");
            const key = url.searchParams.get("key");
            if (!address || !key)
                return;

            url.search = "";
            history.replaceState("", "", url);

            const isConfirmed = await ModalProvider.show(SendConnectionConfirmationDialog, {
                address
            });

            if (!isConfirmed)
                return;

            await sessionManager.accessControl.requestUserConnection
                .run(address, key);

            await ModalProvider.show(WaitingForConnectionDialog, {});
        })();
    }, [sessionManager.isSignedIn]);

    if (isDbLoading || !hasWalletsListEverLoaded)
        return (
            <Stack alignItems="center" justifyContent="center" style={{ height: "100vh" }}>
                <CircularProgress />
            </Stack>
        );

    if (!hasWallets && !isWalletsListLoading)
        return <SignInPage />;

    if (!sessionManager.isSignedIn)
        return <LockScreenPage />;

    return (
        <RouterProvider router={router} />
    );
});

export const App2 = observer(function App() {
    const [elements, setElements] = useState<ReactElement[]>([]);
    const { modals } = ModalProvider;
    useEffect(() => {
        const missingElements = modals
            .filter(m => elements.every(e => e.props.__modalId !== m.props.__modalId))
            .map(e => toJS(e));
        const spareElements = elements
            .filter(m => modals.every(e => e.props.__modalId !== m.props.__modalId));

        setElements([
            ...elements.filter(e => !spareElements.includes(e)),
            ...missingElements
        ]);
    }, [modals]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AppRoot />
            { elements }
        </LocalizationProvider>
    );
});
