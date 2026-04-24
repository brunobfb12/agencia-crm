"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Visão Geral", icon: "📊" },
  { href: "/dashboard/leads", label: "Leads", icon: "🎯" },
  { href: "/dashboard/clientes", label: "Clientes", icon: "👥" },
  { href: "/dashboard/agendamentos", label: "Agendamentos", icon: "📅" },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full">
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Agência CRM</h1>
          <p className="text-xs text-gray-400 mt-1">10 empresas · WhatsApp</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
          Powered by Claude AI
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
