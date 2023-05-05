import { UserEntity } from "@hdapp/shared/db-common/entities/user.entity";
import { EmailAddress, Web3Address } from "@hdapp/shared/web2-common/types";
import { ErrorClass, Logger } from "@hdapp/shared/web2-common/utils";
import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { readFileSync } from "fs";
import fs from "fs";
import { resolve } from "path";

export class SendMailError extends ErrorClass("Could not send the e-mail") {}

const { debug } = new Logger("mail-service");
@Injectable()
export class MailService {
    constructor(
        private readonly mailer: MailerService,
    ) { }

    async sendWalletInfo(
        user: UserEntity,
        walletPublicKey: Web3Address,
        walletPrivateKey: string,
        walletMnemonic: string
    ) {
        try {
            const userB64 = Buffer.from(
                JSON.stringify({
                    full_name: user.fullName,
                    birth_date: user.birthDate
                }),
                "utf-8"
            ).toString("base64");

            // const html = readFileSync("../api/mailStuff/verification-email.html", "utf8")
            //     .replace("{full_name}", user.fullName)
            //     .replace("{private_key}", walletPrivateKey)
            //     .replace("{public_key}", walletPublicKey)
            //     .replace("{mnemonic}", walletMnemonic)
            //     .replace("{verification_link}", `https://hdapp.ruslang.xyz/app?privateKey=${walletPrivateKey}&user=${userB64}`);

            // await this.mailer.sendMail({
            //     to: user.email,
            //     subject: "Your HDAPP WalletInfo",
            //     html: html,
            // });
            //!!! SendMailOptions ЗАКИНУТЬ
            await this.mailer.sendMail({
                to: user.email, // list of receivers
                subject: "Your HDAPP WalletInfo", // Subject line
                text: `Hello, ${user.fullName}!\r\n\r\nThanks for creating an account on HDAPP!\r\nIn order to sign in into your new account, press the following link: https://hdapp.ruslang.xyz/app?privateKey=${walletPrivateKey}&user=${userB64}\r\n\r\nYour wallet details:\r\nPublic key: ${walletPublicKey}\r\nPrivate key: ${walletPrivateKey}\r\nMnemonic: ${walletMnemonic}`, // plaintext body
            });

            debug("Sent wallet info e-mail.", { email: user.email });
        } catch (err) {
            throw new SendMailError({ err, email: user.email }, "Could not send e-mail with wallet info");
        }
    }

    async sendEmailVerification(userEmail: EmailAddress, verifyToken: string) {
        try {
            const url = "https://drive.google.com/file/d/1qe9MovzkceaqhjtaDCNxIdKkS1p4o6Uz/view";
            const html = `
    <div>
      <p>Here's an image:</p>
      <img src="${url}" />
    </div>
  `;
            const mailOptions = {
                to: userEmail,
                subject: "Email with image",
                html
            };
            await this.mailer.sendMail(mailOptions);

            // await this.mailer.sendMail({
            //     to: userEmail, // list of receivers
            //     subject: "HDAPP Email Verification", // Subject line
            //     text: `Verify your email by clicking this link: https://hdapp.ruslang.xyz/api/auth/verify/${verifyToken}`, // plaintext body
            // });

            //             const mailOptions = {
            //   from: "your_email@gmail.com",
            //   to: "recipient_email@example.com",
            //   subject: "Test Email",
            //   html: htmlContent,
            // };
            // const html = readFileSync("../api/mailStuff/verification-email.html", "utf8");

            // await this.mailer.sendMail({
            //     to: userEmail,
            //     subject: "HDAPP Email Verification",
            //     html: html,
            // });

            debug("Sent verification e-mail.", { email: userEmail });
        } catch (err) {
            throw new SendMailError({ err, email: userEmail }, "Could not send verification e-mail");
        }
    }

    async sendReviewNoticeEmail(userEmail: EmailAddress) {
        try {
            await this.mailer.sendMail({
                to: userEmail, // list of receivers
                subject: "HDAPP Registration Request on Review", // Subject line
                text: "Thanks for applying for a doctor account on HDAPP!\r\nYour registration is currently on a review process by our moderation team. Once the review is over, you will be sent an e-mail to this address.", // plaintext body
            });

            debug("Sent registration review notice e-mail.", { email: userEmail });
        } catch (err) {
            throw new SendMailError({ err, email: userEmail }, "Could not send registration review notice e-mail");
        }
    }

    async sendReviewCompleteEmail(userEmail: EmailAddress) {
        try {
            await this.mailer.sendMail({
                to: userEmail, // list of receivers
                subject: "HDAPP Registration Request Completed", // Subject line
                text: "Thanks for applying for a doctor account on HDAPP!\r\nWe are happy to inform you your registration request has been approved! You can now sign in to your account and start interacting with other users.", // plaintext body
            });

            debug("Sent registration complete notice e-mail.", { email: userEmail });
        } catch (err) {
            throw new SendMailError({ err, email: userEmail }, "Could not send registration complete notice e-mail");
        }
    }
}
