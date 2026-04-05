"use client";
import { useChatStore } from "@/lib/store";
import Link from "next/link";

export default function ChatHomePage() {
  const { rooms } = useChatStore();

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "40px",
      }}
    >
      <div
        style={{ textAlign: "center", maxWidth: "440px" }}
        className="animate-fade-in-up"
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            background: "var(--accent)",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "24px",
            fontWeight: "800",
            color: "#0c0c0d",
            fontFamily: "var(--ff-display)",
          }}
        >
          N
        </div>

        <h1
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: "26px",
            fontWeight: "700",
            marginBottom: "10px",
            letterSpacing: "-0.5px",
          }}
        >
          Welcome to Nexus
        </h1>

        <p
          style={{
            color: "var(--text3)",
            fontSize: "14px",
            lineHeight: "1.7",
            marginBottom: "28px",
          }}
        >
          Your team workspace with real-time messaging and AI assistance.
          <br />
          Select a channel from the sidebar or create a new one.
        </p>

        <div
          style={{
            background: "var(--sidebar)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "rgba(91,156,246,0.12)",
                border: "1px solid rgba(91,156,246,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1.5L10.5 6.5H15L11.5 9.5L12.5 14L8 11.5L3.5 14L4.5 9.5L1 6.5H5.5L8 1.5Z"
                  fill="var(--ai)"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--ai)",
                fontFamily: "var(--ff-display)",
              }}
            >
              Nexus AI
            </span>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text2)",
              lineHeight: "1.6",
            }}
          >
            Invoke the AI assistant at any time by typing{" "}
            <span className="ai-mention">@ai</span> in a message. Nexus
            understands the full conversation context and responds like a team
            member.
          </p>
          <div
            style={{
              marginTop: "10px",
              padding: "8px 12px",
              background: "var(--surface)",
              borderRadius: "7px",
              fontSize: "12.5px",
              color: "var(--text3)",
              fontFamily: "var(--ff-mono)",
            }}
          >
            @ai what&apos;s the best approach for rate limiting a Next.js API?
          </div>
        </div>

        {rooms.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text3)",
                marginBottom: "4px",
              }}
            >
              Jump into a channel:
            </p>
            {rooms.slice(0, 4).map((room) => (
              <Link
                key={room.id}
                href={`/chat/${room.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    background: "var(--sidebar)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border2)";
                    e.currentTarget.style.background = "var(--surface)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--sidebar)";
                  }}
                >
                  <span style={{ color: "var(--text3)" }}>#</span>
                  <span
                    style={{
                      fontSize: "13.5px",
                      fontWeight: "500",
                      color: "var(--text)",
                    }}
                  >
                    {room.name}
                  </span>
                  {room.lastMessage && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text3)",
                        marginLeft: "auto",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "140px",
                      }}
                    >
                      {room.lastMessage}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--text3)" }}>
            No channels yet — create one with the{" "}
            <strong style={{ color: "var(--text2)" }}>+</strong> button in the
            sidebar.
          </p>
        )}
      </div>
    </div>
  );
}
