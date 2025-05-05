"use client";

import { useState } from "react";
import AppSidebar from "@/components/ui/AppSidebar";
import PDFBuilderClient from "../components/PDFBuilderClient";
import TemplatesPage from "../components/TemplatesPage";
import Dashboard from "../components/Dashboard";

export default function Page() {
  return (
    <main>
      <Dashboard />
    </main>
  );
}
