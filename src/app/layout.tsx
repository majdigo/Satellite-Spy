import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Satellite Spy — Spatial Intelligence Dashboard",
  description:
    "Real-time spy satellite simulator with 3D globe visualization, live satellite & aircraft tracking, geopolitical event monitoring, conflict analysis, and intelligence correlation engine.",
  keywords: [
    "satellite tracker",
    "spatial intelligence",
    "geopolitical analysis",
    "CesiumJS",
    "OSINT",
    "conflict monitoring",
    "GDELT",
    "satellite simulator",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-mono">{children}</body>
    </html>
  );
}
