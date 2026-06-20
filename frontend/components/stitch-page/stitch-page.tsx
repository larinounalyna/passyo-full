"use client";
import Sidebar from "@/components/sidebar/sidebar";

interface StitchPageProps {
  src: string;
  title?: string;
}

export default function StitchPage({ src, title }: StitchPageProps) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <iframe
          src={src}
          title={title}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
        />
      </main>
    </div>
  );
}
