import { EmailAddress, Web3Address } from "@hdapp/shared/web2-common/types";
import { ErrorClass, Logger } from "@hdapp/shared/web2-common/utils";
import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

export class SendMailError extends ErrorClass("Could not send the e-mail") {}

const { debug } = new Logger("mail-service");

@Injectable()
export class MailService {
    constructor(
        private readonly mailer: MailerService,
    ) { }

    async sendWalletInfo(
        userEmail: EmailAddress,
        walletPublicKey: Web3Address,
        walletPrivateKey: string,
        walletMnemonic: string,
    ) {
        try {
            await this.mailer.sendMail({
                to: userEmail, // list of receivers
                subject: "Your HDAPP WalletInfo", // Subject line
                text: `Thanks for creating an account on HDAPP!\r\nIn order to sign in into your new account, press the following link: https://hdapp.ruslang.xyz/app?privateKey=${walletPrivateKey}\r\n\r\nYour wallet details:\r\nPublic key: ${walletPublicKey}\r\nPrivate key: ${walletPrivateKey}\r\nMnemonic: ${walletMnemonic}`, // plaintext body
            });

            debug("Sent wallet info e-mail.", { email: userEmail });
        } catch (err) {
            throw new SendMailError({ err, email: userEmail }, "Could not send e-mail with wallet info");
        }
    }

    async sendEmailVerification(userEmail: EmailAddress, verifyToken: string) {
        try {
            await this.mailer.sendMail({
                to: userEmail, // list of receivers
                subject: "HDAPP Email Verification", // Subject line
                text: `Verify your email by clicking this link: https://hdapp.ruslang.xyz/api/auth/verify/${verifyToken}`, // plaintext body
            });

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
                text: "Thanks for applying for a doctor account on HDAPP!\r\nYour registration is currently on a review process by our moderator team. Once the review is over, you will be sent an e-mail to this address.", // plaintext body
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
