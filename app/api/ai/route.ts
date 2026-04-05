import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  adminCreateAIMessageDoc,
  adminUpdateAIMessage,
  adminUpdateRoomLastMessage,
  adminSetAIResponding,
} from "@/lib/firestore-admin";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Nexus, an intelligent AI assistant embedded in a professional team workspace chat. You are helpful, concise, and technically capable.

Key behaviors:
- You respond as a knowledgeable team member, not as a generic AI  
- Keep responses focused and actionable — this is a chat, not a document
- Use markdown formatting when showing code or structured information
- Be direct. Engineers appreciate clarity over verbosity.`;

const roomLastInvocation = new Map<string, number>();
const RATE_LIMIT_MS = 3000;

export async function POST(req: NextRequest) {
  try {
    const { roomId, messages, userId } = await req.json();

    if (!roomId || !messages || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const lastInvocation = roomLastInvocation.get(roomId) || 0;
    if (Date.now() - lastInvocation < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: "AI is still responding. Please wait." },
        { status: 429 },
      );
    }
    roomLastInvocation.set(roomId, Date.now());

    const aiMessageId = await adminCreateAIMessageDoc(roomId);
    await adminSetAIResponding(roomId, true);

    streamGroqResponse(roomId, aiMessageId, messages).catch(async (err) => {
      console.error("Groq stream error:", err);
      await adminUpdateAIMessage(
        roomId,
        aiMessageId,
        "Failed to generate response.",
        false,
        true,
      );
      await adminSetAIResponding(roomId, false);
    });

    return NextResponse.json({ messageId: aiMessageId, status: "streaming" });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { roomId } = await req.json();

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    await adminSetAIResponding(roomId, false);
    return NextResponse.json({ status: "stopped" });
  } catch (err) {
    console.error("AI stop error:", err);
    return NextResponse.json({ error: "Failed to stop AI" }, { status: 500 });
  }
}

async function streamGroqResponse(
  roomId: string,
  messageId: string,
  contextMessages: { role: "user" | "assistant"; content: string }[],
) {
  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...contextMessages,
      ],
      stream: true,
    });

    let fullContent = "";
    let lastUpdate = Date.now();
    let firstUpdate = true;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (!delta) continue;

      fullContent += delta;

      const now = Date.now();

      const shouldUpdate =
        (firstUpdate && (now - lastUpdate > 50 || fullContent.length > 50)) ||
        (!firstUpdate && now - lastUpdate > 150);

      if (shouldUpdate) {
        await adminUpdateAIMessage(roomId, messageId, fullContent, true);
        lastUpdate = now;
        firstUpdate = false;
      }
    }

    if (fullContent) {
      await adminUpdateAIMessage(roomId, messageId, fullContent, false);
      await adminUpdateRoomLastMessage(roomId, `AI: ${fullContent}`);
    }
    await adminSetAIResponding(roomId, false);
  } catch (err) {
    console.error("[AI] Stream failed:", err);
    throw err;
  }
}
