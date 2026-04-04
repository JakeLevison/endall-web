"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Testimonial {
  text: string;
  name: string;
  role: string;
  location: string;
}

const testimonials: Testimonial[] = [
  {
    text: "We used to spend half the morning sorting through voicemails and callbacks. Now every call gets answered, qualified, and booked before my first coffee. We've picked up three commercial contracts this quarter that would've gone to voicemail before.",
    name: "Mike Dorin",
    role: "Owner, 18 techs",
    location: "Northern Virginia",
  },
  {
    text: "I was doing estimates on napkins and sending proposals two days late. Endall builds the estimate, generates the proposal, and gets it out same-day. Our close rate on bids over $50K went from maybe 20% to closer to 40%.",
    name: "Carlos Medina",
    role: "Operations Manager, 12 techs",
    location: "Houston, TX",
  },
  {
    text: "Morning briefings alone are worth it. I know exactly what came in overnight, which jobs need attention, and what's commercial before I even get to the office. My office manager used to spend two hours a day on that. Now it's just there.",
    name: "Dana Kowalski",
    role: "President, 22 techs",
    location: "Columbus, OH",
  },
];

const firstColumn = [testimonials[0], testimonials[1], testimonials[2]];
const secondColumn = [testimonials[1], testimonials[2], testimonials[0]];
const thirdColumn = [testimonials[2], testimonials[0], testimonials[1]];

function TestimonialsColumn({
  testimonials: items,
  duration = 15,
  className = "",
}: {
  testimonials: Testimonial[];
  duration?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={className} style={{ overflow: "hidden" }}>
      <motion.ul
        animate={prefersReducedMotion ? {} : { translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          paddingBottom: 20,
          listStyle: "none",
          margin: 0,
          padding: "0 0 20px 0",
        }}
      >
        {[0, 1].map((copyIndex) => (
          <React.Fragment key={copyIndex}>
            {items.map((item, i) => (
              <motion.li
                key={`${copyIndex}-${i}`}
                aria-hidden={copyIndex === 1 ? "true" : undefined}
                whileHover={
                  prefersReducedMotion
                    ? {}
                    : {
                        scale: 1.03,
                        y: -6,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        },
                      }
                }
                style={{
                  padding: "28px 24px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  maxWidth: 320,
                  width: "100%",
                  cursor: "default",
                  transition: "border-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.06)";
                }}
              >
                <blockquote style={{ margin: 0, padding: 0 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: "var(--text-tertiary)",
                      margin: 0,
                    }}
                  >
                    &ldquo;{item.text}&rdquo;
                  </p>
                  <footer
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      marginTop: 20,
                    }}
                  >
                    <cite
                      style={{
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        fontStyle: "normal",
                        color: "#ffffff",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.name}
                    </cite>
                    <span
                      style={{
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: 12,
                        color: "var(--text-muted)",
                      }}
                    >
                      {item.role}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--text-faint)",
                        marginTop: 2,
                      }}
                    >
                      {item.location}
                    </span>
                  </footer>
                </blockquote>
              </motion.li>
            ))}
          </React.Fragment>
        ))}
      </motion.ul>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      style={{ padding: "80px 16px", overflow: "hidden" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Testimonials
        </p>
        <h2
          id="testimonials-heading"
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Contractors who stopped losing time.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 16,
            color: "var(--text-tertiary)",
            textAlign: "center",
            maxWidth: 480,
            margin: "0 auto 48px",
            lineHeight: 1.6,
          }}
        >
          Real feedback from teams running Endall in the field.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            maxHeight: 600,
            overflow: "hidden",
            maskImage:
              "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <TestimonialsColumn testimonials={firstColumn} duration={18} />
          <div className="hidden md:block">
            <TestimonialsColumn
              testimonials={secondColumn}
              duration={22}
            />
          </div>
          <div className="hidden lg:block">
            <TestimonialsColumn
              testimonials={thirdColumn}
              duration={20}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
