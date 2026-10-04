import { wantsMarkdown, markdownResponse, htmlResponse } from "@/lib/negotiate";
import { parseMarkdown } from "@/lib/markdown";
import { renderPage } from "@/lib/page";
import { readValidateDescription } from "@/lib/content";
import { validateFormHtml, validateResultsHtml } from "@/lib/validatePage";
import { runValidation } from "@/lib/runValidation";
import { checkAndIncrementRateLimit } from "@/lib/rateLimit";
import { clientIp, hashIp } from "@/lib/hash";

const TITLE = "Validate: DEVREL.md";
const DESCRIPTION = "Paste a DEVREL.md and get the structural check the generator uses: format, not facts.";

export async function GET(request: Request): Promise<Response> {
  const markdown = await readValidateDescription();

  if (wantsMarkdown(request, false)) {
    return markdownResponse(markdown, "/validate.md");
  }

  const { html: bodyHtml } = await parseMarkdown(markdown);
  const page = renderPage({
    title: TITLE,
    description: DESCRIPTION,
    path: "/validate",
    bodyHtml,
    postContent: validateFormHtml(),
  });
  return htmlResponse(page, "/validate.md");
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const markdown = String(form.get("markdown") ?? "");

  const ipHash = hashIp(clientIp(request.headers));
  const { allowed } = await checkAndIncrementRateLimit(ipHash, "validate");

  const descriptionMarkdown = await readValidateDescription();
  const { html: bodyHtml } = await parseMarkdown(descriptionMarkdown);

  const postContent = !allowed
    ? `<div class="callout"><p class="error-text">You have hit today's validation limit. Try again tomorrow.</p></div>${validateFormHtml(markdown)}`
    : !markdown.trim()
      ? `<div class="callout"><p class="error-text">Paste a DEVREL.md file to validate.</p></div>${validateFormHtml(markdown)}`
      : `${validateResultsHtml(runValidation(markdown))}${validateFormHtml(markdown)}`;

  const page = renderPage({
    title: TITLE,
    description: DESCRIPTION,
    path: "/validate",
    bodyHtml,
    postContent,
  });
  return htmlResponse(page, "/validate.md");
}
