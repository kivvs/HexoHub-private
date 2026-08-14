import type { Metadata } from "next";

import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";


export const metadata: Metadata = {
  title: "HexoHub——by lisiran",
  description: "A windows desktop application built for Hexo",
  keywords: ["Z.ai", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui",  "React"],
  authors: [{ name: "lisiran" }],
  openGraph: {
    title: "HexoHub",
    description: "A windows desktop application built for Hexo",
    url: "https://2am.top",
    siteName: "未来的回忆",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 仅在 Electron 环境中动态加载图片处理脚本，避免 Tauri/浏览器环境 404 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && 'require' in window) {
                  var s = document.createElement('script');
                  s.src = '/electron-image-handler.js';
                  s.async = true;
                  document.head.appendChild(s);
                }
              })();
            `
          }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
