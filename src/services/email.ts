import { injectable } from 'inversify';
import nodemailer from "nodemailer";
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { NODEMAILER_FROM, NODEMAILER_PASSWORD, NODEMAILER_USER } from '../config/nodemailer';
import APIError from '../util/APIError';

@injectable()
export class EmailService {
  async sendMail(options: { to: string; subject: string; html: string }): Promise<SMTPTransport.SentMessageInfo> {
    const { to, subject, html } = options;
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        auth: {
          user: NODEMAILER_USER,
          pass: NODEMAILER_PASSWORD
        }
      });

      const res=  await transporter.sendMail({
        from: NODEMAILER_FROM,
        to: to,
        subject: subject,
        html: html
      })

      return res;

    } catch (error) {
      console.log("Error sending email: ", error);
      throw new APIError({ message: 'Failed to send email', status: 500 });
    }
  }
}
