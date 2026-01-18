"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

export default function SavePDFButton({ voucherNo, customerName }: { voucherNo: string, customerName: string }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSavePDF = async () => {
    setIsGenerating(true);
    const element = document.getElementById("printable-invoice");
    if (!element) return;

    // Create a clean filename
    const safeName = customerName.replace(/\s+/g, '_');
    const customFileName = `Inv_${safeName}_${voucherNo}`;

    // Collect styles
    const styles = Array.from(document.styleSheets)
      .map(s => { try { return Array.from(s.cssRules).map(r => r.cssText).join(""); } catch { return ""; } })
      .join("");

    const fullHtml = `<html><head><style>${styles}</style></head><body>${element.outerHTML}</body></html>`;

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: fullHtml, fileName: customFileName }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${customFileName}.pdf`; // Double check the name on client side
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Error downloading PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button onClick={handleSavePDF} disabled={isGenerating} className="btn btn-secondary btn-sm gap-2 no-print">
      {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
      {isGenerating ? "Generating..." : "Save PDF"}
    </button>
  );
}