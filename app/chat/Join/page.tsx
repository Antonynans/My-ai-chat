/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useCallback, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

interface PageProps {
  params: Promise<{ token: string }>;
}

type Status = "loading" | "joining" | "success" | "error" | "unauthenticated";

export default function JoinPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [status, setStatus] = useState<Status>("loading");
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  const joinRoom = useCallback(async () => {
    setStatus("joining");
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join");
        setStatus("error");
        return;
      }

      setRoomId(data.roomId);
      setRoomName(data.roomName || "the channel");
      setStatus("success");

      // Auto-redirect after brief success flash
      setTimeout(() => router.push(`/chat/${data.roomId}`), 1200);
    } catch {
      setError("Something went wrong");
      setStatus("error");
    }
  }, [router, token]);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      setStatus("unauthenticated");
      return;
    }

    // Auto-join once authenticated
    joinRoom();
  }, [session, isPending, joinRoom]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.25,
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          animation: "fadeInUp 0.2s ease forwards",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: "48px",
            height: "48px",
            background: "var(--accent)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            fontWeight: "800",
            color: "#0c0c0d",
            fontFamily: "var(--ff-display)",
            margin: "0 auto 24px",
          }}
        >
          N
        </div>

        <div
          style={{
            background: "var(--sidebar)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "32px 28px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          {/* Loading */}
          {(status === "loading" || status === "joining") && (
            <>
              <div
                className="spinner"
                style={{ margin: "0 auto 16px", width: "24px", height: "24px" }}
              />
              <p style={{ fontSize: "14px", color: "var(--text2)", margin: 0 }}>
                {status === "loading"
                  ? "Verifying invite…"
                  : "Joining channel…"}
              </p>
            </>
          )}

          {/* Success */}
          {status === "success" && (
            <>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(61,220,132,0.12)",
                  border: "1px solid rgba(61,220,132,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "20px",
                }}
              >
                ✓
              </div>
              <h2
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: "17px",
                  fontWeight: "700",
                  margin: "0 0 8px",
                  color: "var(--online)",
                }}
              >
                Joined!
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text3)",
                  margin: "0 0 20px",
                }}
              >
                You&apos;ve joined{" "}
                <strong style={{ color: "var(--text2)" }}>#{roomName}</strong>.
                Redirecting…
              </p>
              <Link
                href={`/chat/${roomId}`}
                style={{
                  display: "block",
                  padding: "10px 16px",
                  borderRadius: "9px",
                  background: "var(--accent)",
                  color: "#0c0c0d",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Go to channel →
              </Link>
            </>
          )}

          {/* Error */}
          {status === "error" && (
            <>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(224,82,82,0.1)",
                  border: "1px solid rgba(224,82,82,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "20px",
                }}
              >
                ✕
              </div>
              <h2
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: "17px",
                  fontWeight: "700",
                  margin: "0 0 8px",
                  color: "var(--danger)",
                }}
              >
                Invite invalid
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text3)",
                  margin: "0 0 20px",
                }}
              >
                {error}
              </p>
              <Link
                href="/chat"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  borderRadius: "9px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border2)",
                  color: "var(--text)",
                  fontSize: "13.5px",
                  textDecoration: "none",
                }}
              >
                Back to chat
              </Link>
            </>
          )}

          {/* Not logged in */}
          {status === "unauthenticated" && (
            <>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "20px",
                }}
              >
                🔒
              </div>
              <h2
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: "17px",
                  fontWeight: "700",
                  margin: "0 0 8px",
                }}
              >
                Sign in to join
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text3)",
                  margin: "0 0 20px",
                }}
              >
                You need an account to accept this invite.
              </p>
              <Link
                href={`/auth/login?next=/join/${token}`}
                style={{
                  display: "block",
                  padding: "10px 16px",
                  borderRadius: "9px",
                  background: "var(--accent)",
                  color: "#0c0c0d",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  textDecoration: "none",
                  marginBottom: "10px",
                }}
              >
                Sign in
              </Link>
              <Link
                href={`/auth/register?next=/join/${token}`}
                style={{
                  display: "block",
                  padding: "10px 16px",
                  borderRadius: "9px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border2)",
                  color: "var(--text)",
                  fontSize: "13.5px",
                  textDecoration: "none",
                }}
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
