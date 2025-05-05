"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Upload, Settings, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const menu = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/" },
  { key: "templates", label: "Templates", icon: FileText, route: "/templates" },
  { key: "exports", label: "Exports", icon: Upload, route: "/exports" },
  { key: "settings", label: "Settings", icon: Settings, route: "/settings" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col items-center py-4 px-2 bg-white border-r h-full min-h-screen w-20">
      {/* Logo at the top */}
      <div className="mb-8 flex items-center justify-center w-10 h-10 rounded bg-muted">
        {/* Sample logo: replace with your SVG/logo as needed */}
        <Square className="w-6 h-6 text-primary" />
      </div>
      {/* Menu */}
      {menu.map((item) => {
        const isActive = pathname === item.route || (item.route === "/" && pathname === "/");
        return (
          <Link
            key={item.key}
            href={item.route}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-2 rounded-md w-full mb-2 transition-colors",
              isActive ? "bg-muted text-primary font-bold" : "text-muted-foreground hover:bg-muted"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
} 