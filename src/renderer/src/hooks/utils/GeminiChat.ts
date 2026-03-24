import { type Chat, GoogleGenAI } from '@google/genai'

const SYSTEM_PROMPT = `You are a writing assistant for workplace chat messages.
Your job is to improve messages that will be sent to coworkers via chat (Slack, Teams, etc.).

For each message, fix grammar and spelling, but also make it clearer, more understandable, and appropriately professional. Keep the tone friendly and natural — not overly formal or robotic.

Analyze the text and return a JSON object with:
- "options": an array of 3 improved variants, each with:
  - "label": a short style label (e.g. "Clear", "Professional", "Concise")
  - "correctedText": the improved version in that style
- "explanation": a brief summary of what was improved (or "No changes needed" if the message is already clear)

IMPORTANT: Return ONLY valid JSON — no markdown, no code fences, no extra commentary.`

export class GeminiChat {
  readonly chat: Chat

  constructor(apiKey: string, model: string) {
    const ai = new GoogleGenAI({ apiKey })
    this.chat = ai.chats.create({ model, config: { systemInstruction: SYSTEM_PROMPT } })
  }

  async sendMessage(message: string): Promise<string> {
    const response = await this.chat.sendMessage({ message })
    return response.text ?? ''
  }
}
