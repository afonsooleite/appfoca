import type { Metadata } from "next";
import Sidebar from "./components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "FOCA - Gestão de Treinos",
  description: "Sistema de Gestão Desportiva SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="dark">
      <body className="bg-[#050816] text-slate-100 selection:bg-purple-500/30 overflow-x-hidden min-h-screen">
        {/* Decorative Background Gradients */}
        <div 
          className="fixed inset-0 z-0 pointer-events-none" 
          style={{
            background: `
              radial-gradient(circle at top right, rgba(168,85,247,0.12), transparent 40%),
              radial-gradient(circle at bottom left, rgba(236,72,153,0.08), transparent 40%)
            `
          }} 
        />

        <div className="flex min-h-screen relative z-10">
          <Sidebar />

          <main className="flex-1 p-4 md:p-8 h-screen overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full h-full pb-20">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}