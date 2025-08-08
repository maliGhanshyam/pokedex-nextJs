import Footer from "@/components/Footer";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SearchProvider } from "@/context/SearchContext";

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
        <SearchProvider>
          <Navbar />
          {children}
          <Footer />
        </SearchProvider>
      </body>
    </html>
  );
}
