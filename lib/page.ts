import { escapeHtml } from "@/lib/html";
import { env } from "@/lib/env";

export interface PageOptions {
  title: string;
  description: string;
  path: string;
  bodyHtml: string;
  /** Extra content injected right after <main> opens, before bodyHtml (e.g. a stage gates callout). */
  preContent?: string;
  /** Extra content injected right before </main> (e.g. a lead form, a raw toggle). */
  postContent?: string;
}

const NAV = [
  { href: "/", label: "Spec" },
  { href: "/skills", label: "Skills" },
  { href: "/generate", label: "Generate" },
];

function themeScript(): string {
  // Runs before paint to avoid a flash of the wrong theme. Reading is fine
  // without this ever running: it only affects which colour scheme shows.
  return `(function(){try{var t=localStorage.getItem('devrelmd-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
}

function toggleScript(): string {
  return `(function(){
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var root = document.documentElement;
      var current = root.getAttribute('data-theme');
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var effective = current || (prefersDark ? 'dark' : 'light');
      var next = effective === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('devrelmd-theme', next); } catch (e) {}
    });
  })();`;
}

export function renderPage(options: PageOptions): string {
  const { title, description, path, bodyHtml, preContent = "", postContent = "" } = options;
  const canonical = `${env.siteUrl}${path}`;

  const navLinks = NAV.map(
    (item) =>
      `<a class="nav-link" href="${item.href}"${item.href === path ? ' aria-current="page"' : ""}>${item.label}</a>`
  ).join("\n      ");

  return `<!doctype html>
<html lang="en-GB">
<head>
<script>${themeScript()}</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/styles.css">
<meta name="color-scheme" content="light dark">
</head>
<body>
<header class="site-header">
  <nav>
    <a class="wordmark" href="/">DEVREL.md</a>
    ${navLinks}
    <span class="spacer"></span>
    <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Toggle colour theme">Theme</button>
  </nav>
</header>
<main>
${preContent}${bodyHtml}
${postContent}
</main>
<footer class="site-footer">
  <div class="wrap">
    <span>Created and maintained by Marcos Placona, DevRel Bridge. Framework from <em>How to Build Developer Ecosystems</em> by Amir Shevat and Marcos Placona.</span>
  </div>
  <div class="wrap">
    <a class="nav-link" href="/changelog">Changelog</a>
    <a class="nav-link" href="/api">API reference</a>
    <a class="nav-link" href="/privacy">Privacy</a>
  </div>
</footer>
<script>${toggleScript()}</script>
</body>
</html>
`;
}
