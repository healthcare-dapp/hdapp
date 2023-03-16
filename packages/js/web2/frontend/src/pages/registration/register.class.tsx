import { AuthService, MediaService } from "@hdapp/shared/web2-common/api/services";
import { CreateUserDto } from "@hdapp/shared/web2-common/dto/user.dto";
import { EmailAddress } from "@hdapp/shared/web2-common/types/email-address.type";
import { IllegalArgumentException } from "@js-joda/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Link from "@mui/material/Link";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Stack } from "@mui/system";
import { DatePicker } from "@mui/x-date-pickers";
import { format } from "date-fns";
import React, { ChangeEvent, FormEvent } from "react";
import FileUpload from "react-mui-fileuploader";
import { ExtendedFileProps } from "react-mui-fileuploader/dist/types/index.types";
import { Logo } from "../../widgets/sidebar";

export class Registration extends React.Component<{}, {
    email: string
    fullName: string
    date: Date | null
    isDoctor: boolean
    uploadedFiles: ExtendedFileProps[]
    fileIDs: string[]
    isBusy: boolean
    isAgreed: boolean
    nameValue: string
    nameError: boolean
    nameHelper: string
    mailValue: string
    mailError: boolean
    mailHelper: string
    medicalNameValue: string
    medicalNameError: boolean
    medicalNameHelper: string
    adressValue: string
    adressError: boolean
    adressHelper: string
    specialtyValue: string
    specialtyError: boolean
    specialtyHelper: string
    canSubmit: boolean
    isSubmitted: boolean
}> {
    constructor() {
        super({});
        this.state = {
            email: " ",
            fullName: " ",
            date: null,
            isDoctor: false,
            uploadedFiles: [],
            fileIDs: [],
            isBusy: false,
            isAgreed: false,
            nameValue: " ",
            nameError: false,
            nameHelper: " ",
            mailValue: " ",
            mailError: false,
            mailHelper: " ",
            medicalNameValue: " ",
            medicalNameError: false,
            medicalNameHelper: " ",
            adressValue: " ",
            adressError: false,
            adressHelper: " ",
            specialtyValue: " ",
            specialtyError: false,
            specialtyHelper: " ",
            canSubmit: false,
            isSubmitted: false
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.switchToDoctor = this.switchToDoctor.bind(this);
        this.updateFiles = this.updateFiles.bind(this);
        this.uploadFiles = this.uploadFiles.bind(this);
        this.uploadRender = this.uploadRender.bind(this);
        this.updateCheckbox = this.updateCheckbox.bind(this);
        this.validateName = this.validateName.bind(this);
        this.validateMail = this.validateMail.bind(this);
        this.validateMedicalName = this.validateMedicalName.bind(this);
        this.validateAdress = this.validateAdress.bind(this);
        this.validateSpecialty = this.validateSpecialty.bind(this);
        this.fieldCheck = this.fieldCheck.bind(this);
    }

    link1 = <a href="#">Privacy Policy</a>;
    link2 = <a href="#">Terms of Service</a>;

    updateFiles(files: ExtendedFileProps[]) {
        this.setState({
            uploadedFiles: files
        });
    }

    updateCheckbox(event: ChangeEvent, check: boolean) {
        this.setState({
            isAgreed: check
        });
    }

    async validateName(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.value.trim().length === 0)
            await this.setState({
                nameError: true,
                nameValue: event.target.value,
                nameHelper: "Name cannot be empty"
            });
        else
            await this.setState({
                nameError: false,
                nameValue: event.target.value,
                nameHelper: ""
            });
        await this.fieldCheck();
    }

    async validateMail(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.value.trim().length === 0)
            await this.setState({
                mailError: true,
                mailValue: event.target.value,
                mailHelper: "Email cannot be empty"
            });
        else if (!event.target.value.toLocaleLowerCase().match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
            await this.setState({
                mailError: true,
                mailValue: event.target.value,
                mailHelper: "Invalid Email"
            });
        else
            await this.setState({
                mailError: false,
                mailValue: event.target.value,
                mailHelper: ""
            });
        await this.fieldCheck();
    }

    async validateAdress(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.value.trim().length === 0)
            await this.setState({
                adressError: true,
                adressValue: event.target.value,
                adressHelper: "This field cannot be empty"
            });
        else
            await this.setState({
                adressError: false,
                adressValue: event.target.value,
                adressHelper: ""
            });
        await this.fieldCheck();
    }

    async validateMedicalName(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.value.trim().length === 0)
            await this.setState({
                medicalNameError: true,
                medicalNameValue: event.target.value,
                medicalNameHelper: "This field cannot be empty"
            });
        else
            await this.setState({
                medicalNameError: false,
                medicalNameValue: event.target.value,
                medicalNameHelper: ""
            });
        await this.fieldCheck();
    }

    async validateSpecialty(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.value.trim().length === 0)
            await this.setState({
                specialtyError: true,
                specialtyValue: event.target.value,
                specialtyHelper: "This field cannot be empty"
            });
        else
            await this.setState({
                specialtyError: false,
                specialtyValue: event.target.value,
                specialtyHelper: ""
            });
        await this.fieldCheck();
    }

    async fieldCheck() {
        if (this.state.isDoctor)
            this.setState({ canSubmit: (this.state.date !== null && !this.state.nameError && !this.state.mailError && !this.state.medicalNameError && !this.state.adressError && !this.state.specialtyError) });
        else
            this.setState({ canSubmit: (this.state.date !== null && !this.state.nameError && !this.state.mailError) });
        console.log(this.state.canSubmit);
    }

    uploadRender() {
        return (
            <>
                <FileUpload multiFile={true}
                            onFilesChange={this.updateFiles}
                            maxUploadFiles={10}
                            allowedExtensions={["jpg", "jpeg", "pdf"]}
                            onContextReady={context => {}}
                            showPlaceholderImage={false}
                            title="Upload your medical documents" />
                <Button onClick={this.uploadFiles} variant="contained" id="uploadButton">
                    Upload
                </Button>

            </>
        );
    }

    async uploadFiles() {
        try {
            if (!this.state.isBusy) {
                console.log("Uploading");
                const formData = new FormData();
                this.state.uploadedFiles.forEach(file => formData.append("files", file));
                this.setState({ isBusy: true });

                const files = await MediaService.upload(formData);
                console.log(files);
                this.setState({
                    fileIDs: files.map(file => file.id),
                    isBusy: false
                });
                console.log("Files are succesfully uploaded");
                return true;
            } alert("Cannot upload right now. Server is busy!");
        } catch (e) {
            console.log("Upload Exception:");
            console.log(e);
            this.setState({
                isBusy: false
            });
        }
        return false;
    }

    async handleSubmit(e: FormEvent) {
        e.preventDefault();
        console.log(e);
        try {

            if (!this.state.isAgreed)
                alert("You have to agree with our Privacy Policy and Terms of Service");
            else if (this.state.fileIDs === undefined)
                alert("Upload your medical files");
            else {
            // @ts-ignore

                const dateF = format(this.state.date!, "yyyy-MM-dd").toString();

                // if (CreateUserDto.full_name.trim().length === 0)
                //     throw new IllegalArgumentException("Name is empty");
                // if (CreateUserDto.email.trim().length === 0)
                //     throw new IllegalArgumentException("Email is empty");
                // if (!CreateUserDto.email.toLocaleLowerCase().match(
                //     /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
                //     throw new IllegalArgumentException("Email is incorrect");

                if (this.state.isDoctor) {
                    const res = await this.uploadFiles();
                    if (!res) {
                        alert("You need to upload your medical files to confirm your specialty");
                        throw new IllegalArgumentException("No files?!");
                    }
                }
                const data: CreateUserDto = {
                    email: this.state.mailValue as EmailAddress,
                    full_name: this.state.nameValue,
                    birth_date: dateF,
                    medical_organization_name: this.state.medicalNameValue,
                    confirmation_document_ids: this.state.fileIDs,
                    has_doctor_capabilities: this.state.isDoctor
                };

                await AuthService.register(data);

                this.setState({ isSubmitted: true });
            }
        } catch (e) {
            console.log(e);
        }
    }

    switchToDoctor() {
        const doctor = !this.state.isDoctor;
        this.setState({
            isDoctor: doctor
        });
    }

    // card = (<Box component="form" noValidate onSubmit={this.handleSubmit} sx={{ mt: 3, alignItems: "center", maxWidth: 350 }}>
    //     <Stack spacing={1.5} sx={{ alignItems: "center", maxWidth: 300 }}>

    //         <TextField autoComplete="given-name"
    //                    name={this.state.nameValue}
    //                    required
    //                    fullWidth
    //                    id="firstName"
    //                    label="Full Name"
    //                    onChange={this.validateName}
    //                    helperText={this.state.nameHelper}
    //                    error={this.state.nameError}
    //                    autoFocus />

    //         <TextField required
    //                    fullWidth
    //                    id="email"
    //                    label="Email Address"
    //                    name={this.state.mailValue}
    //                    onChange={this.validateMail}
    //                    helperText={this.state.mailHelper}
    //                    error={this.state.mailError}
    //                    autoComplete="email" />

    //         <DatePicker value={this.state.date}
    //                     onChange={date => {
    //                         this.setState({ date });
    //                         this.fieldCheck();
    //                     }}
    //                     label="Date of Birth:"
    //                     renderInput={params => <TextField {...params} fullWidth />} />

    //         <FormControl>
    //             <FormLabel id="demo-row-radio-buttons-group-label">Are you a Doctor?</FormLabel>
    //             <RadioGroup row
    //                         aria-labelledby="demo-row-radio-buttons-group-label"
    //                         value={this.state.isDoctor}
    //                         onChange={this.switchToDoctor}
    //                         name="row-radio-buttons-group">
    //                 <FormControlLabel value={false} control={<Radio />} label="Patient" />
    //                 <FormControlLabel value={true} control={<Radio />} label="Doctor" />
    //             </RadioGroup>
    //         </FormControl>

    //         <TextField required
    //                    fullWidth
    //                    id="medicalOrganization"
    //                    label="Medical Organization Name"
    //                    name={this.state.medicalNameValue}
    //                    onChange={this.validateMedicalName}
    //                    helperText={this.state.medicalNameHelper}
    //                    error={this.state.medicalNameError}
    //                    autoComplete="none" />

    //         <TextField required
    //                    fullWidth
    //                    id="adress"
    //                    label="Legal Adress of Medical Organization"
    //                    name={this.state.adressValue}
    //                    onChange={this.validateAdress}
    //                    helperText={this.state.adressHelper}
    //                    error={this.state.adressError}
    //                    autoComplete="Adress" />

    //         <TextField required
    //                    fullWidth
    //                    id="specialty"
    //                    label="Designate your medical specialty"
    //                    name={this.state.specialtyValue}
    //                    onChange={this.validateSpecialty}
    //                    helperText={this.state.specialtyHelper}
    //                    error={this.state.specialtyError}
    //                    autoComplete="Surgeon" />

    //         <FileUpload multiFile={true}
    //                     onFilesChange={this.updateFiles}
    //                     maxUploadFiles={10}
    //                     allowedExtensions={["jpg", "jpeg", "pdf"]}
    //                     onContextReady={context => {}}
    //                     imageSrc="DriveFolderUploadIcon"
    //                     showPlaceholderImage={false}
    //                     title="Upload your medical documents here" />

    //         { /* <Grid item xs={8}>
    //     <Button onClick={this.switchToDoctor}
    //             variant="outlined"
    //             color="primary"
    //             startIcon={<SendIcon />}
    //             sx={{ mt: 3, mb: 2 }}>
    //         I am a Patient
    //     </Button>
    // </Grid> */ }

    //         <FormControlLabel control={<Checkbox value={this.state.isAgreed} onChange={this.updateCheckbox} color="primary" />}
    //                           label="I have read and agree with Privacy Policy and Terms of Service." />

    //         <Button type="submit"
    //                 fullWidth
    //                 variant="contained"
    //                 disabled={!this.state.canSubmit}
    //                 sx={{ mt: 3, mb: 2 }}>
    //             Request Access
    //         </Button>

    //         <Link href="/app" variant="body2">
    //             Already have an account? Sign in
    //         </Link>

    //     </Stack>
    // </Box>);
    render() {
        if (this.state.isSubmitted) {
            return (
                <Container component="main" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
                    <CssBaseline />
                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}>
                        <Logo />

                        <Card variant="outlined" sx={{ maxWidth: 650, marginTop: 1, p: 2, pb: 5, width: 1, height: 1, alignItems: "center" }}>{
                            <Box component="form" noValidate onSubmit={this.handleSubmit} sx={{ mt: 3, alignItems: "center", maxWidth: 650 }}>
                                <Typography component="h1" variant="h5" align="center" sx={{ mb: 5 }}>
                                    Please confirm your email
                                </Typography>
                                <Typography align="center">We have sent a confirmation email to <b>{ this.state.mailValue }</b>. Please check your e-mail inbox to continue account creation process.</Typography>
                            </Box>
                        }
                        </Card>
                        <Link href="/app" variant="body2" sx={{ mt: 1 }}>
                            Already have an account? Sign in
                        </Link>
                    </Box>
                </Container>
            );
        }
        if (this.state.isDoctor)
            return (
                <Container component="main" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
                    <CssBaseline />
                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}>
                        <Logo />
                        <Card variant="outlined" sx={{ maxWidth: 650, marginTop: 1, p: 2, width: 1, height: 1, alignItems: "center" }}>{
                            <Box component="form" noValidate onSubmit={this.handleSubmit} sx={{ mt: 3, alignItems: "center", maxWidth: 650 }}>
                                <Typography component="h1" variant="h5" align="center" sx={{ mb: 5 }}>
                                    Create Doctor Account
                                </Typography>
                                <Stack spacing={1.5} sx={{ alignItems: "center", maxWidth: 650 }}>

                                    <TextField autoComplete="given-name"
                                               name={this.state.nameValue}
                                               required
                                               fullWidth
                                               id="firstName"
                                               label="Full Name"
                                               onChange={this.validateName}
                                               helperText={this.state.nameHelper}
                                               error={this.state.nameError}
                                               autoFocus />

                                    <TextField required
                                               fullWidth
                                               id="email"
                                               label="Email Address"
                                               name={this.state.mailValue}
                                               onChange={this.validateMail}
                                               helperText={this.state.mailHelper}
                                               error={this.state.mailError}
                                               autoComplete="email" />

                                    <DatePicker value={this.state.date}
                                                onChange={date => {
                                                    this.setState({ date });
                                                    this.fieldCheck();
                                                }}
                                                minDate={new Date(1850, 1, 1)}
                                                maxDate={new Date(new Date().getFullYear() - 18, 1, 1)}
                                                label="Date of Birth:"
                                                renderInput={params => <TextField {...params} fullWidth helperText="You must be at least 18 years of age" />} />

                                    <FormControl>
                                        <FormLabel id="demo-row-radio-buttons-group-label"
                                                   style={{ textAlign: "center" }}>Are you a Doctor?</FormLabel>
                                        <RadioGroup row
                                                    aria-labelledby="demo-row-radio-buttons-group-label"
                                                    value={this.state.isDoctor}
                                                    onChange={this.switchToDoctor}
                                                    name="row-radio-buttons-group">
                                            <FormControlLabel value={false} control={<Radio />} label="Patient" />
                                            <FormControlLabel value={true} control={<Radio />} label="Doctor" />
                                        </RadioGroup>
                                    </FormControl>

                                    <TextField required
                                               fullWidth
                                               id="medicalOrganization"
                                               label="Medical Organization Name"
                                               name={this.state.medicalNameValue}
                                               onChange={this.validateMedicalName}
                                               helperText={this.state.medicalNameHelper}
                                               error={this.state.medicalNameError}
                                               autoComplete="none" />

                                    <TextField required
                                               fullWidth
                                               id="adress"
                                               label="Legal Adress of Medical Organization"
                                               name={this.state.adressValue}
                                               onChange={this.validateAdress}
                                               helperText={this.state.adressHelper}
                                               error={this.state.adressError}
                                               autoComplete="Adress" />

                                    <TextField required
                                               fullWidth
                                               id="specialty"
                                               label="Designate your medical specialty"
                                               name={this.state.specialtyValue}
                                               onChange={this.validateSpecialty}
                                               helperText={this.state.specialtyHelper}
                                               error={this.state.specialtyError}
                                               autoComplete="Surgeon" />

                                    <FileUpload multiFile={true}
                                                onFilesChange={this.updateFiles}
                                                maxUploadFiles={10}
                                                allowedExtensions={["jpg", "jpeg", "pdf"]}
                                                onContextReady={context => {}}
                                                imageSrc="DriveFolderUploadIcon"
                                                showPlaceholderImage={false}
                                                title="Upload your medical documents here" />

                                    <FormControlLabel control={<Checkbox value={this.state.isAgreed} onChange={this.updateCheckbox} color="primary" />}
                                                      label={<div>I have read and agree with { this.link1 } and { this.link2 }.</div>} />

                                    <Button type="submit"
                                            fullWidth
                                            variant="contained"
                                            disabled={!this.state.canSubmit}
                                            sx={{ mt: 3, mb: 2 }}>
                                        Request Access
                                    </Button>

                                </Stack>
                            </Box>
                        }</Card>
                        <Link href="/app" variant="body2" sx={{ mt: 1 }}>
                            Already have an account? Sign in
                        </Link>
                    </Box>
                </Container>
            );
        return (
            <Container component="main" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
                <CssBaseline />
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}>
                    <Logo />

                    <Card variant="outlined" sx={{ maxWidth: 650, marginTop: 1, p: 2, width: 1, height: 1, alignItems: "center" }}>{
                        <Box component="form" noValidate onSubmit={this.handleSubmit} sx={{ mt: 3, alignItems: "center", maxWidth: 650 }}>
                            <Typography component="h1" variant="h5" align="center" sx={{ mb: 5 }}>
                                Create Patient Account
                            </Typography>
                            <Stack spacing={1.5} sx={{ alignItems: "center", maxWidth: 650 }}>
                                <TextField autoComplete="given-name"
                                           name={this.state.nameValue}
                                           required
                                           fullWidth
                                           id="firstName"
                                           label="Full Name"
                                           onChange={this.validateName}
                                           helperText={this.state.nameHelper}
                                           error={this.state.nameError}
                                           autoFocus />

                                <TextField required
                                           fullWidth
                                           id="email"
                                           label="Email Address"
                                           name={this.state.mailValue}
                                           onChange={this.validateMail}
                                           helperText={this.state.mailHelper}
                                           error={this.state.mailError}
                                           autoComplete="email" />

                                <DatePicker value={this.state.date}
                                            onChange={date => {
                                                this.setState({ date });
                                                this.fieldCheck();
                                            }}
                                            minDate={new Date(1850, 1, 1)}
                                            maxDate={new Date(new Date().getFullYear() - 18, 1, 1)}
                                            label="Date of Birth:"
                                            slotProps={{
                                                textField: { helperText: "You must be at least 18 years of age" }
                                            }}
                                            renderInput={params => <TextField {...params} fullWidth />} />

                                <FormControl>
                                    <FormLabel id="demo-row-radio-buttons-group-label"
                                               style={{ textAlign: "center" }}>Are you a Doctor?</FormLabel>
                                    <RadioGroup row
                                                aria-labelledby="demo-row-radio-buttons-group-label"
                                                value={this.state.isDoctor}
                                                onChange={this.switchToDoctor}
                                                name="row-radio-buttons-group">
                                        <FormControlLabel value={false} control={<Radio />} label="Patient" />
                                        <FormControlLabel value={true} control={<Radio />} label="Doctor" />
                                    </RadioGroup>
                                </FormControl>

                                <FormControlLabel control={<Checkbox value={this.state.isAgreed} onChange={this.updateCheckbox} color="primary" />}
                                                  label={<div>I have read and agree with { this.link1 } and { this.link2 }.</div>} />

                                <Button type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={!this.state.canSubmit}
                                        sx={{ mt: 3, mb: 2 }}>
                                    Sign Up
                                </Button>
                            </Stack>

                        </Box>
                    }
                    </Card>
                    <Link href="/app" variant="body2" sx={{ mt: 1 }}>
                        Already have an account? Sign in
                    </Link>
                </Box>
            </Container>
        );
    }
}
