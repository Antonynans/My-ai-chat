"use client";
import { useState, useRef, useEffect } from "react";
import { SmilePlus, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { addReaction, removeReaction } from "@/lib/firestore";
import type { Message } from "@/lib/types";
import { createPortal } from "react-dom";

interface MessageReactionsProps {
  message: Message;
  roomId: string;
  currentUserId: string;
  memberNames?: Record<string, string>;
}

export function MessageReactions({
  message,
  roomId,
  currentUserId,
  memberNames,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [loadingReaction, setLoadingReaction] = useState<string | null>(null);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const reactions = message.reactions || {};

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!showPicker || isMobile) return;

    const handleScroll = () => calcPickerPos();

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [showPicker, isMobile]);

  useEffect(() => {
    if (!showPicker) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPicker(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showPicker]);

  useEffect(() => {
    if (showPicker) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [showPicker]);

  function calcPickerPos() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pickerWidth = 350;
    const pickerHeight = 400;
    const gap = 8;

    const spaceAbove = rect.top;
    const spaceBelow = vh - rect.bottom;
    const openAbove =
      spaceAbove >= pickerHeight + gap || spaceAbove > spaceBelow;

    const top = openAbove
      ? Math.max(gap, rect.top - pickerHeight - gap)
      : Math.min(rect.bottom + gap, vh - pickerHeight - gap);

    const idealLeft = rect.left - pickerWidth / 2 + rect.width / 2;
    const left = Math.max(gap, Math.min(idealLeft, vw - pickerWidth - gap));

    setPickerPos({ top, left });
  }

  function handleButtonClick() {
    const next = !showPicker;

    if (next && !isMobile) calcPickerPos();
    setShowPicker(next);
  }

  async function handleReactionClick(emoji: string) {
    if (!reactions[emoji]) return;
    const userIds = reactions[emoji];
    const hasReacted = userIds.includes(currentUserId);
    try {
      setLoadingReaction(emoji);
      if (hasReacted) {
        await removeReaction(roomId, message.id, emoji, currentUserId);
      } else {
        await addReaction(roomId, message.id, emoji, currentUserId);
      }
    } catch (err) {
      console.error("Failed to update reaction:", err);
    } finally {
      setLoadingReaction(null);
    }
  }

  async function handleEmojiSelect(emoji: string) {
    try {
      setLoadingReaction(emoji);
      const userIds = reactions[emoji] || [];
      const hasReacted = userIds.includes(currentUserId);
      if (hasReacted) {
        await removeReaction(roomId, message.id, emoji, currentUserId);
      } else {
        await addReaction(roomId, message.id, emoji, currentUserId);
      }
      setShowPicker(false);
    } catch (err) {
      console.error("Failed to add reaction:", err);
    } finally {
      setLoadingReaction(null);
    }
  }

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-1.5 items-center">
        {Object.entries(reactions).map(([emoji, userIds]) => {
          if (!userIds || userIds.length === 0) return null;
          const hasReacted = userIds.includes(currentUserId);
          const names = userIds
            .map((id) => memberNames?.[id] || "User")
            .join(", ");

          return (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              disabled={loadingReaction === emoji}
              title={names}
              aria-label={`${emoji} reaction by ${names}. ${hasReacted ? "Click to remove" : "Click to add"}`}
              className={`
                px-2 py-1 rounded-full text-sm font-medium transition-all
                flex items-center gap-1 cursor-pointer
                min-h-8 touch-manipulation
                ${
                  hasReacted
                    ? "bg-[color-mix(in_srgb,var(--accent,#8b5a2b)_20%,transparent)] border border-[color-mix(in_srgb,var(--accent,#8b5a2b)_40%,transparent)] text-(--accent,#8b5a2b)"
                    : "bg-(--surface) border border-(--border) text-(--text2) hover:bg-(--surface2)"
                }
                disabled:opacity-50
              `}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span className="text-xs tabular-nums">{userIds.length}</span>
            </button>
          );
        })}

        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          aria-label="Add reaction"
          aria-expanded={showPicker}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            transition-all touch-manipulation
            ${
              showPicker
                ? "bg-(--surface2) text-(--text)"
                : "bg-(--surface) text-(--text2) hover:bg-(--surface2) hover:text-(--text)"
            }
          `}
        >
          <SmilePlus size={16} />
        </button>
      </div>

      {showPicker &&
        createPortal(
          <>
            {!isMobile && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPicker(false)}
                  aria-hidden="true"
                />
                <div
                  ref={pickerContainerRef}
                  className="fixed z-50 rounded-xl shadow-2xl overflow-hidden"
                  style={{
                    top: `${pickerPos.top}px`,
                    left: `${pickerPos.left}px`,
                  }}
                >
                  <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                    <EmojiPicker
                      onEmojiClick={(emojiData) =>
                        handleEmojiSelect(emojiData.emoji)
                      }
                      width={350}
                      height={400}
                      skinTonesDisabled
                    />
                  </div>
                </div>
              </>
            )}
          </>,
          document.body,
        )}

      {showPicker && isMobile && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPicker(false)}
            aria-hidden="true"
          />

          <div
            ref={pickerContainerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Emoji picker"
            className="
              fixed bottom-0 left-0 right-0 z-50
              rounded-t-2xl overflow-hidden
              bg-(--surface) shadow-2xl
              animate-in slide-in-from-bottom duration-300
            "
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-(--border) mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
              <span className="text-sm font-medium text-(--text2)">
                Add reaction
              </span>
              <button
                onClick={() => setShowPicker(false)}
                aria-label="Close emoji picker"
                className="
                  w-8 h-8 rounded-full flex items-center justify-center
                  bg-(--surface2) text-(--text2)
                  hover:bg-(--border) transition-colors
                "
              >
                <X size={16} />
              </button>
            </div>

            <EmojiPicker
              onEmojiClick={(emojiData) => handleEmojiSelect(emojiData.emoji)}
              width="100%"
              height={380}
              skinTonesDisabled
            />
          </div>
        </>
      )}
    </>
  );
}
