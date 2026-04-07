import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  adminCreateAIMessageDoc,
  adminUpdateAIMessage,
  adminUpdateRoomLastMessage,
  adminSetAIResponding,
} from "@/lib/firestore-admin";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const DEFAULT_AI_PROVIDER = process.env.AI_PROVIDER || "groq"; // "groq" or "gemini"
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-13b-standard";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are Nexus, an intelligent AI assistant embedded in a professional team workspace chat. You are helpful, concise, and technically capable.

Key behaviors:
- You respond as a knowledgeable team member, not as a generic AI
- Keep responses focused and actionable — this is a chat, not a document
- Use markdown formatting when showing code or structured information
- Be direct. Engineers appreciate clarity over verbosity.`;

const roomLastInvocation = new Map<string, number>();
const activeRequests = new Map<string, AbortController>();
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

    const existingController = activeRequests.get(roomId);
    if (existingController) {
      existingController.abort();
    }

    const abortController = new AbortController();
    activeRequests.set(roomId, abortController);

    const aiMessageId = await adminCreateAIMessageDoc(roomId);
    await adminSetAIResponding(roomId, true);

    const streamPromise =
      DEFAULT_AI_PROVIDER === "gemini"
        ? streamGeminiResponse(
            roomId,
            aiMessageId,
            messages,
            abortController.signal,
          )
        : streamGroqResponse(
            roomId,
            aiMessageId,
            messages,
            abortController.signal,
          );

    streamPromise
      .catch(async (err) => {
        if (err.name === "AbortError") {
          console.log(`AI request cancelled for room ${roomId}`);
          await adminUpdateAIMessage(
            roomId,
            aiMessageId,
            "Request cancelled.",
            false,
            false,
          );
        } else {
          console.error(`${DEFAULT_AI_PROVIDER} stream error:`, err);
          await adminUpdateAIMessage(
            roomId,
            aiMessageId,
            "Failed to generate response.",
            false,
            true,
          );
        }
        await adminSetAIResponding(roomId, false);
        activeRequests.delete(roomId);
      })
      .then(() => {
        activeRequests.delete(roomId);
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

    const controller = activeRequests.get(roomId);
    if (controller) {
      controller.abort();
      activeRequests.delete(roomId);
    }

    await adminSetAIResponding(roomId, false);
    return NextResponse.json({ status: "cancelled" });
  } catch (err) {
    console.error("AI cancel error:", err);
    return NextResponse.json(
      { error: "Failed to cancel AI request" },
      { status: 500 },
    );
  }
}

async function streamGroqResponse(
  roomId: string,
  messageId: string,
  contextMessages: { role: "user" | "assistant"; content: string }[],
  abortSignal: AbortSignal,
) {
  try {
    const stream = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
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
      if (abortSignal.aborted) {
        throw new Error("Request cancelled");
      }

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
    if (err instanceof Error && err.message === "Request cancelled") {
      throw err;
    }
    console.error("[AI] Groq stream failed:", err);
    throw err;
  }
}

async function streamGeminiResponse(
  roomId: string,
  messageId: string,
  contextMessages: { role: "user" | "assistant"; content: string }[],
  abortSignal: AbortSignal,
) {
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });

    let history = contextMessages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    //

    const firstUserIndex = history.findIndex((msg) => msg.role === "user");
    if (firstUserIndex > 0) {
      history = history.slice(firstUserIndex);
    } else if (firstUserIndex === -1) {
      history = [];
    }

    const lastMessage = contextMessages[contextMessages.length - 1];
    const prompt = lastMessage.content;

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 800,
      },
    });

    const result = await chat.sendMessageStream(prompt);

    let fullContent = "";
    let lastUpdate = Date.now();
    let firstUpdate = true;

    for await (const chunk of result.stream) {
      if (abortSignal.aborted) {
        throw new Error("Request cancelled");
      }

      const chunkText = chunk.text();
      if (!chunkText) continue;

      fullContent += chunkText;

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
    if (err instanceof Error && err.message === "Request cancelled") {
      throw err;
    }
    console.error("[AI] Gemini stream failed:", err);
    throw err;
  }
}
