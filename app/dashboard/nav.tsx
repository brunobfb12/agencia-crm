"use client";

import React from "react";
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

/* ── Nav items ────────────────────────────────────────────────────── */
const navItemsBase = [
  { href: "/dashboard",               label: "Visão Geral",   Icon: IconOverview },
  { href: "/dashboard/leads",         label: "Leads",         Icon: IconLeads    },
  { href: "/dashboard/conversas",     label: "Conversas",     Icon: IconChat     },
  { href: "/dashboard/clientes",      label: "Clientes",      Icon: IconClients  },
  { href: "/dashboard/agendamentos",  label: "Agendamentos",  Icon: IconSchedule },
  { href: "/dashboard/configuracoes", label: "Configurações", Icon: IconSettings },
];
const navItemsCentral = [
  { href: "/dashboard/central", label: "Painel Central", Icon: IconCentral },
];

/* ── Component ────────────────────────────────────────────────────── */
export default function Nav({
  nome,
  perfil,
  empresa,
}: {
  nome: string;
  perfil: string;
  empresa?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const items = [
    ...navItemsBase,
    ...(perfil === "CENTRAL" ? navItemsCentral : []),
  ];

  const initial = nome.charAt(0).toUpperCase();
  const subLabel =
    perfil === "CENTRAL" ? "Admin · 10 empresas" : (empresa ?? perfil);

  return (
    <aside
      className="sidebar-bg w-[232px] flex flex-col flex-shrink-0 overflow-hidden"
      style={{ borderRight: "1px solid rgba(255,255,255,.06)" }}
    >
      {/* ── Logo ──────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          {/* Icon mark */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #818cf8 60%, #38bdf8 100%)",
              boxShadow: "0 4px 14px rgba(99,102,241,.5)",
            }}
          >
            <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
          </div>
          {/* Name */}
          <div>
            <div className="text-[15px] font-bold gradient-text leading-tight">
              FácilCRM
            </div>
            <div
              className="text-[10.5px] mt-0.5 leading-none font-medium"
              style={{ color: "rgba(148,163,184,.55)" }}
            >
              {subLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="divider mx-4" />

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {/* Section label */}
        <p
          className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "rgba(148,163,184,.35)" }}
        >
          Menu
        </p>

        {items.map(({ href, label, Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`nav-item flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[13px] font-medium ${
                isActive
                  ? "active text-indigo-300"
                  : "text-slate-400"
              }`}
            >
              <span
                className="flex-shrink-0 transition-colors"
                style={{ color: isActive ? "#a5b4fc" : "rgba(148,163,184,.6)" }}
              >
                <Icon />
              </span>
              {label}
              {isActive && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "#818cf8", boxShadow: "0 0 6px #818cf8" }}
                />
              )}
            </Link>
          );
        })}

        {perfil === "CENTRAL" && <div className="divider my-2" />}
      </nav>

      {/* ── User ──────────────────────────────────────────────── */}
      <div className="divider mx-4" />
      <div className="px-4 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #6366f1, #38bdf8)",
              color: "white",
              boxShadow: "0 0 0 2px rgba(99,102,241,.3)",
            }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="text-[12.5px] font-semibold truncate"
              style={{ color: "#e2e8f0" }}
            >
              {nome}
            </div>
            <div className="text-[10.5px] capitalize" style={{ color: "rgba(148,163,184,.5)" }}>
              {perfil === "CENTRAL" ? "Administrador" : "Empresa"}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all"
          style={{ color: "rgba(148,163,184,.5)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.08)";
            (e.currentTarget as HTMLElement).style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(148,163,184,.5)";
          }}
        >
          <IconLogout />
          Sair da conta
        </button>
      </div>
    </aside>
  );
}
