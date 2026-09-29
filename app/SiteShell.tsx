import { siteHeaderHtml, siteFooterHtml, toggleScript } from "@/lib/siteLayout";

/** The shared header and footer (see lib/siteLayout.ts) around a React page.
 * The header and footer are the same HTML strings the hand-built routes use,
 * so the chrome is defined in exactly one place. */
export function SiteShell({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: siteHeaderHtml(path) }} style={{ display: "contents" }} />
      <main>{children}</main>
      <div dangerouslySetInnerHTML={{ __html: siteFooterHtml() }} style={{ display: "contents" }} />
      <script dangerouslySetInnerHTML={{ __html: toggleScript() }} />
    </>
  );
}
