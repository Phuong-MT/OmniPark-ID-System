import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('BREVO_SMTP_HOST'),
            port: this.configService.get<number>('BREVO_SMTP_PORT'),
            auth: {
                user: this.configService.get<string>('BREVO_SMTP_USER'),
                pass: this.configService.get<string>('BREVO_SMTP_PASS'),
            },
        });
    }

    async sendVerificationCode(to: string, code: string): Promise<void> {
        const mailOptions = {
            from: `"${this.configService.get<string>('MAIL_FROM_NAME')}" <${this.configService.get<string>('MAIL_FROM_ADDRESS')}>`,
            to,
            subject: 'Your Verification Code',
            text: `Your verification code is: ${code}. It will expire in 5 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Verification Code</h2>
                    <p>Hello,</p>
                    <p>Your verification code is:</p>
                    <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        ${code}
                    </div>
                    <p>This code will expire in 5 minutes.</p>
                    <p>If you did not request this code, please ignore this email.</p>
                    <br/>
                    <p>Best regards,<br/>The OmniPark Team</p>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send verification email');
        }
    }
}
