"use client";

export default function TasksMock() {
  const columns = [
    {
      title: "To Do",
      cards: [
        { text: "Update proposal", priority: "#f59e0b" },
        { text: "Review contract", priority: "#ef4444" },
      ],
    },
    {
      title: "In Progress",
      cards: [{ text: "Client onboarding", priority: "#3b82f6" }],
    },
    {
      title: "Done",
      cards: [{ text: "Send invoice", priority: "#22c55e" }],
    },
  ];

  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, fontFamily: "var(--font-sans), sans-serif" }}>
      <div style={{ display: "flex", gap: 8 }}>
        {columns.map((col) => (
          <div key={col.title} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {col.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {col.cards.map((card) => (
                <div
                  key={card.text}
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "6px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: card.priority,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 10, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {card.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
