"use client";

import { useState } from "react";
import AppSidebar from "@/components/ui/AppSidebar";
import PDFBuilderClient from "../components/PDFBuilderClient";
import TemplatesPage from "../components/TemplatesPage";

export default function Page() {
  const [active, setActive] = useState("editor");

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <AppSidebar active={active} onSelect={setActive} />
      <main style={{ flex: 1, padding: 24 }}>
        {active === "editor" && <PDFBuilderClient />}
        {active === "templates" && (
          <TemplatesPage
            templates={[
              { id: "1", name: "Invoice", preview: "/static/invoice-preview.png" },
              { id: "2", name: "Quote", preview: "/static/quote-preview.png" },
              { id: "3", name: "Receipt", preview: "/static/receipt-preview.png" },
            ]}
            onOpen={() => setActive("editor")}
          />
        )}
        {active === "exports" && <div>Exports page coming soon...</div>}
        {active === "settings" && <div>Settings page coming soon...</div>}
      </main>
    </div>
  );
}
