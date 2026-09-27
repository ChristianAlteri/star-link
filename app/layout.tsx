import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { getRequestTenant } from "@/lib/tenants";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-archivo",
});

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  if (!tenant) return { title: "Links" };
  return {
    title: tenant.name,
    description: tenant.tagline || tenant.name,
    openGraph: {
      title: tenant.name,
      description: tenant.tagline || tenant.name,
      images: tenant.avatarUrl ? [tenant.avatarUrl] : undefined,
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
