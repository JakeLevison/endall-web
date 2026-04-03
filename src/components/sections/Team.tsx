"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronDown, X } from "lucide-react";

type TeamMember = {
  name: string;
  title: string;
  image: string;
  bio: string;
  linkedin?: string;
};

const TEAM: TeamMember[] = [
  {
    name: "Jake Levison",
    title: "Founder & CEO",
    image: "/jake-headshot.png",
    bio: "Before founding Endall, Jake spent six years as Director of Business Development at Post Harvest Technologies, a private investment firm dedicated to temperature-controlled infrastructure and post-harvest logistics. He led capital formation, deal origination, and investor relations \u2013 originating institutional investor relationships and advancing transactions across acquisitions, real estate, and development.\n\nAcross PHT\u2019s portfolio companies, Jake worked closely with senior management and operations teams and saw the same pattern across the board: owners running growing service businesses with no one covering the front office. That gap is what led him to start Endall.\n\nPrior to PHT, Jake held roles at Blockworks, M&T Bank, and Morgan Stanley. He holds a B.A. in Philosophy, Politics, and Economics from the University of Pennsylvania, where he played Division I baseball, and serves on the Chairman\u2019s Council of New York Restoration Project.",
    linkedin: "https://www.linkedin.com/in/jakelevison/",
  },
];

function MemberCard({ member }: { member: TeamMember }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ textAlign: "center", maxWidth: 600 }}>
      {/* Headshot */}
      <div
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 250,
          height: 250,
          borderRadius: "50%",
          overflow: "hidden",
          margin: "0 auto 20px",
          cursor: "pointer",
          border: "2px solid rgba(255,255,255,0.08)",
          transition: "border-color 0.3s",
          borderColor: hovered ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
        }}
      >
        <Image
          src={member.image}
          alt={member.name}
          width={500}
          height={500}
          style={{
            objectFit: "cover",
            width: "100%",
            height: "100%",
            objectPosition: "center 20%",
            opacity: hovered ? 0.8 : 1,
            transition: "opacity 0.3s ease",
          }}
        />
      </div>

      {/* Name + Title + expand trigger */}
      <div
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer", marginBottom: 8 }}
      >
        <h3
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 20,
            fontWeight: 600,
            color: "#fff",
            marginBottom: 4,
          }}
        >
          {member.name}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 14,
            color: "var(--text-tertiary)",
            marginBottom: 6,
          }}
        >
          {member.title}
        </p>
        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-muted)",
              textDecoration: "none",
              marginBottom: 6,
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        )}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color: "var(--text-muted)",
            fontSize: 12,
            transition: "color 0.2s",
          }}
        >
          {open ? (
            <X size={14} style={{ transition: "transform 0.3s" }} />
          ) : (
            <ChevronDown size={14} style={{ transition: "transform 0.3s" }} />
          )}
        </div>
      </div>

      {/* Bio accordion */}
      <div
        style={{
          maxHeight: open ? 800 : 0,
          overflow: "hidden",
          transition: "max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
          opacity: open ? 1 : 0,
        }}
      >
        <div
          style={{
            marginTop: 12,
            padding: "20px 24px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            textAlign: "left",
          }}
        >
          {member.bio.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                marginBottom: i < member.bio.split("\n\n").length - 1 ? 14 : 0,
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Team() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="team"
      style={{ padding: "80px 16px" }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "3px",
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Team
        </p>

        {/* Responsive grid — auto-fits future team members side by side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 48,
            justifyItems: "center",
          }}
        >
          {TEAM.map((member) => (
            <MemberCard key={member.name} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}
