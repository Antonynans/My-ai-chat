import { Room, PresenceData } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { useState } from "react";
import { sendInvite, leaveRoom } from "@/lib/firestore";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { UserPlus, LogOut, Hash, Sparkles } from "lucide-react";

interface MembersPanelProps {
  room: Room;
  presence: Record<string, PresenceData>;
  currentUserId: string;
}

export function MembersPanel({
  room,
  presence,
  currentUserId,
}: MembersPanelProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();

  async function handleSendInvite(e?: React.FormEvent) {
    e?.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return toast.error("Enter an email");
    setSendingInvite(true);
    try {
      await sendInvite(
        room.id,
        room.name,
        email,
        currentUserId,
        room.memberNames?.[currentUserId] || "",
      );
      toast.success(`Invite sent to ${email}`);
      setInviteEmail("");
      setShowInvite(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSendingInvite(false);
    }
  }

  const members = room.members
    .map((uid) => ({
      uid,
      name: room.memberNames?.[uid] || "Unknown",
      presence: presence[uid],
      isOnline: presence[uid]?.online ?? false,
      isCurrent: uid === currentUserId,
    }))
    .sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      if (a.isCurrent) return -1;
      return a.name.localeCompare(b.name);
    });

  const onlineMembers = members.filter((m) => m.isOnline);
  const offlineMembers = members.filter((m) => !m.isOnline);

  return (
    <aside
      className="
      w-50 min-w-50 flex flex-col h-full overflow-y-auto
      bg-(--sidebar) border-l border-(--border)
      scrollbar-thin
    "
    >
      <div className="px-3 pt-3 pb-2 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-(--text3)">
          Members · {room.members.length}
        </span>
        <button
          onClick={() => setShowInvite((s) => !s)}
          title="Invite someone"
          className={`
            flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-medium
            transition-all duration-120 border
            ${
              showInvite
                ? "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-(--accent)"
                : "bg-transparent border-(--border) text-(--text3) hover:text-(--text) hover:bg-(--surface)"
            }
          `}
        >
          <UserPlus size={11} />
          Invite
        </button>
      </div>

      {showInvite && (
        <form
          onSubmit={handleSendInvite}
          className="mx-2 mb-2 p-2.5 rounded-lg border border-(--border) bg-(--surface) flex flex-col gap-2"
        >
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="user@example.com"
            autoFocus
            className="
              w-full px-2.5 py-1.5 rounded-md text-[12px]
              bg-(--surface2) border border-(--border2)
              text-(--text) placeholder:text-(--text3)
              outline-none focus:border-(--accent)
              transition-colors
            "
          />
          <div className="flex gap-1.5">
            <button
              type="submit"
              disabled={sendingInvite || !inviteEmail.trim()}
              className="
                flex-1 px-2 py-1.5 rounded-md text-[11.5px] font-semibold
                bg-(--accent) text-black
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-opacity hover:opacity-85
              "
            >
              {sendingInvite ? "Sending…" : "Send"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInvite(false);
                setInviteEmail("");
              }}
              className="
                px-2 py-1.5 rounded-md text-[11.5px]
                bg-transparent border border-(--border2)
                text-(--text3) hover:text-(--text) hover:bg-(--surface2)
                transition-all
              "
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {onlineMembers.length > 0 && (
          <MemberGroup label={`Online · ${onlineMembers.length}`}>
            {onlineMembers.map((m) => (
              <MemberRow
                key={m.uid}
                name={m.name}
                isOnline
                isCurrent={m.isCurrent}
              />
            ))}
          </MemberGroup>
        )}
        {offlineMembers.length > 0 && (
          <MemberGroup label={`Offline · ${offlineMembers.length}`}>
            {offlineMembers.map((m) => (
              <MemberRow
                key={m.uid}
                name={m.name}
                isOnline={false}
                isCurrent={m.isCurrent}
              />
            ))}
          </MemberGroup>
        )}
      </div>

      <div className="shrink-0 border-t border-(--border) p-3 flex flex-col gap-3">
        <div>
          <div className="text-[10px] font-bold tracking-[0.08em] uppercase text-(--text3) mb-1.5">
            About
          </div>
          <p className="text-[11.5px] text-(--text3) leading-relaxed">
            {room.description || "No description set."}
          </p>
          <p className="text-[11px] text-(--text3) mt-1.5">
            Created by{" "}
            <span className="text-(--text2) font-medium">
              {room.memberNames?.[room.createdBy] || "Unknown"}
            </span>
          </p>
        </div>

        <div className="rounded-lg border border-[color-mix(in_srgb,var(--ai,#5b9cf6)_20%,transparent)] bg-[color-mix(in_srgb,var(--ai,#5b9cf6)_6%,transparent)] px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={11} className="text-(--ai,#5b9cf6)" />
            <span className="text-[11px] font-semibold text-(--ai,#5b9cf6)">
              AI Assistant
            </span>
          </div>
          <p className="text-[11px] text-(--text3) leading-snug">
            Use <code className="ai-mention text-[10px]">@ai</code> in any
            message to invoke Nexus AI
          </p>
        </div>

        <button
          onClick={async () => {
            if (!confirm("Leave this channel?")) return;
            setLeaving(true);
            try {
              await leaveRoom(room.id, currentUserId);
              toast.success("Left channel");
              router.push("/chat");
            } catch {
              toast.error("Failed to leave channel");
            } finally {
              setLeaving(false);
            }
          }}
          disabled={leaving}
          className="
            w-full flex items-center justify-center gap-1.5
            px-3 py-1.5 rounded-lg text-[11.5px] font-medium
            border border-[color-mix(in_srgb,#ef4444_30%,transparent)]
            text-[#ef4444] bg-[color-mix(in_srgb,#ef4444_6%,transparent)]
            hover:bg-[color-mix(in_srgb,#ef4444_14%,transparent)]
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          <LogOut size={11} />
          {leaving ? "Leaving…" : "Leave Channel"}
        </button>
      </div>
    </aside>
  );
}

function MemberGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div className="text-[10px] font-bold tracking-[0.07em] uppercase text-(--text3) px-3.5 py-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function MemberRow({
  name,
  isOnline,
  isCurrent,
}: {
  name: string;
  isOnline: boolean;
  isCurrent: boolean;
}) {
  return (
    <div
      className="
      flex items-center gap-2 px-3 py-1.25 mx-1 rounded-lg
      cursor-default transition-colors duration-100
      hover:bg-(--surface)
    "
    >
      <Avatar name={name} size={22} showPresence isOnline={isOnline} />
      <span
        className={`
        text-[12px] flex-1 truncate
        ${isOnline ? "text-(--text)" : "text-(--text3)"}
      `}
      >
        {name}
        {isCurrent && <span className="text-(--text3) ml-1">(you)</span>}
      </span>
    </div>
  );
}
