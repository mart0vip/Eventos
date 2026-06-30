import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Equestrian Events - Horse Riding Event Management",
  description:
    "Discover, create, and manage horse riding events. From show jumping to trail rides, find your next equestrian adventure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
