"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PDFBuilderClient from "../../components/PDFBuilderClient";

export default function EditorPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("id");
  const templateName = searchParams?.get("name") || "New Template 1";
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchTemplate() {
      setLoading(true);
      if (templateId) {
        // Fetch by ID
        const res = await fetch(`/api/templates?id=${encodeURIComponent(templateId)}`);
        const data = await res.json();
        if (data?.template) {
          if (isMounted) setTemplate(data.template);
          setLoading(false);
          return;
        } else {
          // Not found, fallback to name-based logic
          // (optional: could show error instead)
        }
      }
      // Fallback: fetch or create by name
      const res = await fetch(`/api/templates/by-name?name=${encodeURIComponent(templateName)}`);
      const data = await res.json();
      if (data?.template) {
        if (isMounted) setTemplate(data.template);
        setLoading(false);
      } else {
        // Create if not found
        const createRes = await fetch(`/api/templates/by-name?name=${encodeURIComponent(templateName)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: {} }),
        });
        const createData = await createRes.json();
        if (isMounted) setTemplate(createData.template);
        setLoading(false);
      }
    }
    fetchTemplate();
    return () => { isMounted = false; };
  }, [templateId, templateName]);

  if (loading || !template) {
    return <div style={{ height: "100vh", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ height: "100vh" }}>
      <PDFBuilderClient template={template} />
    </div>
  );
} 