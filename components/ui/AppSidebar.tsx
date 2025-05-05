import React from "react";
import { LayoutDashboard, FileText, Upload, Settings, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const menu = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "templates", label: "Templates", icon: Upload },
  { key: "exports", label: "Exports", icon: Settings },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function AppSidebar({ active = "dashboard", onSelect }: { active?: string; onSelect?: (key: string) => void }) {
  return (
    <aside
      className="flex flex-col items-center bg-background border-r h-screen w-14 py-4 shadow-sm z-20"
      style={{ minWidth: 56 }}
    >
      {/* Logo at the top */}
      <div className="mb-8 flex items-center justify-center w-10 h-10 rounded bg-muted">
        {/* Sample logo: replace with your SVG/logo as needed */}
        <Square className="w-6 h-6 text-primary" />
      </div>
      {/* Menu */}
      <nav className="flex flex-col gap-4 w-full items-center">
        {menu.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={cn(
              "flex flex-col items-center justify-center w-10 h-10 rounded transition-colors hover:bg-accent focus:bg-accent",
              active === key ? "bg-accent text-primary" : "text-muted-foreground"
            )}
            onClick={() => onSelect?.(key)}
            title={label}
            type="button"
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium leading-none mt-0.5">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
} 