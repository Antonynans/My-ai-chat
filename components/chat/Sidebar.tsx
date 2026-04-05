"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Room, PresenceData } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { createRoom } from "@/lib/firestore";
import {
  LogOut,
  Plus,
  Search,
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
      <div className="nx-sidebar-header">
        <div className="nx-workspace-mark">N</div>
        <span className="nx-workspace-name">Nexus</span>
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

      {isInRoom && !isMobile && (
        <button onClick={() => router.push("/chat")} className="nx-back-btn">
          <ChevronLeft size={13} />
          Home
        </button>
      )}

      <nav className="nx-channel-list">
        <div className="nx-section-label">
          <span>Channels</span>
          <button
            className="nx-section-add"
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
          <div className="nx-empty-state">
            No channels yet.{" "}
            <button
              onClick={() => {
                setShowCreate(true);
                if (isMobile) setMobileOpen(false);
              }}
              className="nx-empty-cta"
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
                className={`nx-channel-item ${active ? "nx-channel-item--active" : ""}`}
              >
                <Hash size={12} className="nx-channel-icon" />
                <span className="nx-channel-name">{room.name}</span>
                {room.isPrivate && (
                  <Lock size={10} className="nx-channel-lock" />
                )}
                {active && <span className="nx-channel-pip" />}
              </div>
            </Link>
          );
        })}

        {discoverRooms.length > 0 && (
          <>
            <div className="nx-section-label nx-section-label--sub">
              <span>Discover</span>
            </div>
            {discoverRooms.map((room) => (
              <div
                key={room.id}
                className="nx-channel-item nx-channel-item--discover"
              >
                <Hash size={12} className="nx-channel-icon" />
                <span className="nx-channel-name">{room.name}</span>
                <button
                  onClick={() => {
                    if (isMobile) setMobileOpen(false);
                    handleJoin(room);
                  }}
                  className="nx-join-pill"
                >
                  Join
                </button>
              </div>
            ))}
          </>
        )}
      </nav>

      {onlineCount > 0 && (
        <div className="nx-online-badge">
          <span className="nx-online-dot" />
          {onlineCount} online
        </div>
      )}

      <div className="nx-user-footer">
        <Avatar
          name={currentUserName}
          photoURL={currentUserAvatar}
          size={28}
          showPresence
          isOnline
        />
        <div className="nx-user-info">
          <span className="nx-user-name">{currentUserName}</span>
          <span className="nx-user-status">Active</span>
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
        /* ── CSS Variables (extend existing theme) ── */
        :root {
          --nx-sidebar-w: 232px;
          --nx-radius: 8px;
          --nx-header-h: 52px;
          --nx-accent-glow: color-mix(in srgb, var(--accent) 25%, transparent);
        }

        /* ── Mobile toggle ── */
        .nx-mobile-toggle {
          display: none;
          position: fixed;
          z-index: 30;
          left: 12px;
          top: 12px;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--sidebar, #1a1a1f);
          color: var(--text);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          backdrop-filter: blur(8px);
          transition: background 0.15s, border-color 0.15s;
        }
        @media (max-width: 767px) {
          .nx-mobile-toggle { display: flex; }
        }

        /* ── Desktop sidebar shell ── */
        .nx-sidebar-desktop {
          display: none;
          width: var(--nx-sidebar-w);
          min-width: var(--nx-sidebar-w);
          background: var(--sidebar, #111115);
          border-right: 1px solid var(--border);
          height: 100svh;
          overflow: hidden;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .nx-sidebar-desktop { display: flex; }
        }

        /* ── Mobile overlay ── */
        .nx-mobile-overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          animation: nx-fade-in 0.18s ease;
        }
        .nx-mobile-drawer {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 280px;
          max-width: 88vw;
          background: var(--sidebar, #111115);
          border-right: 1px solid var(--border);
          animation: nx-slide-in 0.22s cubic-bezier(0.22, 1, 0.36, 1);
          overflow: hidden;
        }
        @keyframes nx-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes nx-slide-in { from { transform: translateX(-100%) } to { transform: translateX(0) } }

        /* ── Header ── */
        .nx-sidebar-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          height: var(--nx-header-h);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .nx-workspace-mark {
          width: 24px;
          height: 24px;
          border-radius: 7px;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          color: #000;
          flex-shrink: 0;
          font-family: var(--font-display, sans-serif);
          letter-spacing: -0.5px;
        }
        .nx-workspace-name {
          font-size: 13px;
          font-weight: 700;
          font-family: var(--font-display, sans-serif);
          letter-spacing: -0.2px;
          color: var(--text);
        }

        /* ── Back button ── */
        .nx-back-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 8px 10px 2px;
          padding: 5px 10px;
          border-radius: 7px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text3);
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.14s;
        }
        .nx-back-btn:hover {
          background: var(--surface);
          color: var(--text);
          border-color: var(--border2);
        }

        /* ── Channel list scroll container ── */
        .nx-channel-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0 4px;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .nx-channel-list::-webkit-scrollbar { width: 3px; }
        .nx-channel-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        /* ── Section label ── */
        .nx-section-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px 5px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text3);
        }
        .nx-section-label--sub {
          padding-top: 16px;
          color: color-mix(in srgb, var(--text3) 65%, transparent);
        }
        .nx-section-add {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 5px;
          background: transparent;
          border: none;
          color: var(--text3);
          cursor: pointer;
          transition: all 0.14s;
        }
        .nx-section-add:hover {
          background: var(--surface);
          color: var(--text);
        }

        /* ── Channel item ── */
        .nx-channel-item {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px;
          margin: 1px 8px;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.12s;
          position: relative;
          min-width: 0;
        }
        .nx-channel-item:hover {
          background: var(--surface);
        }
        .nx-channel-item--active {
          background: color-mix(in srgb, var(--accent) 12%, var(--surface));
        }
        .nx-channel-item--active .nx-channel-icon,
        .nx-channel-item--active .nx-channel-name {
          color: var(--text) !important;
        }
        .nx-channel-item--discover {
          opacity: 0.65;
        }
        .nx-channel-item--discover:hover { opacity: 1; }
        .nx-channel-icon {
          color: var(--text3);
          flex-shrink: 0;
        }
        .nx-channel-name {
          font-size: 12.5px;
          font-weight: 500;
          color: var(--text2, #aaa);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: color 0.12s;
        }
        .nx-channel-item:hover .nx-channel-name { color: var(--text); }
        .nx-channel-lock { color: var(--text3); flex-shrink: 0; }
        .nx-channel-pip {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }

        /* ── Join pill ── */
        .nx-join-pill {
          padding: 2px 8px;
          border-radius: 20px;
          border: 1px solid var(--border2);
          background: var(--surface);
          color: var(--text2);
          font-size: 10.5px;
          font-weight: 500;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.12s;
          white-space: nowrap;
        }
        .nx-join-pill:hover {
          background: var(--accent);
          border-color: var(--accent);
          color: #000;
        }

        /* ── Empty state ── */
        .nx-empty-state {
          padding: 8px 16px;
          font-size: 11.5px;
          color: var(--text3);
        }
        .nx-empty-cta {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 11.5px;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.12s;
        }
        .nx-empty-cta:hover { opacity: 0.75; }

        /* ── Online badge ── */
        .nx-online-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 16px;
          font-size: 10.5px;
          color: var(--text3);
        }
        .nx-online-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--online, #4ade80);
          flex-shrink: 0;
        }

        /* ── User footer ── */
        .nx-user-footer {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 12px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        .nx-user-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .nx-user-name {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nx-user-status {
          font-size: 10.5px;
          color: var(--online, #4ade80);
        }

        /* ── Icon button ── */
        .nx-icon-btn {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: var(--text3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.12s;
          flex-shrink: 0;
        }
        .nx-icon-btn:hover {
          background: var(--surface);
          color: var(--text);
        }

        /* ── Modal ── */
        .nx-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: nx-fade-in 0.15s ease;
        }
        .nx-modal {
          background: var(--sidebar, #111115);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 360px;
          animation: nx-modal-in 0.22s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes nx-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .nx-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .nx-modal-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          font-family: var(--font-display, sans-serif);
        }
        .nx-modal-close {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: none;
          background: var(--surface);
          color: var(--text3);
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.12s;
        }
        .nx-modal-close:hover { background: var(--surface2); color: var(--text); }

        /* ── Form elements ── */
        .nx-field { display: flex; flex-direction: column; gap: 6px; }
        .nx-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text3);
        }
        .nx-input {
          padding: 8px 12px;
          border-radius: 9px;
          border: 1px solid var(--border2);
          background: var(--surface);
          color: var(--text);
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.14s, box-shadow 0.14s;
          width: 100%;
          box-sizing: border-box;
        }
        .nx-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--nx-accent-glow);
        }
        .nx-submit-btn {
          padding: 9px 16px;
          border-radius: 9px;
          border: none;
          background: var(--accent);
          color: #000;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.14s, transform 0.1s;
          width: 100%;
          font-family: inherit;
        }
        .nx-submit-btn:hover:not(:disabled) { opacity: 0.88; }
        .nx-submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .nx-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .nx-toggle-row {
          display: flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          font-size: 12.5px;
          color: var(--text2);
        }

        /* ── Discover room card ── */
        .nx-room-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          margin-bottom: 7px;
          transition: border-color 0.14s, background 0.14s;
        }
        .nx-room-card:hover {
          background: var(--surface);
          border-color: var(--border2);
        }
        .nx-room-card-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .nx-room-card-desc { font-size: 11px; color: var(--text3); margin-top: 2px; }
        .nx-room-card-meta { font-size: 10.5px; color: var(--text3); margin-top: 3px; }
        .nx-search-row { display: flex; gap: 7px; margin-bottom: 14px; }
        .nx-search-btn {
          padding: 8px 14px;
          border-radius: 9px;
          border: 1px solid var(--border2);
          background: var(--surface2);
          color: var(--text);
          font-size: 12.5px;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.14s;
          flex-shrink: 0;
        }
        .nx-search-btn:hover { border-color: var(--accent); color: var(--accent); }
        .nx-no-results { text-align: center; font-size: 12px; color: var(--text3); padding: 16px 0; }
      `}</style>

      <button
        className="nx-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open channels"
      >
        <Hash size={16} />
      </button>

      <aside className="nx-sidebar-desktop">{sidebarContent(false)}</aside>

      {mobileOpen && (
        <div
          className="nx-mobile-overlay md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="nx-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent(true)}
          </div>
        </div>
      )}

      {showCreate && (
        <div
          className="nx-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
        >
          <div className="nx-modal">
            <div className="nx-modal-header">
              <span className="nx-modal-title">New channel</span>
              <button
                className="nx-modal-close"
                onClick={() => setShowCreate(false)}
              >
                ×
              </button>
            </div>
            <form
              onSubmit={handleCreate}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div className="nx-field">
                <label className="nx-label">Channel name</label>
                <input
                  className="nx-input"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. deployments"
                  required
                />
              </div>
              <div className="nx-field">
                <label className="nx-label">
                  Description{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    (optional)
                  </span>
                </label>
                <input
                  className="nx-input"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="What's this channel for?"
                />
              </div>
              <label className="nx-toggle-row">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                Private channel
              </label>
              <button
                type="submit"
                className="nx-submit-btn"
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
          className="nx-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDiscover(false);
          }}
        >
          <div className="nx-modal">
            <div className="nx-modal-header">
              <span className="nx-modal-title">Discover channels</span>
              <button
                className="nx-modal-close"
                onClick={() => setShowDiscover(false)}
              >
                ×
              </button>
            </div>
            <div className="nx-search-row">
              <input
                className="nx-input"
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
              <button className="nx-search-btn" onClick={handleSearch}>
                Search
              </button>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {searching && <div className="nx-no-results">Searching…</div>}
              {!searching &&
                searchResults.map((room) => (
                  <div key={room.id} className="nx-room-card">
                    <div>
                      <div className="nx-room-card-name">#{room.name}</div>
                      {room.description && (
                        <div className="nx-room-card-desc">
                          {room.description}
                        </div>
                      )}
                      <div className="nx-room-card-meta">
                        {room.members.length} members
                      </div>
                    </div>
                    <button
                      className="nx-join-pill"
                      onClick={() => handleJoin(room)}
                    >
                      Join
                    </button>
                  </div>
                ))}
              {!searching && searchResults.length === 0 && (
                <div className="nx-no-results">
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
    <button onClick={onClick} title={title} className="nx-icon-btn">
      {children}
    </button>
  );
}
