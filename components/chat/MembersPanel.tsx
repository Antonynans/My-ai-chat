import { Room, PresenceData, Message } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useEffect } from "react";
import { addUserToRoom, leaveRoom, deleteRoom } from "@/lib/firestore";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { UserPlus, LogOut, Sparkles, Trash2, Search, X } from "lucide-react";

interface MembersPanelProps {
  room: Room;
  presence: Record<string, PresenceData>;
  currentUserId: string;
  messages?: Message[];
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export function MembersPanel({
  room,
  presence,
  currentUserId,
  messages = [],
}: MembersPanelProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [addingUser, setAddingUser] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (showInvite && availableUsers.length === 0) {
      fetchUsers();
    }
  }, [showInvite]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers([]);
      return;
    }

    const filtered = availableUsers
      .filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .filter((user) => !room.members.includes(user.id));

    setFilteredUsers(filtered);
  }, [searchQuery, availableUsers, room.members]);

  async function fetchUsers() {
    try {
      const resp = await fetch("/api/users", { credentials: "include" });
      if (!resp.ok) throw new Error("Failed to fetch users");
      const data = await resp.json();
      setAvailableUsers(data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users");
    }
  }

  async function handleAddUser() {
    if (!selectedUser) return;

    setAddingUser(true);
    try {
      await addUserToRoom(room.id, selectedUser.id, selectedUser.name);
      toast.success(`Added ${selectedUser.name} to the room`);
      setSelectedUser(null);
      setSearchQuery("");
      setShowInvite(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add user");
    } finally {
      setAddingUser(false);
    }
  }

  function handleUserSelect(user: User) {
    setSelectedUser(user);
    setSearchQuery(user.name);
    setFilteredUsers([]);
  }

  function clearSelection() {
    setSelectedUser(null);
    setSearchQuery("");
  }

  function confirmDeleteRoom(): Promise<boolean> {
    return new Promise((resolve) => {
      toast.custom(
        (toastObj) => (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className={`absolute inset-0 bg-black transition-opacity duration-200 ${
                toastObj.visible ? "opacity-50" : "opacity-0"
              }`}
              onClick={() => {
                toast.dismiss(toastObj.id);
                resolve(false);
              }}
            />

            <div
              className={`fixed top-1/5 z-10 w-full max-w-sm mx-4 rounded-2xl border border-(--border2) bg-(--surface) p-6 shadow-2xl
          transition-all duration-200
          ${toastObj.visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}
        `}
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-[color-mix(in_srgb,#f59e0b_12%,transparent)]">
                  <Trash2 size={24} className="text-[#f59e0b]" />
                </div>
              </div>

              <h3 className="text-center text-lg font-bold text-(--text) mb-2">
                Delete Channel
              </h3>
              <p className="text-center text-[13px] text-(--text3) mb-6 leading-relaxed">
                This will permanently delete{" "}
                <span className="font-semibold text-(--text2)">
                  {room.name}
                </span>{" "}
                and all its messages. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    toast.dismiss(toastObj.id);
                    resolve(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold
                    bg-(--surface2) border border-(--border2)
                    text-(--text2) hover:bg-(--surface3) hover:border-(--border)
                    transition-all duration-150 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(toastObj.id);
                    resolve(true);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold
                    bg-[#f59e0b] text-black
                    hover:bg-[#d97706] 
                    transition-all duration-150 active:scale-95 shadow-lg shadow-[#f59e0b]/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ),
        { duration: Infinity, position: "top-center" },
      );
    });
  }

  const members = room.members
    .map((uid) => {
      //
      let isOnline = presence[uid]?.online ?? false;

      if (!isOnline) {
        const recentMessage = messages
          .filter((msg) => msg.senderId === uid)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

        if (recentMessage) {
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          isOnline = recentMessage.createdAt.getTime() > fiveMinutesAgo;
        }
      }

      return {
        uid,
        name: room.memberNames?.[uid] || "Unknown",
        presence: presence[uid],
        isOnline,
        isCurrent: uid === currentUserId,
      };
    })
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
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedUser) handleAddUser();
          }}
          className="mx-3 mt-3 mb-3 p-3 rounded-lg border border-(--border2) bg-(--surface2) flex flex-col gap-2.5"
        >
          <div>
            <label className="text-[10px] font-semibold text-(--text2) block mb-1.5 uppercase tracking-wider">
              Add member
            </label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Search size={14} className="text-(--text3) shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedUser && e.target.value !== selectedUser.name) {
                      setSelectedUser(null);
                    }
                  }}
                  placeholder="Search users..."
                  autoFocus
                  className="
                    flex-1 px-2.5 py-2 rounded-md text-[12px]
                    bg-(--surface) border border-(--border)
                    text-(--text) placeholder:text-(--text3)
                    outline-none focus:border-(--accent) focus:ring-1 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)]
                    transition-all
                  "
                />
                {selectedUser && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="p-1 rounded-md hover:bg-(--surface3) transition-colors"
                  >
                    <X size={14} className="text-(--text3)" />
                  </button>
                )}
              </div>

              {filteredUsers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-(--surface) border border-(--border) rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleUserSelect(user);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-(--surface2) transition-colors flex items-center gap-2"
                    >
                      <Avatar
                        name={user.name}
                        photoURL={user.image}
                        size={20}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-(--text) truncate">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-(--text3) truncate">
                          {user.email}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={addingUser || !selectedUser}
                className="
                  flex-1 px-2.5 py-2 rounded-md text-[11.5px] font-semibold
                  bg-(--accent) text-black
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all hover:opacity-90 active:scale-95
                "
              >
                {addingUser ? "Adding…" : "Add to Room"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInvite(false);
                  setSearchQuery("");
                  setSelectedUser(null);
                  setFilteredUsers([]);
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
                const confirmed = await confirmDeleteRoom();
                if (!confirmed) return;
                setLeaving(true);
                try {
                  await deleteRoom(room.id);
                  toast.success("Room deleted");
                  router.push("/chat");
                } catch (err: unknown) {
                  const message =
                    err instanceof Error
                      ? err.message
                      : "Failed to delete room";
                  toast.error(message);
                  console.error("Room deletion failed", err);
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
