"use client";
import { useState } from "react";
import Sidebar from "@/components/sidebar/sidebar";

const STEPS = [
  { label: "Informations générales", src: "/stitch/new-project-step1.html" },
  { label: "Configuration du temps", src: "/stitch/new-project-step2.html" },
  { label: "Résumé & Validation", src: "/stitch/new-project-step3.html" },
];

export default function NewProjectPage() {
  const [step, setStep] = useState(0);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Step nav bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            flexShrink: 0,
          }}
        >
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                background: step === i ? "#2563eb" : "#f3f4f6",
                color: step === i ? "#fff" : "#64748b",
                transition: "all 0.15s",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background:
                    step === i ? "#fff" : step > i ? "#2563eb" : "#e5e7eb",
                  color: step === i ? "#2563eb" : step > i ? "#fff" : "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {step > i ? "✓" : i + 1}
              </span>
              {s.label}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                ← Précédent
              </button>
            )}
            {step < STEPS.length - 1 && (
              <button
                onClick={() => setStep((s) => s + 1)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Suivant →
              </button>
            )}
          </div>
        </div>
        <iframe
          src={STEPS[step].src}
          title={STEPS[step].label}
          style={{ flex: 1, border: "none", display: "block" }}
        />
      </main>
    </div>
  );
}
