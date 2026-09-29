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
    replyTo: env.emailReplyTo,
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

let warnedRestrictedApiKey = false;

/** Upserts a contact to the Resend audience for future broadcasts. Logs and
 * no-ops when Resend or the audience id is unset, and never throws: a
 * sending-only RESEND_API_KEY can't do this (Resend returns 401
 * restricted_api_key), and that must not fail the lead flow or the outbox. */
export async function upsertAudienceContact(contact: AudienceContact): Promise<void> {
  if (!isConfigured("resend") || !env.resendAudienceId) {
    console.log(`[resend:not-configured] would upsert audience contact ${contact.email}`);
    return;
  }

  try {
    const result = await getClient().contacts.create({
      audienceId: env.resendAudienceId,
      email: contact.email,
      unsubscribed: false,
    });

    if (result.error) {
      // Resend's API returns 401 "restricted_api_key" for a sending-only
      // key trying to manage contacts; the installed SDK's types predate
      // that error code, so check the raw name rather than narrow it away.
      const errorName = result.error.name as string;
      if (errorName === "restricted_api_key") {
        if (!warnedRestrictedApiKey) {
          console.warn(
            "Resend audience upsert skipped: RESEND_API_KEY is sending-only. " +
              "A full-access key is needed for audience sync; see README."
          );
          warnedRestrictedApiKey = true;
        }
        return;
      }
      console.error("Resend audience upsert failed", result.error);
    }
  } catch (err) {
    console.error("Resend audience upsert failed", err);
  }
}
