export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly replyTo?: string;
}

/** Puerto de envío de correo. Hoy SMTP de Hostinger; mañana cualquier proveedor sin tocar la lógica. */
export interface Mailer {
  send(message: EmailMessage): Promise<void>;
}
