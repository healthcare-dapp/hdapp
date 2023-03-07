import { observer } from "mobx-react-lite";
import { forwardRef } from "react";
import { Registration } from "./register.class";
export const RegistrationPage = observer(forwardRef((props, ref) => {
    return (
        <Registration />
    );
}));

