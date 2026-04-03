"use client";

import Navbar from "@/components/hero/Navbar";
import Team from "@/components/sections/Team";
import Footer from "@/components/sections/Footer";

export default function TeamPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-secondary)",
      }}
    >
      <Navbar />
      <main style={{ paddingTop: 100 }}>
        <Team />
      </main>
      <Footer />
    </div>
  );
}
