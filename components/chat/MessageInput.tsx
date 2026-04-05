"use client";
import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { sendMessage } from "@/lib/firestore";
import { setTyping, clearTyping } from "@/lib/presence";
import { detectAIMention } from "@/lib/utils";
import toast from "react-hot-toast";
import { Mic, MicOff, ArrowUp, Sparkles } from "lucide-react";

interface MessageInputProps {
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  aiResponding?: boolean;
  onAIInvoke: (content: string) => void;
}

export function MessageInput({
  roomId,
  userId,
  userName,
  userAvatar,
  aiResponding,
  onAIInvoke,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const canSend = content.trim().length > 0 && !sending && !aiResponding;

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    autoResize(e.target);
    if (val.trim()) setTyping(roomId, userId, userName);
    else clearTyping(roomId, userId);
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const handleSend = useCallback(async () => {
    const text = content.trim();
    if (!text || sending) return;
    clearTyping(roomId, userId);
    setContent("");
    setSending(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      await sendMessage(roomId, text, userId, userName, userAvatar);
      if (detectAIMention(text)) {
        if (aiResponding) toast.error("AI is already responding. Please wait.");
        else onAIInvoke(text);
      }
    } catch {
      toast.error("Failed to send message");
      setContent(text);
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [
    content,
    sending,
    roomId,
    userId,
    userName,
    userAvatar,
    aiResponding,
    onAIInvoke,
  ]);

  function startRecording() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input not supported. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    recognition.onstart = () => setRecording(true);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.trim();
      if (!transcript) return;
      setRecording(false);
      setContent(transcript);
      toast.success("Voice transcribed");
      setTimeout(() => textareaRef.current?.focus(), 0);
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setRecording(false);
      if (event.error === "not-allowed")
        toast.error("Microphone access denied");
      else if (event.error !== "aborted")
        toast.error("Voice recognition failed");
    };
    recognition.onend = () => setRecording(false);
    recognition.start();
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="px-4 pb-4 shrink-0">
      <div
        className="
        rounded-xl border border-(--border2) bg-(--surface)
        overflow-hidden transition-[border-color,box-shadow] duration-150
        focus-within:border-(--border) focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_10%,transparent)]
      "
      >
        {recording ? (
          <div className="flex items-center gap-3 px-3.5 py-3">
            <span className="w-2 h-2 rounded-full bg-(--danger,#ef4444) animate-pulse shrink-0" />
            <span className="text-[13px] text-(--text2) flex-1">
              Listening… speak now
            </span>
            <button
              onClick={stopRecording}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
                bg-(--danger,#ef4444) text-white
                transition-opacity hover:opacity-85
              "
            >
              <MicOff size={12} />
              Stop
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-2 px-3 pt-2.5 pb-2">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Message the team… use @ai to invoke assistant"
                rows={1}
                className="
                  flex-1 bg-transparent border-none outline-none resize-none
                  text-(--text) placeholder:text-(--text3)
                  text-[13.5px] leading-normal font-(--ff,sans-serif)
                  min-h-5.5 max-h-40
                "
              />

              <button
                onClick={handleSend}
                disabled={!canSend}
                className={`
                  w-7.5 h-7.5 rounded-lg shrink-0
                  flex items-center justify-center
                  transition-all duration-150
                  ${
                    canSend
                      ? "bg-(--accent) text-black cursor-pointer hover:opacity-85 active:scale-95"
                      : "bg-(--surface2) text-(--text3) cursor-not-allowed"
                  }
                `}
              >
                {sending ? (
                  <div className="spinner w-3! h-3! border-[1.5px]! border-t-black! border-black/20!" />
                ) : (
                  <ArrowUp size={15} />
                )}
              </button>
            </div>

            <div
              className="
              flex items-center gap-0.5 px-2 py-1.5
              border-t border-(--border)
            "
            >
              <InputToolBtn onClick={startRecording} title="Voice input">
                <Mic size={13} />
              </InputToolBtn>

              <InputToolBtn
                onClick={() => {
                  setContent((c) => c + "@ai ");
                  setTimeout(() => textareaRef.current?.focus(), 0);
                }}
                title="Invoke AI"
              >
                <Sparkles size={13} />
              </InputToolBtn>

              <div className="flex-1" />

              <div className="hidden sm:flex items-center gap-1 text-[10.5px] text-(--text3)">
                <kbd className="bg-(--surface2) border border-(--border) px-1 py-px rounded text-[9.5px]">
                  Enter
                </kbd>
                <span>send</span>
                <span className="opacity-40">·</span>
                <kbd className="bg-(--surface2) border border-(--border) px-1 py-px rounded text-[9.5px]">
                  ⇧ Enter
                </kbd>
                <span>newline</span>
              </div>
            </div>
          </>
        )}
      </div>

      {aiResponding && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <div className="flex gap-0.75">
            <span className="streaming-dot" />
            <span className="streaming-dot" />
            <span className="streaming-dot" />
          </div>
          <span className="text-[11.5px] text-(--ai,#5b9cf6)">
            Nexus is responding…
          </span>
        </div>
      )}
    </div>
  );
}

function InputToolBtn({
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
      className="
        flex items-center justify-center w-7 h-7 rounded-md
        text-(--text3) bg-transparent border-none cursor-pointer
        transition-all duration-120
        hover:bg-(--surface2) hover:text-(--text)
      "
    >
      {children}
    </button>
  );
}
