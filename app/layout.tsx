import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DEVREL.md",
  description: "The open spec and skill library for developer relations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
