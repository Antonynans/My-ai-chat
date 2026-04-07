"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Sidebar } from "@/components/chat/Sidebar";
import {
  subscribeToRooms,
  subscribeToPublicRooms,
  getPendingInvitesByEmail,
} from "@/lib/firestore";
import { setupPresence, subscribeToPresence } from "@/lib/presence";
import { useChatStore } from "@/lib/store";
import { Room, PresenceData } from "@/lib/types";
import {
  authenticateWithFirebase,
  signOutFromFirebase,
} from "@/lib/firebase-auth";
import toast from "react-hot-toast";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { setCurrentUser, setRooms, setPublicRooms, setPresence, theme } =
    useChatStore();
  const [rooms, setLocalRooms] = useState<Room[]>([]);
  const [publicRooms, setLocalPublicRooms] = useState<Room[]>([]);
  const [presence, setLocalPresence] = useState<Record<string, PresenceData>>(
    {},
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  async function claimInvites(user: { id: string; email?: string | null }) {
    try {
      const email = user.email;
      if (!email) return;
      const invites = await getPendingInvitesByEmail(email.toLowerCase());
      for (const inv of invites) {
        try {
          const resp = await fetch("/api/invites/accept", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inviteId: inv.id }),
          });
          if (!resp.ok) {
            const errBody = await resp.json().catch(() => ({}));
            console.error("Accept invite failed", resp.status, errBody);
          }
        } catch (err) {
          console.error("Failed to accept invite", err);
        }
      }
    } catch (err) {
      console.error("Claim invites failed", err);
    }
  }

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    const user = session.user;
    setCurrentUser(user.id, user.name || user.email, user.image || undefined);

    let cleanupPresence: (() => void) | undefined;
    let unsubRooms: (() => void) | undefined;
    let unsubPublicRooms: (() => void) | undefined;
    let unsubPresence: (() => void) | undefined;

    authenticateWithFirebase()
      .then(() => {
        cleanupPresence = setupPresence(user.id, user.name || user.email);

        const currentPresence = {
          [user.id]: {
            online: true,
            lastSeen: Date.now(),
            displayName: user.name || user.email || "",
          },
        };
        setLocalPresence((prev) => ({ ...prev, ...currentPresence }));
        setPresence({
          ...useChatStore.getState().presence,
          ...currentPresence,
        });

        unsubRooms = subscribeToRooms(user.id, (r) => {
          setLocalRooms(r);
          setRooms(r);
        });

        unsubPublicRooms = subscribeToPublicRooms((r) => {
          setLocalPublicRooms(r);
          setPublicRooms(r);
        });

        unsubPresence = subscribeToPresence((p) => {
          setLocalPresence(p);
          setPresence(p);
        });

        claimInvites(user);
      })
      .catch((err) => {
        console.error("Firebase auth failed:", err);
        toast.error("Connection error — please refresh");
      });

    return () => {
      cleanupPresence?.();
      unsubRooms?.();
      unsubPublicRooms?.();
      unsubPresence?.();
    };
  }, [
    session,
    isPending,
    router,
    setCurrentUser,
    setPresence,
    setPublicRooms,
    setRooms,
  ]);

  async function handleSignOut() {
    await signOutFromFirebase();
    await signOut();
    router.push("/auth/login");
  }

  if (isPending) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "var(--accent)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: "800",
              color: "#0c0c0d",
              fontFamily: "var(--ff-display)",
            }}
          >
            N
          </div>
          <div className="spinner" style={{ width: "20px", height: "20px" }} />
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      <Sidebar
        rooms={rooms}
        publicRooms={publicRooms}
        currentUserId={session.user.id}
        currentUserName={session.user.name || session.user.email}
        currentUserAvatar={session.user.image || undefined}
        presence={presence}
        onSignOut={handleSignOut}
      />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
