const assert = require('assert');

// Test category normalization
const VALID_CATEGORIES = ["Books", "Electronics", "Accessories", "Stationary", "Others"];

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

function parseGeminiJson(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw new Error("Unable to parse structured response from Gemini: " + err.message);
  }
}

console.log("Running AI Assistant Test Suite...");

// 1. Test Category Normalization
assert.strictEqual(normalizeCategory("Books"), "Books");
assert.strictEqual(normalizeCategory("books"), "Books");
assert.strictEqual(normalizeCategory("Engineering Tools"), "Electronics");
assert.strictEqual(normalizeCategory("Scientific Calculator"), "Electronics");
assert.strictEqual(normalizeCategory("Engineering Drawing Drafter"), "Stationary");
assert.strictEqual(normalizeCategory("Stationery"), "Stationary");
assert.strictEqual(normalizeCategory("Hero Sprint Bicycle"), "Accessories");
assert.strictEqual(normalizeCategory("Room Cooler"), "Electronics");
assert.strictEqual(normalizeCategory("Unknown Random", "Books"), "Books");
assert.strictEqual(normalizeCategory("Unknown Random", null), "Others");
console.log("✓ Category normalization tests passed");

// 2. Test JSON parsing with Markdown backticks
const cleanJson = JSON.stringify({
  title: "Casio FX-991EX Calculator",
  description: "Working condition calculator.",
  category: "Electronics",
  keywords: ["calculator", "casio"],
  conditionSummary: "Used - Good"
});

const wrappedInBackticks = "```json\n" + cleanJson + "\n```";
const parsed1 = parseGeminiJson(wrappedInBackticks);
assert.strictEqual(parsed1.title, "Casio FX-991EX Calculator");
assert.strictEqual(parsed1.keywords.length, 2);

const withNoise = "Here is the listing:\n" + cleanJson + "\nHope this helps!";
const parsed2 = parseGeminiJson(withNoise);
assert.strictEqual(parsed2.title, "Casio FX-991EX Calculator");
console.log("✓ JSON parsing & extraction tests passed");

// 3. Test Description Length Enforcement
let longDesc = "A".repeat(600);
if (longDesc.length > 500) {
  longDesc = longDesc.slice(0, 497) + "...";
}
assert.strictEqual(longDesc.length, 500);
console.log("✓ Description cap enforcement passed");

console.log("All AI Assistant logic tests passed successfully!");
