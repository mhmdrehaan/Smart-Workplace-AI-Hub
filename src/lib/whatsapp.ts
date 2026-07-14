/**
 * @file whatsapp.ts
 * @description Green-API WhatsApp notification utility for Smart Workplace AI Hub.
 *
 * Sends formatted WhatsApp messages using the Green-API Developer Free Tier.
 * Credentials are read securely from environment variables at runtime (server-side only).
 *
 * Environment Variables required (in .env.local):
 *   GREEN_API_INSTANCE_ID  — Your Green-API instance ID
 *   GREEN_API_TOKEN        — Your Green-API access token
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Parameters required to dispatch a task notification via WhatsApp. */
export interface TaskNotificationParams {
  /** Recipient phone number, e.g. "6283804064832" (digits only, no + or spaces). */
  toPhone: string
  /** The name / title of the newly created task. */
  taskName: string
  /** Human-readable deadline string, e.g. "2026-08-01" or "August 1, 2026". */
  deadline: string
  /** Full name of the person the task is assigned to. */
  assigneeName: string
}

/** Shape of the successful Green-API sendMessage response. */
interface GreenApiSendMessageResponse {
  idMessage: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sanitizes a phone number string by stripping all non-numeric characters
 * and appending the "@c.us" suffix required by Green-API as the chatId.
 *
 * @example
 *   buildChatId("+62 838-0406-4832") // -> "6283804064832@c.us"
 */
function buildChatId(phone: string): string {
  // 1. Bersihkan semua karakter non-digit (spasi, strip, dll.)
  let cleaned = phone.replace(/\D/g, "");

  // 2. Jika nomor diawali dengan '0', ubah menjadi kode negara '62'
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }

  // 3. Jika user menulis '+62' atau '62', biarkan saja, lalu pasang postfix @c.us
  return `${cleaned}@c.us`;
}

/**
 * Safely extracts the calendar day from any date string, stripping time
 * components and timezone offsets so the recipient sees only "YYYY-MM-DD".
 *
 * Strategy: slice the first 10 characters of the (trimmed) input string.
 * This avoids `new Date()` timezone shifting for dates stored at 00:00 UTC,
 * which would roll back one calendar day in timezones behind UTC (e.g. WIB UTC+7).
 *
 * @example
 *   formatDeadlineForWhatsApp("2026-07-15T00:00:00+00:00") // → "2026-07-15"
 *   formatDeadlineForWhatsApp("2026-07-15")                 // → "2026-07-15"
 *   formatDeadlineForWhatsApp("")                           // → "No deadline set"
 */
function formatDeadlineForWhatsApp(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return "No deadline set"

  // Take only the YYYY-MM-DD portion (first 10 chars) — safe for any ISO variant
  const dateOnly = trimmed.slice(0, 10)

  // Validate the extracted portion looks like a real date before returning it
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) && !isNaN(Date.parse(dateOnly))
  return isValidDate ? dateOnly : trimmed
}

/**
 * Constructs a beautifully formatted WhatsApp message body using
 * WhatsApp markdown (asterisks for bold, underscores for italic, newlines).
 */
function buildMessageText(
  taskName: string,
  deadline: string,
  assigneeName: string
): string {
  const formattedDeadline = formatDeadlineForWhatsApp(deadline)

  return [
    `*NEW TASK DELEGATED BY AI*`,
    ``,
    `Hello *${assigneeName}*,`,
    `A new automated task has been assigned to you:`,
    ``,
    `*Task:* ${taskName}`,
    `*Deadline:* ${formattedDeadline}`,
    ``,
    `_This automated workflow is powered by your_`,
    `_AI Agent Smart Workplace Hub._`,
    ``,
    `Please acknowledge and begin work at your earliest convenience.`,
    `Good luck!`,
  ].join("\n")
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Sends a WhatsApp task-delegation notification to the specified phone number
 * via the Green-API REST endpoint.
 *
 * This function is **server-side only** - never import it in a Client Component.
 * It reads GREEN_API_INSTANCE_ID and GREEN_API_TOKEN from the Node.js environment.
 *
 * @param params - See TaskNotificationParams
 * @returns The Green-API idMessage string on success.
 * @throws An Error with a descriptive message on any failure.
 */
export async function sendTaskNotification(
  params: TaskNotificationParams
): Promise<string> {
  const { toPhone, taskName, deadline, assigneeName } = params

  // 1. Read and validate credentials
  const instanceId = process.env.GREEN_API_INSTANCE_ID
  const token = process.env.GREEN_API_TOKEN

  if (!instanceId || !token) {
    throw new Error(
      "[WhatsApp] Missing environment variables: " +
        "GREEN_API_INSTANCE_ID and/or GREEN_API_TOKEN are not set."
    )
  }

  // 2. Build request parts
  const chatId = buildChatId(toPhone)
  const messageText = buildMessageText(taskName, deadline, assigneeName)
  const endpoint = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`

  const payload = {
    chatId,
    message: messageText,
  }

  // 3. Send HTTP request
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    // Prevent Next.js from caching this mutation request
    cache: "no-store",
  })

  // 4. Handle non-2xx responses
  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `[WhatsApp] Green-API responded with HTTP ${response.status}: ${errorBody}`
    )
  }

  // 5. Parse and return the message ID
  const data = (await response.json()) as GreenApiSendMessageResponse

  if (!data.idMessage) {
    throw new Error(
      "[WhatsApp] Green-API returned an unexpected response shape: " +
        JSON.stringify(data)
    )
  }

  return data.idMessage
}
