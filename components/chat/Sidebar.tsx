"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Room, PresenceData } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { createRoom } from "@/lib/firestore";
import {
  LogOut,
  Plus,
  X,
  Hash,
  Lock,
  Compass,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";

interface SidebarProps {
  rooms: Room[];
  publicRooms?: Room[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  presence: Record<string, PresenceData>;
  onSignOut: () => void;
}

export function Sidebar({
  rooms,
  publicRooms = [],
  currentUserId,
  currentUserName,
  currentUserAvatar,
  presence,
  onSignOut,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isInRoom = pathname.startsWith("/chat/") && pathname !== "/chat";

  const [showCreate, setShowCreate] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchResults, setSearchResults] = useState<Room[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [serverRooms, setServerRooms] = useState<Room[]>(rooms);

  useEffect(() => {
    setServerRooms(rooms);
  }, [rooms]);

  useEffect(() => {
    let mounted = true;
    async function fetchMyRooms() {
      try {
        const resp = await fetch("/api/rooms/mine", { credentials: "include" });
        if (!resp.ok) return;
        const data = await resp.json();
        if (data?.rooms && mounted)
          setServerRooms((prev) => {
            const map = new Map(prev.map((r) => [r.id, r]));
            for (const r of data.rooms) map.set(r.id, r);
            return Array.from(map.values());
          });
      } catch (err) {
        console.error("Failed to fetch my rooms", err);
      }
    }
    fetchMyRooms();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDiscoverOpen = () => {
    setShowDiscover(true);
    setShowCreate(false);
    setSearchQ("");
    setSearchResults(
      publicRooms.filter((r) => !r.members.includes(currentUserId)),
    );
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setCreating(true);
    try {
      const id = await createRoom(
        newRoomName.trim(),
        newRoomDesc.trim(),
        currentUserId,
        currentUserName,
        isPrivate,
      );
      setShowCreate(false);
      setNewRoomName("");
      setNewRoomDesc("");
      toast.success(`#${newRoomName} created!`);
      window.location.href = `/chat/${id}`;
    } catch {
      toast.error("Failed to create room");
    } finally {
      setCreating(false);
    }
  }

  async function handleSearch() {
    setSearching(true);
    try {
      const available = publicRooms.filter(
        (r) => !r.members.includes(currentUserId),
      );
      setSearchResults(
        !searchQ.trim()
          ? available
          : available.filter(
              (r) =>
                r.name.toLowerCase().includes(searchQ.toLowerCase()) ||
                r.description?.toLowerCase().includes(searchQ.toLowerCase()),
            ),
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleJoin(room: Room) {
    try {
      const resp = await fetch("/api/rooms/join", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        toast.error(body?.error || "Failed to join channel");
        return;
      }
      setShowDiscover(false);
      toast.success(`Joined #${room.name}`);
      window.location.href = `/chat/${room.id}`;
    } catch {
      toast.error("Failed to join channel");
    }
  }

  const discoverRooms = publicRooms.filter(
    (r) => !serverRooms.some((rm) => rm.id === r.id),
  );
  const onlineCount = Object.values(presence).filter((p) => p.online).length;

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 h-13 border-b border-(--border) shrink-0">
        <div className="w-6 h-6 rounded-[7px] bg-(--accent) flex items-center justify-center text-[11px] font-black text-black shrink-0 tracking-[-0.5px]">
          N
        </div>
        <span className="text-[13px] font-bold tracking-[-0.2px] text-(--text)">
          Nexus
        </span>
        <div className="flex items-center gap-0.5 ml-auto">
          <NxIconBtn
            title="Discover channels"
            onClick={() => {
              if (isMobile) setMobileOpen(false);
              handleDiscoverOpen();
            }}
          >
            <Compass size={14} />
          </NxIconBtn>
          <NxIconBtn
            title="Sign out"
            onClick={() => {
              if (isMobile) setMobileOpen(false);
              onSignOut();
            }}
          >
            <LogOut size={14} />
          </NxIconBtn>
          {isMobile && (
            <NxIconBtn title="Close" onClick={() => setMobileOpen(false)}>
              <X size={14} />
            </NxIconBtn>
          )}
        </div>
      </div>

      {isInRoom && (
        <button
          onClick={() => {
            router.push("/chat");
            if (isMobile) setMobileOpen(false);
          }}
          className="flex items-center gap-1 mx-2.5 mt-2 mb-0.5 px-2.5 py-1.25 rounded-[7px] bg-transparent border border-(--border) text-(--text3) text-[11.5px] font-medium cursor-pointer transition-all duration-140 hover:bg-(--surface) hover:text-(--text) hover:border-(--border2)"
        >
          <ChevronLeft size={13} />
          Home
        </button>
      )}

      <nav className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-0.75 [&::-webkit-scrollbar-thumb]:bg-(--border) [&::-webkit-scrollbar-thumb]:rounded-sm">
        <div className="flex items-center justify-between px-3.5 pt-3 pb-1.25 text-[10px] font-bold tracking-[0.08em] uppercase text-(--text3)">
          <span>Channels</span>
          <button
            className="flex items-center justify-center w-5 h-5 rounded-[5px] bg-transparent border-none text-(--text3) cursor-pointer transition-all duration-140 hover:bg-(--surface) hover:text-(--text)"
            title="New channel"
            onClick={() => {
              setShowCreate(true);
              setShowDiscover(false);
              if (isMobile) setMobileOpen(false);
            }}
          >
            <Plus size={13} />
          </button>
        </div>

        {serverRooms.length === 0 && (
          <div className="px-4 py-2 text-[11.5px] text-(--text3)">
            No channels yet.{" "}
            <button
              onClick={() => {
                setShowCreate(true);
                if (isMobile) setMobileOpen(false);
              }}
              className="bg-none border-none text-(--accent) text-[11.5px] cursor-pointer p-0 transition-opacity duration-120 hover:opacity-75"
            >
              Create one
            </button>
          </div>
        )}

        {serverRooms.map((room) => {
          const active = pathname === `/chat/${room.id}`;
          return (
            <Link
              key={room.id}
              href={`/chat/${room.id}`}
              className="no-underline"
              onClick={() => isMobile && setMobileOpen(false)}
            >
              <div
                className={[
                  "flex items-center gap-1.75 px-3 py-1.25 mx-2 rounded-[7px] cursor-pointer transition-all duration-120 relative min-w-0",
                  active
                    ? "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))"
                    : "hover:bg-(--surface)",
                ].join(" ")}
              >
                <Hash
                  size={12}
                  className={`shrink-0 ${active ? "text-(--text)" : "text-(--text3)"}`}
                />
                <span
                  className={`text-[12.5px] font-medium flex-1 overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-120 ${active ? "text-(--text)" : "text-(--text2,#aaa) group-hover:text-(--text)"}`}
                >
                  {room.name}
                </span>
                {room.isPrivate && (
                  <Lock size={10} className="text-(--text3) shrink-0" />
                )}
                {active && (
                  <span className="w-1.25 h-1.25 rounded-full bg-(--accent) shrink-0" />
                )}
              </div>
            </Link>
          );
        })}

        {discoverRooms.length > 0 && (
          <>
            <div className="flex items-center justify-between px-3.5 pt-4 pb-1.25 text-[10px] font-bold tracking-[0.08em] uppercase text-[color-mix(in_srgb,var(--text3)_65%,transparent)">
              <span>Discover</span>
            </div>
            {discoverRooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center gap-1.75 px-3 py-1.25 mx-2 rounded-[7px] cursor-pointer transition-all duration-120 relative min-w-0 opacity-65 hover:opacity-100 hover:bg-(--surface)"
              >
                <Hash size={12} className="text-(--text3) shrink-0" />
                <span className="text-[12.5px] font-medium text-(--text2,#aaa) flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {room.name}
                </span>
                <button
                  onClick={() => {
                    if (isMobile) setMobileOpen(false);
                    handleJoin(room);
                  }}
                  className="px-2 py-0.5 rounded-[20px] border border-(--border2) bg-(--surface) text-(--text2) text-[10.5px] font-medium cursor-pointer shrink-0 transition-all duration-120 whitespace-nowrap hover:bg-(--accent) hover:border-(--accent) hover:text-black"
                >
                  Join
                </button>
              </div>
            ))}
          </>
        )}
      </nav>

      {onlineCount > 0 && (
        <div className="flex items-center gap-1.25 px-4 py-1.5 text-[10.5px] text-(--text3)">
          <span className="w-1.5 h-1.5 rounded-full bg-(--online,#4ade80) shrink-0" />
          {onlineCount} online
        </div>
      )}

      <div className="flex items-center gap-2.25 px-3 py-2.5 border-t border-(--border) shrink-0">
        <Avatar
          name={currentUserName}
          photoURL={currentUserAvatar}
          size={28}
          showPresence
          isOnline
        />
        <div className="flex-1 min-w-0 flex flex-col gap-px">
          <span className="text-[12.5px] font-semibold text-(--text) overflow-hidden text-ellipsis whitespace-nowrap">
            {currentUserName}
          </span>
          <span className="text-[10.5px] text-(--online,#4ade80)">
            Active
          </span>
        </div>
        <NxIconBtn title="Sign out" onClick={onSignOut}>
          <LogOut size={13} />
        </NxIconBtn>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes nx-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes nx-slide-in { from { transform: translateX(-100%) } to { transform: translateX(0) } }
        @keyframes nx-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .nx-anim-fade   { animation: nx-fade-in  0.15s ease; }
        .nx-anim-slide  { animation: nx-slide-in 0.22s cubic-bezier(0.22, 1, 0.36, 1); }
        .nx-anim-modal  { animation: nx-modal-in 0.22s cubic-bezier(0.22, 1, 0.36, 1); }
      `}</style>

      <button
        className="flex md:hidden fixed z-30 left-3 top-3 w-9 h-9 rounded-[10px] border border-(--border) bg-(--sidebar,#1a1a1f) text-(--text) items-center justify-center cursor-pointer text-base backdrop-blur-sm transition-all"
        onClick={() => setMobileOpen(true)}
        aria-label="Open channels"
      >
        <Hash size={16} />
      </button>

      <aside className="hidden md:flex flex-col w-58 min-w-58 bg-(--sidebar,#111115) border-r border-(--border) h-svh overflow-hidden">
        {sidebarContent(false)}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden nx-anim-fade"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-70 max-w-[88vw] bg-(--sidebar,#111115) border-r border-(--border) overflow-hidden nx-anim-slide"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent(true)}
          </div>
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-5 nx-anim-fade"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
        >
          <div className="bg-(--sidebar,#111115) border border-(--border) rounded-2xl p-6 w-full max-w-90 nx-anim-modal">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-bold text-(--text)">
                New channel
              </span>
              <button
                className="w-6.5 h-6.5 rounded-md border-none bg-(--surface) text-(--text3) text-base leading-none cursor-pointer flex items-center justify-center transition-all duration-120 hover:bg-(--surface2) hover:text-(--text)"
                onClick={() => setShowCreate(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold tracking-[0.04em] uppercase text-(--text3)">
                  Channel name
                </label>
                <input
                  className="px-3 py-2 rounded-[9px] border border-(--border2) bg-(--surface) text-(--text) text-[13px] font-[inherit] outline-none transition-all duration-140 w-full box-border focus:border-(--accent) focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. deployments"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold tracking-[0.04em] uppercase text-(--text3)">
                  Description{" "}
                  <span className="font-normal normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <input
                  className="px-3 py-2 rounded-[9px] border border-(--border2) bg-(--surface) text-(--text) text-[13px] font-[inherit] outline-none transition-all duration-140 w-full box-border focus:border-(--accent) focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="What's this channel for?"
                />
              </div>
              <label className="flex items-center gap-2.25 cursor-pointer text-[12.5px] text-(--text2)">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                Private channel
              </label>
              <button
                type="submit"
                className="px-4 py-2.25 rounded-[9px] border-none bg-(--accent) text-black text-[13px] font-semibold cursor-pointer transition-all duration-140 w-full font-[inherit] hover:opacity-[0.88] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={creating || !newRoomName.trim()}
              >
                {creating ? "Creating…" : "Create channel"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showDiscover && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-5 nx-anim-fade"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDiscover(false);
          }}
        >
          <div className="bg-(--sidebar,#111115) border border-(--border) rounded-2xl p-6 w-full max-w-90 nx-anim-modal">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-bold text-(--text)">
                Discover channels
              </span>
              <button
                className="w-6.5 h-6.5 rounded-md border-none bg-(--surface) text-(--text3) text-base leading-none cursor-pointer flex items-center justify-center transition-all duration-120 hover:bg-(--surface2) hover:text-(--text)"
                onClick={() => setShowDiscover(false)}
              >
                ×
              </button>
            </div>
            <div className="flex gap-1.75 mb-3.5">
              <input
                className="px-3 py-2 rounded-[9px] border border-(--border2) bg-(--surface) text-(--text) text-[13px] font-[inherit] outline-none transition-all duration-140 w-full box-border focus:border-(--accent) focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
                value={searchQ}
                onChange={(e) => {
                  setSearchQ(e.target.value);
                  if (!e.target.value.trim())
                    setSearchResults(
                      publicRooms.filter(
                        (r) => !r.members.includes(currentUserId),
                      ),
                    );
                }}
                placeholder="Search channels…"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                autoFocus
              />
              <button
                className="px-3.5 py-2 rounded-[9px] border border-(--border2) bg-(--surface2) text-(--text) text-[12.5px] font-[inherit] cursor-pointer whitespace-nowrap shrink-0 transition-all duration-140 hover:border-(--accent) hover:text-(--accent)"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {searching && (
                <div className="text-center text-[12px] text-(--text3) py-4">
                  Searching…
                </div>
              )}
              {!searching &&
                searchResults.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-[10px] border border-(--border) mb-1.75 transition-all duration-140 hover:bg-(--surface) hover:border-(--border2)"
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-(--text)">
                        #{room.name}
                      </div>
                      {room.description && (
                        <div className="text-[11px] text-(--text3) mt-0.5">
                          {room.description}
                        </div>
                      )}
                      <div className="text-[10.5px] text-(--text3) mt-0.75">
                        {room.members.length} members
                      </div>
                    </div>
                    <button
                      className="px-2 py-0.5 rounded-[20px] border border-(--border2) bg-(--surface) text-(--text2) text-[10.5px] font-medium cursor-pointer shrink-0 transition-all duration-120 whitespace-nowrap hover:bg-(--accent) hover:border-(--accent) hover:text-black"
                      onClick={() => handleJoin(room)}
                    >
                      Join
                    </button>
                  </div>
                ))}
              {!searching && searchResults.length === 0 && (
                <div className="text-center text-[12px] text-(--text3) py-4">
                  {searchQ ? "No channels found" : "No available channels"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NxIconBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-6.5 h-6.5 rounded-[7px] border-none bg-transparent text-(--text3) flex items-center justify-center cursor-pointer transition-all duration-120 shrink-0 hover:bg-(--surface) hover:text-(--text)"
    >
      {children}
    </button>
  );
}
