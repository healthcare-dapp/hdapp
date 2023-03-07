import { observer } from "mobx-react-lite";
import { forwardRef } from "react";
import { AdminLogin } from "./login.functions";

export const LoginPage = observer(forwardRef((props, ref) => {
    return (
        <AdminLogin />
    );
}));

