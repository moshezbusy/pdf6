"use client";

import { useState } from "react";
import AppSidebar from "@/components/ui/AppSidebar";
import PDFBuilderClient from "../components/PDFBuilderClient";
import TemplatesPage from "../components/TemplatesPage";
import Dashboard from "../components/Dashboard";

export default function Page() {
  const [active, setActive] = useState("dashboard");
  const [editorTemplateId, setEditorTemplateId] = useState<string | null>(null);

  // Handler for Dashboard's create button
  const handleCreateNew = () => {
    setEditorTemplateId(null);
    setActive("editor");
  };

  // Handler for editing a template
  const handleEditTemplate = (templateId: string) => {
    setEditorTemplateId(templateId);
    setActive("editor");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <AppSidebar active={active} onSelect={setActive} />
      <main style={{ flex: 1, padding: 24 }}>
        {active === "dashboard" && <Dashboard onCreate={handleCreateNew} />}
        {active === "editor" && <PDFBuilderClient templateId={editorTemplateId} />}
        {active === "templates" && <TemplatesPage onEdit={handleEditTemplate} />}
        {active === "exports" && <div>Exports page coming soon...</div>}
        {active === "settings" && <div>Settings page coming soon...</div>}
      </main>
    </div>
  );
}
