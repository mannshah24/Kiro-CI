import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import NetworkStatus from "../components/NetworkStatus";

export const metadata: Metadata = {
  title: "Kiro-CI: The Dark Pipeline",
  description: "Mission Control for autonomous DevOps verification",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <NetworkStatus />
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}
