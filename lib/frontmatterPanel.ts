import { escapeHtml } from "@/lib/html";

const LABELS: Record<string, string> = {
  spec: "Spec",
  version: "Version",
  status: "Status",
  license: "License",
  maintainer: "Maintainer",
  product: "Product",
  url: "URL",
  stage: "Stage",
  updated: "Updated",
  owner: "Owner",
};

/** Renders a DEVREL.md file's frontmatter as a small definition list, since
 * the body Markdown pipeline strips it before converting to HTML. */
export function frontmatterPanelHtml(frontmatter: Record<string, unknown>): string {
  const entries = Object.entries(frontmatter).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return "";

  const rows = entries
    .map(([key, value]) => {
      const label = LABELS[key] ?? key;
      return `<div class="stage-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(String(value))}</span></div>`;
    })
    .join("\n");

  return `<div class="callout stage-gates">${rows}</div>`;
}
