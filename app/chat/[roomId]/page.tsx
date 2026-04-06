"use client";
import { useEffect, useState, useCallback, use } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { subscribeToMessages, subscribeToRoom } from "@/lib/firestore";
import { subscribeToTyping } from "@/lib/presence";
import { useChatStore } from "@/lib/store";
import { getRoom } from "@/lib/firestore";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { MembersPanel } from "@/components/chat/MembersPanel";
import type { Room, Message, TypingUser } from "@/lib/types";
import toast from "react-hot-toast";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const { roomId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { presence } = useChatStore();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [jumpToMessageId, setJumpToMessageId] = useState<string | null>(null);

  const userId = session?.user?.id || "";
  const userName = session?.user?.name || session?.user?.email || "User";
  const userAvatar = session?.user?.image || undefined;

  useEffect(() => {
    if (!userId || !roomId) return;
    getRoom(roomId).then((r) => {
      if (!r) {
        setNotFound(true);
        return;
      }
      if (!r.members.includes(userId)) {
        toast.error("You're not a member of this channel");
        router.push("/chat");
        return;
      }
      setRoom(r);
      setLoading(false);
    });

    const unsub = subscribeToRoom(roomId, (r) => {
      if (r && r.members.includes(userId)) {
        setRoom(r);
      }
    });
    return unsub;
  }, [roomId, userId]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToMessages(roomId, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !userId) return;
    const unsub = subscribeToTyping(roomId, userId, setTypingUsers);
    return unsub;
  }, [roomId, userId]);

  const handleAIInvoke = useCallback(
    async (triggerMessage: string) => {
      if (!room) return;

      const lastMsgs = messages.slice(-20).map((msg) => ({
        role: (msg.isAIResponse ? "assistant" : "user") as "user" | "assistant",
        content: msg.isAIResponse
          ? msg.content
          : `${msg.senderName}: ${msg.content}`,
      }));

      const triggerContent = `${userName}: ${triggerMessage}`;
      const shouldAppend =
        lastMsgs.length === 0 ||
        !(
          lastMsgs[lastMsgs.length - 1].role === "user" &&
          lastMsgs[lastMsgs.length - 1].content === triggerContent
        );

      const contextMessages = shouldAppend
        ? [...lastMsgs, { role: "user", content: triggerContent }]
        : lastMsgs;

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, messages: contextMessages, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "AI invocation failed");
        }
      } catch {
        toast.error("Failed to reach AI");
      }
    },
    [room, messages, roomId, userId, userName],
  );

  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center gap-3 text-(--text3)">
        <div className="text-3xl">🔍</div>
        <p>Channel not found</p>
      </div>
    );
  }

  if (loading || !room) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const onlineCount = room.members.filter(
    (uid) => presence[uid]?.online,
  ).length;

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <ChatHeader
          room={room}
          onlineCount={onlineCount}
          onToggleMembers={() => setMembersOpen((o) => !o)}
          onJumpToMessage={(id: string) => setJumpToMessageId(id)}
          membersOpen={membersOpen}
        />

        <MessageList
          messages={messages}
          typingUsers={typingUsers}
          roomId={roomId}
          currentUserId={userId}
          jumpToMessageId={jumpToMessageId}
          onJumpHandled={() => setJumpToMessageId(null)}
        />

        <MessageInput
          roomId={roomId}
          userId={userId}
          userName={userName}
          userAvatar={userAvatar}
          aiResponding={room.aiResponding}
          onAIInvoke={handleAIInvoke}
        />
      </div>

      {membersOpen && (
        <MembersPanel room={room} presence={presence} currentUserId={userId} />
      )}
    </div>
  );
}
