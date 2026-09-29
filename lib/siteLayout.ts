// The one shared header, footer and theme scripts. Used by renderPage (every
// hand-built HTML route) and by the React pages (/generate, 404, error), so the
// chrome cannot drift between the two. Pure strings: safe to import from
// client components too.
import { escapeHtml } from "@/lib/html";

export const NAV = [
  { href: "/quickstart", label: "Quickstart" },
  { href: "/spec", label: "Spec" },
  { href: "/skills", label: "Skills" },
  { href: "/generate", label: "Generate" },
  { href: "/validate", label: "Validate" },
];

// Footer backlinks are plain, direct links (not /go redirects) so they count
// as ordinary backlinks. No rel attribute on purpose.
export const DEVREL_BRIDGE_URL = "https://devrelbridge.com/?utm_source=devrel.md&utm_medium=footer";
export const BOOK_URL = "https://devrelbridge.com/book?utm_source=devrel.md&utm_medium=footer";

// The brand mark (braces around a dot), inline so it follows the theme through
// currentColor. Decorative: the wordmark text next to it is the accessible name.
export const MARK_SVG =
  '<svg class="mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g stroke="currentColor" fill="currentColor"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="7,3 5,3 5,10 2.8,12 5,14 5,21 7,21"/><polyline points="17,3 19,3 19,10 21.2,12 19,14 19,21 17,21"/></g><circle cx="12" cy="12" r="3.6" stroke="none"/></g></svg>';

export const OG_IMAGE_PATH = "/opengraph-image.png";

/** Icon links, plus Open Graph and Twitter tags, for the <head> of the hand-built HTML routes.
 * The React pages get the same set through the metadata export in app/layout.tsx. */
export function headMetaHtml(opts: { siteUrl: string; title: string; description: string; canonical: string }): string {
  const image = `${opts.siteUrl}${OG_IMAGE_PATH}`;
  const t = escapeHtml(opts.title);
  const d = escapeHtml(opts.description);
  return `<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-icon.png">
<meta property="og:site_name" content="DEVREL.md">
<meta property="og:type" content="website">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${escapeHtml(opts.canonical)}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${image}">`;
}

export function themeScript(): string {
  // Runs before paint to avoid a flash of the wrong theme. Reading is fine
  // without this ever running: it only affects which colour scheme shows.
  return `(function(){try{var t=localStorage.getItem('devrelmd-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
}

export function toggleScript(): string {
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

function currentAttr(href: string, path: string): string {
  if (href === path) return ' aria-current="page"';
  if (path.startsWith(`${href}/`)) return ' aria-current="true"';
  return "";
}

/** `path` marks the current page with aria-current="page", and the section a
 * page lives in (/skills/[name] under Skills) with aria-current="true". Pass ""
 * for none (404, error). */
export function siteHeaderHtml(path: string): string {
  const navLinks = NAV.map(
    (item) =>
      `<a class="nav-link" href="${item.href}"${currentAttr(item.href, path)}>${escapeHtml(item.label)}</a>`
  ).join("\n    ");

  return `<header class="site-header">
  <nav>
    <a class="wordmark" href="/">${MARK_SVG}DEVREL.md</a>
    ${navLinks}
    <span class="spacer"></span>
    <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Toggle colour theme">Theme</button>
  </nav>
</header>`;
}

export function siteFooterHtml(): string {
  return `<footer class="site-footer">
  <div class="wrap">
    <span>Created and maintained by Marcos Placona, <a href="${DEVREL_BRIDGE_URL}">DevRel Bridge</a>. Framework from <a href="${BOOK_URL}"><em>How to Build Developer Ecosystems</em></a> by Amir Shevat and Marcos Placona.</span>
  </div>
  <div class="wrap">
    <a class="nav-link" href="/changelog">Changelog</a>
    <a class="nav-link" href="/api">API reference</a>
    <a class="nav-link" href="/privacy">Privacy</a>
  </div>
</footer>`;
}
