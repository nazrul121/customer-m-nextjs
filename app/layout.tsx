import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import "./globals.css";
import ToastProvider from "@/providers/ToastProvider"; // We will create this below

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning> 
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('app-theme') || 'night';
                  document.documentElement.setAttribute('data-theme', savedTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>  
        <ReactQueryProvider>
          {/* We move Toast logic to a Client Component */}
          <ToastProvider /> 
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
