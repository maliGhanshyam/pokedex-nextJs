import Footer from "@/components/Footer";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata = {
  title: "PokeDex",
  description: "Get your pokemon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
