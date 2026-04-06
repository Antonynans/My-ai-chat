import { Room, PresenceData } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { useState } from "react";
import { sendInvite, leaveRoom, deleteRoom } from "@/lib/firestore";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { UserPlus, LogOut, Hash, Sparkles, Trash2 } from "lucide-react";

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
      <div className="px-3 pt-3 pb-3 flex items-center justify-between shrink-0 border-b border-(--border)">
        <div>
          <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-(--text3)">
            Members · {room.members.length}
          </span>
        </div>
        <button
          onClick={() => setShowInvite((s) => !s)}
          title="Add users to this room"
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10.5px] font-medium
            transition-all duration-120 border
            ${
              showInvite
                ? "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border-(--accent2) text-(--accent)"
                : "bg-transparent border-(--border) text-(--text3) hover:text-(--text2) hover:bg-(--surface2) hover:border-(--border2)"
            }
          `}
        >
          <UserPlus size={12} />
          Add
        </button>
      </div>

      {showInvite && (
        <form
          onSubmit={handleSendInvite}
          className="mx-3 mt-3 mb-3 p-3 rounded-lg border border-(--border2) bg-(--surface2) flex flex-col gap-2.5"
        >
          <div>
            <label className="text-[10px] font-semibold text-(--text2) block mb-1.5 uppercase tracking-wider">
              Invite by email
            </label>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              type="email"
              autoFocus
              className="
                w-full px-2.5 py-2 rounded-md text-[12px]
                bg-(--surface) border border-(--border)
                text-(--text) placeholder:text-(--text3)
                outline-none focus:border-(--accent) focus:ring-1 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)]
                transition-all
              "
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sendingInvite || !inviteEmail.trim()}
              className="
                flex-1 px-2.5 py-2 rounded-md text-[11.5px] font-semibold
                bg-(--accent) text-black
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all hover:opacity-90 active:scale-95
              "
            >
              {sendingInvite ? "Sending…" : "Invite"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInvite(false);
                setInviteEmail("");
              }}
              className="
                px-2.5 py-2 rounded-md text-[11.5px] font-medium
                bg-transparent border border-(--border2)
                text-(--text3) hover:text-(--text2) hover:bg-(--surface)
                transition-all
              "
            >
              Close
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

        <div className="grid gap-2">
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

          {room.createdBy === currentUserId && (
            <button
              onClick={async () => {
                if (!confirm("Delete this room permanently?")) return;
                setLeaving(true);
                try {
                  await deleteRoom(room.id);
                  toast.success("Room deleted");
                  router.push("/chat");
                } catch {
                  toast.error("Failed to delete room");
                } finally {
                  setLeaving(false);
                }
              }}
              className="
                w-full flex items-center justify-center gap-1.5
                px-3 py-1.5 rounded-lg text-[11.5px] font-semibold
                border border-[color-mix(in_srgb,#f59e0b_30%,transparent)]
                text-[#f59e0b] bg-[color-mix(in_srgb,#f59e0b_6%,transparent)]
                hover:bg-[color-mix(in_srgb,#f59e0b_14%,transparent)]
                transition-all duration-150
              "
            >
              <Trash2 size={11} />
              Delete Room
            </button>
          )}
        </div>
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
