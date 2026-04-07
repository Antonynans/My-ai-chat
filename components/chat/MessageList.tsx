"use client";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Message, TypingUser, ReadReceipt } from "@/lib/types";
import { MessageItem } from "./MessageItem";
import { Avatar } from "@/components/ui/Avatar";
import { formatDateDivider, isSameDay } from "@/lib/utils";
import { loadMoreMessages } from "@/lib/firestore";
import { markRoomRead } from "@/lib/presence";
import { ChevronsUp } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  typingUsers: TypingUser[];
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  jumpToMessageId?: string | null;
  onJumpHandled?: () => void;
  receipts: Record<string, ReadReceipt>; // keyed by userId
  memberNames: Record<string, string>;
}

export const MessageList = forwardRef<
  { jumpToStart: () => void },
  MessageListProps
>(function MessageList(
  {
    messages,
    typingUsers,
    roomId,
    currentUserId,
    jumpToMessageId,
    onJumpHandled,
    receipts,
    memberNames,
  },
  ref,
) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showJumpBtn, setShowJumpBtn] = useState(false);
  const isNearBottom = useRef(true);

  const allMessages = useMemo(
    () => [...olderMessages, ...messages],
    [olderMessages, messages],
  );

  // ── Mark as read ────────────────────────────────────────
  const markRead = useCallback(() => {
    if (!isNearBottom.current) return;
    const lastMsg = allMessages[allMessages.length - 1];
    if (!lastMsg) return;
    const myReceipt = receipts[currentUserId];
    if (myReceipt?.lastReadMessageId === lastMsg.id) return; // already up to date
    markRoomRead(roomId, currentUserId, lastMsg.id);
  }, [allMessages, receipts, currentUserId, roomId]);

  // Mark read on new messages when near bottom
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      markRead();
    }
  }, [messages, typingUsers]);

  // Mark read on focus (user switches back to tab)
  useEffect(() => {
    window.addEventListener("focus", markRead);
    return () => window.removeEventListener("focus", markRead);
  }, [markRead]);

  // Mark read on mount
  useEffect(() => {
    markRead();
  }, []);

  useEffect(() => {
    if (!jumpToMessageId) return;
    const el = document.getElementById(`msg-${jumpToMessageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(jumpToMessageId);
      const t = setTimeout(() => {
        setHighlightedId(null);
        onJumpHandled?.();
      }, 2200);
      return () => clearTimeout(t);
    }
    onJumpHandled?.();
  }, [jumpToMessageId]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottom.current = fromBottom < 100;
    setShowJumpBtn(el.scrollTop > 300);
    if (isNearBottom.current) markRead();
    if (el.scrollTop < 80 && !loadingMore && hasMore) loadMore();
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || allMessages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = allMessages[0];
      const older = await loadMoreMessages(roomId, oldest.createdAt);
      if (older.length === 0) setHasMore(false);
      else setOlderMessages((prev) => [...older, ...prev]);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, allMessages, roomId]);

  const jumpToStart = useCallback(async () => {
    // Load all pages first
    let more = hasMore;
    while (more) {
      if (loadingMore) break;
      setLoadingMore(true);
      try {
        const oldest = allMessages[0];
        const older = await loadMoreMessages(roomId, oldest.createdAt);
        if (older.length === 0) {
          setHasMore(false);
          more = false;
        } else setOlderMessages((prev) => [...older, ...prev]);
      } finally {
        setLoadingMore(false);
      }
    }
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  }, [hasMore, loadingMore, allMessages, roomId]);

  useImperativeHandle(ref, () => ({ jumpToStart }), [jumpToStart]);

  function isGrouped(msg: Message, prev: Message | undefined): boolean {
    if (!prev) return false;
    if (msg.senderId !== prev.senderId) return false;
    if (msg.isAIResponse !== prev.isAIResponse) return false;
    return msg.createdAt.getTime() - prev.createdAt.getTime() < 5 * 60 * 1000;
  }

  // ── Build receipt map: messageId → list of userIds who last-read it ──
  // Exclude current user (no need to show your own receipt)
  const receiptsByMessage = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [uid, receipt] of Object.entries(receipts)) {
      if (uid === currentUserId) continue;
      const id = receipt.lastReadMessageId;
      if (!map[id]) map[id] = [];
      map[id].push(uid);
    }
    return map;
  }, [receipts, currentUserId]);

  return (
    <>
      <style>{`
        @keyframes nx-msg-highlight {
          0%   { background: color-mix(in srgb, var(--accent) 18%, transparent); }
          60%  { background: color-mix(in srgb, var(--accent) 10%, transparent); }
          100% { background: transparent; }
        }
        .nx-msg-highlighted {
          animation: nx-msg-highlight 2.2s ease forwards;
          border-radius: 6px;
        }
        @keyframes nx-typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-4px); opacity: 1; }
        }
        .nx-typing-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: currentColor;
          animation: nx-typing-bounce 1.2s ease-in-out infinite;
        }
        .nx-typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .nx-typing-dot:nth-child(3) { animation-delay: 0.3s; }
      `}</style>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="
          flex-1 overflow-y-auto flex flex-col pt-4 pb-2
          [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]
          [&::-webkit-scrollbar]:w-0.75
          [&::-webkit-scrollbar-thumb]:bg-(--border)
          [&::-webkit-scrollbar-thumb]:rounded-full
        "
      >
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="spinner" />
          </div>
        )}

        {!hasMore && allMessages.length > 0 && (
          <div className="flex flex-col items-center gap-1 px-6 py-8">
            <div className="w-9 h-9 rounded-full bg-(--surface2) flex items-center justify-center text-base mb-1">
              💬
            </div>
            <p className="text-[11.5px] font-semibold text-(--text3)">
              Beginning of conversation
            </p>
          </div>
        )}

        {allMessages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center text-2xl bg-(--surface) border border-(--border)">
              💬
            </div>
            <p className="text-[13.5px] font-semibold text-(--text2) mb-1">
              No messages yet
            </p>
            <p className="text-[12px] text-(--text3) leading-relaxed max-w-[55ch]">
              Be the first to say something! Use{" "}
              <code className="ai-mention text-[11px]">@ai</code> to invoke the
              assistant.
            </p>
          </div>
        )}

        {allMessages.map((msg, i) => {
          const prev = allMessages[i - 1];
          const showDateDivider =
            !prev || !isSameDay(msg.createdAt, prev.createdAt);
          const grouped = isGrouped(msg, prev);
          const isHighlighted = highlightedId === msg.id;
          const readBy = receiptsByMessage[msg.id] ?? [];

          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={isHighlighted ? "nx-msg-highlighted" : ""}
            >
              {showDateDivider && (
                <div className="flex items-center gap-3 px-5 py-3 my-1">
                  <div className="flex-1 h-px bg-(--border)" />
                  <span className="text-[10.5px] font-medium text-(--text3) whitespace-nowrap px-2 py-0.5 rounded-full border border-(--border) bg-(--surface)">
                    {formatDateDivider(msg.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-(--border)" />
                </div>
              )}
              <MessageItem
                message={msg}
                isGrouped={grouped}
                roomId={roomId}
                currentUserId={currentUserId}
                memberNames={memberNames}
              />

              {readBy.length > 0 && (
                <div className="flex items-center gap-1 px-5 pb-0.5 justify-end">
                  <div className="flex -space-x-1">
                    {readBy.slice(0, 5).map((uid) => (
                      <div
                        key={uid}
                        title={`Seen by ${memberNames[uid] ?? uid}`}
                        className="w-3.5 h-3.5 rounded-full ring-1 ring-(--sidebar)"
                      >
                        <Avatar name={memberNames[uid] ?? uid} size={14} />
                      </div>
                    ))}
                  </div>
                  {readBy.length > 0 && (
                    <span className="text-[9.5px] text-(--text3)">
                      {readBy.length === 1
                        ? `Seen by ${memberNames[readBy[0]] ?? "1 member"}`
                        : `Seen by ${readBy.length}`}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="mx-3 my-1.5 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-(--surface) border border-(--border) animate-fade-in">
            <div className="flex -space-x-1.5 shrink-0">
              {typingUsers.slice(0, 3).map((u) => (
                <div
                  key={u.uid ?? u.displayName}
                  className="w-6 h-6 rounded-full flex items-center justify-center bg-(--surface2) border-2 border-(--sidebar) text-[10px] font-bold text-(--text2) uppercase"
                >
                  {u.displayName?.[0] ?? "?"}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex gap-0.75 items-center text-(--text3)">
                <span className="nx-typing-dot" />
                <span className="nx-typing-dot" />
                <span className="nx-typing-dot" />
              </div>
              <span className="text-[12px] text-(--text3) truncate">
                <span className="font-semibold text-(--text2)">
                  {typingUsers.length === 1
                    ? typingUsers[0].displayName
                    : typingUsers.length === 2
                      ? `${typingUsers[0].displayName} & ${typingUsers[1].displayName}`
                      : `${typingUsers[0].displayName} & ${typingUsers.length - 1} others`}
                </span>{" "}
                {typingUsers.length === 1 ? "is typing…" : "are typing…"}
              </span>
            </div>
          </div>
        )}

        {showJumpBtn && (
          <button
            onClick={jumpToStart}
            className="
              sticky bottom-4 self-end mr-4
              flex items-center gap-1.5 px-3 py-1.5
              rounded-full text-[11.5px] font-medium
              bg-(--surface) border border-(--border2) text-(--text2)
              shadow-sm transition-all duration-150
              hover:bg-(--surface2) hover:border-(--border) hover:text-(--text)
              active:scale-95
            "
          >
            <ChevronsUp size={12} />
            Jump to start
          </button>
        )}

        <div ref={bottomRef} />
      </div>
    </>
  );
});
