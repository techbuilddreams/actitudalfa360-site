import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailMessage, Mailer } from '@/application/ports/mailer';

/** SMTP (Hostinger: smtp.hostinger.com:465, TLS). Una conexión en pool por proceso. */
export class SmtpMailer implements Mailer {
  private readonly transport: Transporter;

  constructor(private readonly opts: { host: string; port: number; user: string; password: string; from: string }) {
    this.transport = nodemailer.createTransport({
      host: opts.host,
      port: opts.port,
      secure: opts.port === 465,
      auth: { user: opts.user, pass: opts.password },
      pool: true,
      maxConnections: 2,
      connectionTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  async send(m: EmailMessage): Promise<void> {
    await this.transport.sendMail({ from: this.opts.from, to: m.to, subject: m.subject, html: m.html, text: m.text, replyTo: m.replyTo });
  }
}
