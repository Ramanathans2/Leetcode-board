import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export const metadata = {
  title: "EEE Codez | LeetCode Intelligence Dashboard",
  description: 'Real-Time LeetCode Performance Intelligence Dashboard for EEE Department',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <Header />
          <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
