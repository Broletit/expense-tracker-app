import "../style/globals.css";
import Providers from "./providers";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";

export const metadata = {
  title: "Expense Tracker",
  description: "Ứng dụng theo dõi chi tiêu cá nhân",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 flex flex-col min-h-screen">
        
        <Providers>
          <Header />

         <main className="flex-1 flex justify-center px-4 md:px-4 py-8 md:py-6">
            <div className="w-full max-w-8xl px-4 sm:px-4">
              {children}
            </div>
          </main>


          <Footer />
        </Providers>
      </body>
    </html>
  );
}
