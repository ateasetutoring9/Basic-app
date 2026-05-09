import { resend } from "./client";

// TODO: Set EMAIL_FROM to noreply@ateasetutoring.com once domain is verified in Resend
const FROM = process.env.EMAIL_FROM ?? "noreply@ateasetutoring.com";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "hello@ateasetutoring.com";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      replyTo: REPLY_TO,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
  } catch (err) {
    console.error("[sendEmail] Failed to send email:", err);
    // Never throw — callers must not leak email-send failures to the HTTP response
  }
}
