import React from "react";
import { Button } from "@/components/ui/button";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  headline: string;
  icon: React.ReactNode;
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

export default function DashboardSidebar({ headline, icon, tabs, activeTab, setActiveTab }: DashboardSidebarProps) {
  return (
    <div className="md:w-64 shrink-0 border-r border-gray-300/50 pr-4 h-full min-h-screen flex flex-col">
      <div className="flex justify-center items-center mt-4 mb-6 mx-auto">
        {icon}
        <span className="text-2xl font-bold ml-2">{headline}</span>
      </div>
      <div className="space-y-1 w-full">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
} 