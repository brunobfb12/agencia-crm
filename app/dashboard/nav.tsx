"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/* ── Icons ────────────────────────────────────────────────────────── */
const IconOverview = () => (
  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
    <rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" />
  </svg>
);
const IconLeads = () => (
  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V8l9-5 9 5v13M9 21v-6h6v6" />
  </svg>
);
const IconChat = () => (
  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8h9M7.5 12h6M3 6.5A2.5 2.5 0 015.5 4h13A2.5 2.5 0 0121 6.5v9a2.5 2.5 0 01-2.5 2.5H13l-4 3v-3H5.5A2.5 2.5 0 013 15.5v-9z" />
  </svg>
);
const IconClients = () => (
  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3M8 11a3 3 0 100-6 3 3 0 000 6zm-5 8a5 5 0 0110 0M18 14a4 4 0 014 4" />
  </svg>
);
const IconSchedule = () => (
  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </svg>
);
const IconVendas = () => (
  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconCampanhas = () => (
  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);
const IconSettings = () => (
  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const IconCentral = () => (
  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
);
const IconLogout = () => (
  <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const IconMenu = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconClose = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconSun = () => (
  <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" />
    <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const IconMoon = () => (
  <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
  </svg>
);

/* ── Theme toggle ─────────────────────────────────────────────────── */
function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setDark(saved !== "light");
  }, []);

  function toggle() {
    const next = dark ? "light" : "dark";
    setDark(!dark);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        className="p-2 rounded-lg transition-colors"
        style={{ color: "var(--muted)" }}
        title={dark ? "Tema claro" : "Tema escuro"}
      >
        {dark ? <IconSun /> : <IconMoon />}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all mb-1"
      style={{ color: "var(--muted-2)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--card-2)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {dark ? <IconSun /> : <IconMoon />}
      {dark ? "Tema claro" : "Tema escuro"}
    </button>
  );
}

/* ── Nav items ────────────────────────────────────────────────────── */
const navItemsBase = [
  { href: "/dashboard",               label: "Visão Geral",   Icon: IconOverview  },
  { href: "/dashboard/leads",         label: "Leads",         Icon: IconLeads     },
  { href: "/dashboard/vendas",        label: "Vendas",         Icon: IconVendas    },
  { href: "/dashboard/conversas",     label: "Conversas",     Icon: IconChat      },
  { href: "/dashboard/clientes",      label: "Clientes",      Icon: IconClients   },
  { href: "/dashboard/agendamentos",  label: "Agendamentos",  Icon: IconSchedule  },
  { href: "/dashboard/campanhas",     label: "Campanhas",     Icon: IconCampanhas },
  { href: "/dashboard/configuracoes", label: "Configurações", Icon: IconSettings  },
];
const navItemsCentral = [
  { href: "/dashboard/central", label: "Painel Central", Icon: IconCentral },
];

/* ── Sidebar content (shared between desktop and mobile) ──────────── */
function SidebarContent({
  nome, perfil, empresa, items, onNavigate,
}: {
  nome: string; perfil: string; empresa?: string;
  items: typeof navItemsBase; onNavigate: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const initial = nome.charAt(0).toUpperCase();
  const subLabel = perfil === "CENTRAL" ? "Admin · 10 empresas" : (empresa ?? perfil);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6366f1 0%,#818cf8 60%,#38bdf8 100%)", boxShadow: "0 4px 14px rgba(99,102,241,.5)" }}
          >
            <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-bold gradient-text leading-tight">FácilCRM</div>
            <div className="text-[10.5px] mt-0.5 leading-none font-medium" style={{ color: "var(--muted-2)" }}>
              {subLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="divider mx-4" />

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted-3)" }}>
          Menu
        </p>
        {items.map(({ href, label, Icon }) => {
          const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`nav-item flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[13px] font-medium ${
                isActive ? "active text-indigo-300" : "text-slate-400"
              }`}
            >
              <span className="flex-shrink-0 transition-colors" style={{ color: isActive ? "#a5b4fc" : "var(--muted)" }}>
                <Icon />
              </span>
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#818cf8", boxShadow: "0 0 6px #818cf8" }} />
              )}
            </Link>
          );
        })}
        {perfil === "CENTRAL" && <div className="divider my-2" />}
      </nav>

      {/* User */}
      <div className="divider mx-4" />
      <div className="px-4 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6366f1,#38bdf8)", color: "white", boxShadow: "0 0 0 2px rgba(99,102,241,.3)" }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold truncate" style={{ color: "var(--text-2)" }}>{nome}</div>
            <div className="text-[10.5px] capitalize" style={{ color: "var(--muted-2)" }}>
              {perfil === "CENTRAL" ? "Administrador" : "Empresa"}
            </div>
          </div>
        </div>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all"
          style={{ color: "var(--muted-2)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.08)"; (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted-2)"; }}
        >
          <IconLogout />
          Sair da conta
        </button>
      </div>
    </>
  );
}

/* ── Main Nav component ───────────────────────────────────────────── */
export default function Nav({ nome, perfil, empresa }: { nome: string; perfil: string; empresa?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const items = [...navItemsBase, ...(perfil === "CENTRAL" ? navItemsCentral : [])];

  return (
    <>
      {/* ── Desktop sidebar (md+) ──────────────────────────────── */}
      <aside
        className="sidebar-bg hidden md:flex w-[232px] flex-col flex-shrink-0 overflow-hidden"
        style={{ borderRight: "1px solid var(--border)" }}
      >
        <SidebarContent nome={nome} perfil={perfil} empresa={empresa} items={items} onNavigate={() => {}} />
      </aside>

      {/* ── Mobile top bar ─────────────────────────────────────── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6366f1 0%,#818cf8 60%,#38bdf8 100%)" }}
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
          </div>
          <span className="text-[15px] font-bold gradient-text">FácilCRM</span>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "var(--muted)" }}
          >
            <IconMenu />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer backdrop ─────────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ──────────────────────────────────────── */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-[280px] sidebar-bg flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderRight: "1px solid var(--border)" }}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg"
          style={{ color: "var(--muted)" }}
        >
          <IconClose />
        </button>

        <SidebarContent
          nome={nome} perfil={perfil} empresa={empresa} items={items}
          onNavigate={() => setOpen(false)}
        />
      </aside>
    </>
  );
}
