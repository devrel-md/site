import { escapeHtml } from "@/lib/html";
import { env } from "@/lib/env";
import { siteHeaderHtml, siteFooterHtml, headMetaHtml, themeScript, toggleScript } from "@/lib/siteLayout";

export interface PageOptions {
  title: string;
  description: string;
  path: string;
  bodyHtml: string;
  /** Extra content injected right after <main> opens, before bodyHtml (e.g. a stage gates callout). */
  preContent?: string;
  /** Extra content injected right before </main> (e.g. a lead form, a raw toggle). */
  postContent?: string;
  /** Added to <body>, for page-specific CSS scoping (e.g. the home page's layout). */
  bodyClassName?: string;
  /** Add "Copy" buttons to code blocks (default true). Result pages have a dedicated full-file button. */
  copyButtons?: boolean;
  /** Canonical URL when it is not the page's own address (e.g. a company's own DEVREL.md). */
  canonicalUrl?: string;
  /** Adds `<meta name="robots" content="noindex">`. */
  noindex?: boolean;
}

// Progressive enhancement: code blocks are fully readable and selectable
// without this. It wraps each <pre> and adds a Copy button that uses the
// async clipboard API, falling back to selecting the text (and the legacy
// copy command) if the browser refuses.
export function copyScript(): string {
  return `(function(){
    var blocks = document.querySelectorAll('main pre');
    Array.prototype.forEach.call(blocks, function (pre) {
      if (pre.closest('.raw-toggle')) return;
      var wrap = document.createElement('div');
      wrap.className = 'code-block';
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy this code block');
      btn.setAttribute('aria-live', 'polite');
      wrap.appendChild(btn);
      var timer;
      function flash(label) {
        btn.textContent = label;
        clearTimeout(timer);
        timer = setTimeout(function () { btn.textContent = 'Copy'; }, 1800);
      }
      function fallback() {
        var ok = false;
        try {
          var range = document.createRange();
          range.selectNodeContents(pre);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          ok = document.execCommand('copy');
        } catch (e) {}
        flash(ok ? 'Copied' : 'Press Ctrl+C');
      }
      btn.addEventListener('click', function () {
        var text = pre.textContent || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { flash('Copied'); }, fallback);
        } else {
          fallback();
        }
      });
    });
  })();`;
}

export function renderPage(options: PageOptions): string {
  const { title, description, path, bodyHtml, preContent = "", postContent = "", bodyClassName, copyButtons = true, canonicalUrl, noindex = false } = options;
  const canonical = canonicalUrl ?? `${env.siteUrl}${path}`;
  const bodyAttr = bodyClassName ? ` class="${escapeHtml(bodyClassName)}"` : "";

  return `<!doctype html>
<html lang="en-GB">
<head>
<script>${themeScript()}</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ""}<link rel="canonical" href="${escapeHtml(canonical)}">
${headMetaHtml({ siteUrl: env.siteUrl, title, description, canonical })}
<link rel="stylesheet" href="/styles.css">
<meta name="color-scheme" content="light dark">
</head>
<body${bodyAttr}>
${siteHeaderHtml(path)}
<main>
${preContent}${bodyHtml}
${postContent}
</main>
${siteFooterHtml()}
<script>${toggleScript()}</script>${copyButtons ? `\n<script>${copyScript()}</script>` : ""}
</body>
</html>
`;
}
