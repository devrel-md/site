import { Resend } from "resend";
import { env, isConfigured } from "@/lib/env";

let client: Resend | undefined;

function getClient(): Resend {
  if (!client) client = new Resend(env.resendApiKey);
  return client;
}

function unsubscribeUrl(leadToken: string): string {
  return `${env.siteUrl}/api/unsubscribe?token=${encodeURIComponent(leadToken)}`;
}

function unsubscribeHeaders(leadToken: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<mailto:hello@devrel.md?subject=unsubscribe>, <${unsubscribeUrl(leadToken)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  leadToken: string;
  attachment?: { filename: string; content: string };
}

export interface SendEmailResult {
  sent: boolean;
  id?: string;
}

/** Sends an email through Resend, or logs and returns { sent: false } when
 * RESEND_API_KEY is unset, as required for local development. */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!isConfigured("resend")) {
    console.log(`[resend:not-configured] would send "${params.subject}" to ${params.to}`);
    return { sent: false };
  }

  const result = await getClient().emails.send({
    from: env.emailFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    headers: unsubscribeHeaders(params.leadToken),
    attachments: params.attachment
      ? [{ filename: params.attachment.filename, content: params.attachment.content }]
      : undefined,
  });

  if (result.error) {
    console.error("Resend send failed", result.error);
    return { sent: false };
  }
  return { sent: true, id: result.data?.id };
}

export interface AudienceContact {
  email: string;
  company: string;
  role: string;
  teamSize: string;
}

/** Upserts a contact to the Resend audience for future broadcasts. Logs and
 * no-ops when Resend or the audience id is unset. */
export async function upsertAudienceContact(contact: AudienceContact): Promise<void> {
  if (!isConfigured("resend") || !env.resendAudienceId) {
    console.log(`[resend:not-configured] would upsert audience contact ${contact.email}`);
    return;
  }

  try {
    await getClient().contacts.create({
      audienceId: env.resendAudienceId,
      email: contact.email,
      unsubscribed: false,
    });
  } catch (err) {
    console.error("Resend audience upsert failed", err);
  }
}
