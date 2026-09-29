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
    <a class="wordmark" href="/">DEVREL.md</a>
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
