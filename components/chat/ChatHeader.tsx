"use client";
import { useState } from "react";
import { useEffect } from "react";
import { Room, Message } from "@/lib/types";
import { searchMessages } from "@/lib/firestore";
import { Search, Users, Hash, Lock, X } from "lucide-react";

interface ChatHeaderProps {
  room: Room;
  onlineCount: number;
  onToggleMembers: () => void;
  membersOpen: boolean;
  onJumpToMessage?: (messageId: string) => void;
}

export function ChatHeader({
  room,
  onlineCount,
  onToggleMembers,
  membersOpen,
  onJumpToMessage,
}: ChatHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const msgs = await searchMessages(room.id, searchQ);
      setResults(msgs);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (!searchQ.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const msgs = await searchMessages(room.id, searchQ);
        if (!cancelled) setResults(msgs);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQ, room.id]);

  function handleCloseSearch() {
    setShowSearch(false);
    setSearchQ("");
    setResults([]);
  }

  return (
    <>
      <div className="flex flex-col border-b border-(--border) shrink-0 bg-(--sidebar,#111115)">
        <div className="flex items-center gap-2 px-4 h-13 max-sm:pl-12">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-(--text3) shrink-0 flex items-center">
              {room.isPrivate ? <Lock size={14} /> : <Hash size={14} />}
            </span>
            <span className="text-[14px] font-bold text-(--text) truncate tracking-[-0.2px]">
              {room.name}
            </span>
            {room.description && (
              <>
                <span className="w-px h-3.5 bg-(--border2) shrink-0 hidden sm:block" />
                <span className="text-[11.5px] text-(--text3) truncate hidden sm:block">
                  {room.description}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleMembers}
              className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full border
              text-[11.5px] font-medium whitespace-nowrap cursor-pointer
              transition-all duration-150
              ${
                membersOpen
                  ? "bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-(--text)"
                  : "border-(--border) bg-transparent text-(--text3) hover:bg-(--surface) hover:border-(--border2) hover:text-(--text)"
              }
            `}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-(--online,#4ade80) shrink-0" />
              <span>{onlineCount}</span>
              <span className="hidden sm:inline">&nbsp;online</span>
            </button>

            <button
              title="Search messages"
              className={`
              w-8 h-8 rounded-lg flex items-center justify-center shrink-0
              transition-all duration-120 border-none cursor-pointer
              ${
                showSearch
                  ? "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-(--text)"
                  : "bg-transparent text-(--text3) hover:bg-(--surface) hover:text-(--text)"
              }
            `}
              onClick={() => {
                if (showSearch) {
                  handleCloseSearch();
                } else {
                  setShowSearch(true);
                }
              }}
            >
              {showSearch ? <X size={14} /> : <Search size={14} />}
            </button>

            <button
              title="Members"
              onClick={onToggleMembers}
              className={`
              w-8 h-8 rounded-lg flex items-center justify-center shrink-0
              transition-all duration-120 border-none cursor-pointer
              ${
                membersOpen
                  ? "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-(--text)"
                  : "bg-transparent text-(--text3) hover:bg-(--surface) hover:text-(--text)"
              }
            `}
            >
              <Users size={14} />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="px-4 pb-3 flex flex-col gap-2 transition-opacity duration-200 ease-out">
            <form onSubmit={handleSearch} className="flex gap-1.5">
              <div className="w-full">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--text3) pointer-events-none"
                />
                <input
                  className="
                w-full pl-8 pr-8 py-1.5 rounded-lg text-[13px]
                bg-(--surface) border border-(--border2)
                text-(--text) placeholder:text-(--text3)
                outline-none transition-[border-color,box-shadow] duration-150
                focus:border-(--accent)
                focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_15%,transparent)]
              "
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder={`Search in #${room.name}…`}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="py-1.5 px-3.5 rounded-lg border border-(--border2) bg-(--surface2) text-(--text) text-xs cursor-pointer whitespace-nowrap transition-all duration-150 shrink-0 hover:border-(--accent) hover:text-(--accent)"
              >
                {searching ? "…" : "Search"}
              </button>
            </form>

            {results.length > 0 && (
              <div className="rounded-[10px] border border-(--border) bg-(--surface) max-h-60 overflow-y-auto">
                {results.map((msg, idx) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      onJumpToMessage?.(msg.id);
                      setShowSearch(false);
                      setResults([]);
                    }}
                    className={`px-3.5 py-2.5 border-b border-(--border) hover:bg-(--surface2) cursor-pointer transition-colors ${idx === results.length - 1 ? "border-b-0" : ""}`}
                  >
                    <div className="text-[10.5px] font-semibold text-(--text3) mb-1">
                      {msg.senderName}
                    </div>
                    <div className="text-[12.5px] text-(--text2) truncate">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && searchQ && !searching && (
              <div className="text-[12px] text-(--text3) py-3 text-center">
                No results for &quot;{searchQ}&quot;
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
