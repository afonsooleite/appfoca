"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Activity,
  Calendar,
  Trophy,
  Timer,
  Settings,
  Menu,
  X
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/atletas", label: "Atletas", icon: Users },
    { href: "/equipas", label: "Escalões", icon: UsersRound },
    { href: "/treinos", label: "Treinos", icon: Activity },
    { href: "/planeamento", label: "Planeamento", icon: Calendar },
    { href: "/tacs", label: "Verificar TACs", icon: Timer },
    { href: "/admin/tacs", label: "Gestão de TACs", icon: Settings },
    { href: "/competicoes", label: "Competições", icon: Trophy },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-gray-900 rounded-lg border border-gray-800 text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 h-screen w-64 bg-[#111827] border-r border-white/5 
        flex flex-col p-6 z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 mb-12">
          <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-[0_4px_15px_rgba(168,85,247,0.3)] border border-[rgba(255,255,255,0.08)] flex-shrink-0 bg-transparent flex items-center justify-center">
            <img
              src="/logo-foca.png"
              alt="Logo FOCA"
              className="w-[120%] h-[120%] object-cover mix-blend-screen brightness-110 contrast-125"
            />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
            FOCA
          </h1>
        </div>

        <nav className="flex flex-col gap-2 font-medium flex-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname?.startsWith(link.href) && link.href !== '/');

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group border-l-4
                  ${isActive
                    ? 'bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]'
                    : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border-transparent'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-[#a855f7]' : 'text-[#94a3b8] group-hover:text-slate-300'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Area Placeholder */}
        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              AF
            </div>
            <div>
              <p className="text-sm font-medium text-white">Afonso Leite</p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
