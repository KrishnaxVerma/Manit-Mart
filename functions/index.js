const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

// Secret definition for production deployments
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Allowed categories matching MANIT Mart taxonomy
const VALID_CATEGORIES = ["Books", "Electronics", "Accessories", "Stationary", "Others"];

// In-memory sliding-window rate limiter per user (UID)
// Limits: max 5 requests per 60s window, minimum 2s between requests
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MIN_INTERVAL_MS = 2000;

function checkRateLimit(uid) {
  const now = Date.now();
  const record = rateLimitMap.get(uid) || { timestamps: [] };

  // Remove timestamps older than the window
  record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (record.timestamps.length > 0) {
    const lastRequest = record.timestamps[record.timestamps.length - 1];
    if (now - lastRequest < MIN_INTERVAL_MS) {
      throw new HttpsError(
        "resource-exhausted",
        "Please wait a moment before sending another request."
      );
    }
  }

  if (record.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    throw new HttpsError(
      "resource-exhausted",
      "Request limit reached (maximum 5 requests per minute). Please try again shortly."
    );
  }

  record.timestamps.push(now);
  rateLimitMap.set(uid, record);

  // Periodically clean up stale records
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.timestamps.length === 0 || now - value.timestamps[value.timestamps.length - 1] > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }
}

/**
 * Normalizes category to one of the 5 canonical MANIT Mart categories.
 */
function normalizeCategory(suggested, existingCategory) {
  if (!suggested || typeof suggested !== "string") {
    return existingCategory && VALID_CATEGORIES.includes(existingCategory)
      ? existingCategory
      : "Others";
  }

  const trimmed = suggested.trim();
  const exactMatch = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  const lower = trimmed.toLowerCase();
  if (
    lower.includes("book") ||
    lower.includes("novel") ||
    lower.includes("textbook") ||
    lower.includes("notes") ||
    lower.includes("manual")
  ) {
    return "Books";
  }
  if (
    lower.includes("electronic") ||
    lower.includes("laptop") ||
    lower.includes("mobile") ||
    lower.includes("calculator") ||
    lower.includes("phone") ||
    lower.includes("charger") ||
    lower.includes("mouse") ||
    lower.includes("keyboard") ||
    lower.includes("headphone") ||
    lower.includes("earphone") ||
    lower.includes("cooler") ||
    lower.includes("kettle") ||
    lower.includes("iron") ||
    lower.includes("tool")
  ) {
    return "Electronics";
  }
  if (
    lower.includes("stationery") ||
    lower.includes("stationary") ||
    lower.includes("pen") ||
    lower.includes("pencil") ||
    lower.includes("drafter") ||
    lower.includes("sheet") ||
    lower.includes("scale") ||
    lower.includes("chart")
  ) {
    return "Stationary";
  }
  if (
    lower.includes("accessory") ||
    lower.includes("accessories") ||
    lower.includes("bag") ||
    lower.includes("backpack") ||
    lower.includes("watch") ||
    lower.includes("bottle") ||
    lower.includes("umbrella") ||
    lower.includes("cycle") ||
    lower.includes("bicycle")
  ) {
    return "Accessories";
  }

  if (existingCategory && VALID_CATEGORIES.includes(existingCategory)) {
    return existingCategory;
  }

  return "Others";
}

/**
 * Safely parses JSON response from Gemini, removing code blocks or extra whitespace.
 */
function parseGeminiJson(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  cleaned = cleaned.trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // If there is any trailing or leading text, extract between first { and last }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw new Error("Unable to parse structured response from Gemini: " + err.message);
  }
}

/**
 * Cloud Function: generateListingAssistant
 * Accessible via Firebase callable SDK
 */
exports.generateListingAssistant = onCall(
  {
    region: "asia-south1",
    secrets: [geminiApiKey],
    timeoutSeconds: 60,
    memory: "512MiB",
    cors: true
  },
  async (request) => {
    // 1. Authentication check
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to use the AI Listing Assistant."
      );
    }

    const uid = request.auth.uid;

    // 2. Per-user rate limiting
    checkRateLimit(uid);

    // 3. Input extraction & validation
    const data = request.data || {};
    const rawProductName = data.productName || data.title;
    if (!rawProductName || typeof rawProductName !== "string" || rawProductName.trim().length < 2) {
      throw new HttpsError(
        "invalid-argument",
        "Product name is required and must be at least 2 characters."
      );
    }
    const productName = rawProductName.trim().slice(0, 150);

    const rawCondition = data.condition;
    if (!rawCondition || typeof rawCondition !== "string" || rawCondition.trim().length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Product condition is required."
      );
    }
    const condition = rawCondition.trim().slice(0, 50);

    const category = typeof data.category === "string" ? data.category.trim().slice(0, 50) : "";
    const sellingPrice = data.price !== undefined && data.price !== null && data.price !== ""
      ? Number(data.price)
      : null;
    const originalPrice = data.originalPrice !== undefined && data.originalPrice !== null && data.originalPrice !== ""
      ? Number(data.originalPrice)
      : null;
    const additionalInfo = typeof data.additionalInfo === "string"
      ? data.additionalInfo.trim().slice(0, 500)
      : "";

    // 4. Resolve API key
    let apiKey = null;
    try {
      apiKey = geminiApiKey.value();
    } catch (_) {
      // Ignored if running in local environment without secrets manager
    }
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY;
    }
    if (!apiKey) {
      console.error("Gemini API key is missing. Set GEMINI_API_KEY secret or env var.");
      throw new HttpsError(
        "failed-precondition",
        "AI Assistant is not configured on the server. Please contact the administrator."
      );
    }

    // 5. Initialize Gemini SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

    // Define structured schema
    const responseSchema = {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "Clear and attractive product title (up to 80 characters)"
        },
        description: {
          type: SchemaType.STRING,
          description: "Detailed, natural-sounding product description (max 480 characters) strictly based on provided facts without hallucinating claims"
        },
        category: {
          type: SchemaType.STRING,
          description: "Best matching category from: Books, Electronics, Accessories, Stationary, Others"
        },
        keywords: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Array of 3 to 6 relevant search keywords for campus marketplace search"
        },
        conditionSummary: {
          type: SchemaType.STRING,
          description: "Short description of the product condition based strictly and only on user-provided details"
        }
      },
      required: ["title", "description", "category", "keywords", "conditionSummary"]
    };

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2
      },
      systemInstruction: `You are the AI Listing Assistant for MANIT Mart, a peer-to-peer campus marketplace for students of MANIT Bhopal.
Your job is to generate a structured, factual, student-friendly product listing.

Allowed Categories (choose the single closest fit):
- "Books" (textbooks, reference books, novels, GATE/CAT prep books, semester notes)
- "Electronics" (calculators, laptops, phones, chargers, peripherals, room heaters, electric kettles)
- "Accessories" (cycles, bags, backpacks, bottles, sports equipment, watches)
- "Stationary" (drafters, chart holders, engineering drawing tools, pens, notebooks)
- "Others" (hostel essentials, mattress, buckets, furniture)

CRITICAL FACTUALITY RULES:
1. NEVER invent specifications, unstated brand models, internal specs, warranties, or condition claims that the student did not provide.
2. If original price or extra info is not provided, do not make them up.
3. The description should be engaging and relevant for college students (e.g. utility for courses, hostels, or exams) while remaining strictly accurate to the input.
4. Keep the description under 480 characters so it fits comfortably within the 500-character form limit.
5. Provide a conditionSummary that summarizes only the provided condition and student notes.
6. Return only valid JSON conforming strictly to the requested schema.`
    });

    // 6. Build prompt content
    const promptParts = [];

    let userPromptText = `Generate a marketplace listing with the following student-provided details:
- Product Name / Item: ${productName}
- Condition: ${condition}
`;

    if (category) {
      userPromptText += `- Currently Selected Category: ${category}\n`;
    }
    if (sellingPrice !== null && !isNaN(sellingPrice)) {
      userPromptText += `- Selling Price: ₹${sellingPrice}\n`;
    }
    if (originalPrice !== null && !isNaN(originalPrice)) {
      userPromptText += `- Original Price: ₹${originalPrice}\n`;
    }
    if (additionalInfo) {
      userPromptText += `- Additional Information: ${additionalInfo}\n`;
    }

    promptParts.push(userPromptText);

    // Optional image processing if provided
    if (data.image && typeof data.image === "object" && data.image.data && data.image.mimeType) {
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
      if (allowedMimes.includes(data.image.mimeType)) {
        // Limit base64 length to ~4MB
        if (typeof data.image.data === "string" && data.image.data.length < 5 * 1024 * 1024) {
          promptParts.push({
            inlineData: {
              mimeType: data.image.mimeType,
              data: data.image.data
            }
          });
          promptParts.push(
            "Note: An image of the item is attached. Use it only to visually identify the item type, color, and visible characteristics. DO NOT assume or claim unverified internal specs or working condition."
          );
        }
      }
    }

    // 7. Call Gemini API
    let responseText = "";
    try {
      const result = await model.generateContent(promptParts);
      const response = await result.response;
      responseText = response.text();
    } catch (apiError) {
      console.error("Gemini API Error:", apiError);
      const msg = String(apiError.message || apiError);

      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
        throw new HttpsError(
          "resource-exhausted",
          "Gemini API quota exceeded or rate limit reached. Please try again in a moment."
        );
      }
      if (msg.includes("DEADLINE_EXCEEDED") || msg.includes("timeout")) {
        throw new HttpsError(
          "deadline-exceeded",
          "The AI request timed out. Please try again."
        );
      }
      throw new HttpsError(
        "internal",
        "Failed to generate listing using Gemini: " + (apiError.message || "Unknown error")
      );
    }

    // 8. Parse and validate JSON response
    let parsed = null;
    try {
      parsed = parseGeminiJson(responseText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response:", responseText, parseErr);
      throw new HttpsError(
        "internal",
        "AI generated an invalid response format. Please try again."
      );
    }

    if (!parsed || typeof parsed !== "object") {
      throw new HttpsError("internal", "Empty or incomplete response from AI.");
    }

    // Clean and validate fields
    const title = typeof parsed.title === "string" && parsed.title.trim().length > 0
      ? parsed.title.trim()
      : productName;

    let description = typeof parsed.description === "string" && parsed.description.trim().length > 0
      ? parsed.description.trim()
      : (additionalInfo || `Listing for ${productName} in ${condition} condition.`);

    // Enforce 500-char cap of MANIT Mart description
    if (description.length > 500) {
      description = description.slice(0, 497) + "...";
    }

    const resolvedCategory = normalizeCategory(parsed.category, category);

    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords
          .filter((k) => typeof k === "string" && k.trim().length > 0)
          .map((k) => k.trim())
          .slice(0, 8)
      : [productName, resolvedCategory];

    const conditionSummary = typeof parsed.conditionSummary === "string" && parsed.conditionSummary.trim().length > 0
      ? parsed.conditionSummary.trim()
      : `Condition: ${condition}`;

    // 9. Return structured data to frontend
    return {
      title,
      description,
      category: resolvedCategory,
      keywords,
      conditionSummary
    };
  }
);
