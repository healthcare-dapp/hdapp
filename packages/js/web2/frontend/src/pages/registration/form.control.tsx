/* eslint-disable linebreak-style */
import Box from "@mui/material/Box/Box";
import FormControl, { useFormControl } from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import React, { useState } from "react";

export function ValidateName() {
    const [name, setName] = useState("");
    const [label, setLabel] = useState("");
    const [errors, setError] = useState(false);
    const [helper, setHelper] = useState("");

    const changer = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
        if (event.target.value.length === 0) {
            setError(true);
            setHelper("Name cannot be empty");
        } else {
            setError(false);
            setHelper("");
        }
        //console.log(useFormControl()?.filled);

    };

    const { focused } = useFormControl() ?? {};

    const helperText = React.useMemo(() => {
        if (focused) {
            return "a";
        }
        console.log("ds");
        return "b";
    }, [focused]);

    return (
        <Box component="form" noValidate>
            <FormControl>
                <TextField value={name}
                           onChange={changer}
                           error={errors}
                           helperText={helperText}
                           label={label} />
            </FormControl>
        </Box>
    );
}

export function ValidateEmail() {
    const [name, setName] = useState("");
    const [label, setLabel] = useState("");
    const [errors, setError] = useState(false);
    const [helper, setHelper] = useState("");

    const changer = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
        if (event.target.value.length === 0) {
            setError(true);
            setHelper("Name cannot be empty");
        } else {
            setError(false);
            setHelper("");
        }
        //console.log(useFormControl()?.filled);

    };

    const { filled } = useFormControl() ?? {};

    const helperText = React.useMemo(() => {
        if (filled) {
            console.log("it procs");
        }
        console.log("it does not procs");
    }, [filled]);

    return (
        <TextField value={name}
                   onChange={changer}
                   error={errors}
                   helperText={helper}
                   label={label} />
    );
}

// export function ValidatedTextFieldUpdated(handler: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>, labelName: string) {
//     const [name, setName] = useState("");
//     const [label, setLabel] = useState(labelName);
//     const [errors, setError] = useState(false);
//     const [helper, setHelper] = useState("");

//     const changer = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setName(event.target.value);
//         if (event.target.value.length === 0) {
//             setError(true);
//             setHelper("Name cannot be empty");
//         } else {
//             setError(false);
//             setHelper("");
//         }
//         //console.log(useFormControl()?.filled);

//     };

//     const { filled } = useFormControl() ?? {};

//     const helperText = React.useMemo(() => {
//         if (filled) {
//             console.log("it procs");
//         }
//         console.log("it does not procs");
//     }, [filled]);

//     return (
//         <TextField value={name}
//                    onChange={changer}
//                    error={errors}
//                    helperText={helper}
//                    label={label} />
//     );
// }

