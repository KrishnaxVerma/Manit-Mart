import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { httpsCallable } from 'firebase/functions'
import { auth, functions } from '../firebase'

const ALLOWED_CATEGORIES = ['Books', 'Electronics', 'Accessories', 'Stationary', 'Others']

/**
 * Resizes an image file to a lightweight data URL for AI context if needed.
 * Keeps upload under ~1MB to ensure fast requests and comply with payload limits.
 */
const convertFileToAiImage = (file) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      return resolve(null)
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX_DIM = 1024
        let width = img.width
        let height = img.height

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width)
            width = MAX_DIM
          } else {
            width = Math.round((width * MAX_DIM) / height)
            height = MAX_DIM
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const mimeType = 'image/jpeg'
        const dataUrl = canvas.toDataURL(mimeType, 0.8)
        const base64Data = dataUrl.split(',')[1]

        resolve({
          mimeType,
          data: base64Data
        })
      }
      img.onerror = () => resolve(null)
      img.src = e.target.result
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

/**
 * Normalizes category to one of the 5 canonical MANIT Mart categories.
 */
function normalizeCategory(suggested, existingCategory) {
  if (!suggested || typeof suggested !== 'string') {
    return existingCategory && ALLOWED_CATEGORIES.includes(existingCategory)
      ? existingCategory
      : 'Others'
  }

  const trimmed = suggested.trim()
  const exactMatch = ALLOWED_CATEGORIES.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  )
  if (exactMatch) return exactMatch

  const lower = trimmed.toLowerCase()
  if (
    lower.includes('book') ||
    lower.includes('novel') ||
    lower.includes('textbook') ||
    lower.includes('notes') ||
    lower.includes('manual')
  ) {
    return 'Books'
  }
  if (
    lower.includes('electronic') ||
    lower.includes('laptop') ||
    lower.includes('mobile') ||
    lower.includes('calculator') ||
    lower.includes('phone') ||
    lower.includes('charger') ||
    lower.includes('mouse') ||
    lower.includes('keyboard') ||
    lower.includes('headphone') ||
    lower.includes('earphone') ||
    lower.includes('cooler') ||
    lower.includes('kettle') ||
    lower.includes('iron') ||
    lower.includes('tool')
  ) {
    return 'Electronics'
  }
  if (
    lower.includes('stationery') ||
    lower.includes('stationary') ||
    lower.includes('pen') ||
    lower.includes('pencil') ||
    lower.includes('drafter') ||
    lower.includes('sheet') ||
    lower.includes('scale') ||
    lower.includes('chart')
  ) {
    return 'Stationary'
  }
  if (
    lower.includes('accessory') ||
    lower.includes('accessories') ||
    lower.includes('bag') ||
    lower.includes('backpack') ||
    lower.includes('watch') ||
    lower.includes('bottle') ||
    lower.includes('umbrella') ||
    lower.includes('cycle') ||
    lower.includes('bicycle')
  ) {
    return 'Accessories'
  }

  if (existingCategory && ALLOWED_CATEGORIES.includes(existingCategory)) {
    return existingCategory
  }

  return 'Others'
}

/**
 * Safely parses JSON response from Gemini, removing code blocks or extra whitespace.
 */
function parseGeminiJson(rawText) {
  let cleaned = (rawText || '').trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  }
  cleaned = cleaned.trim()

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1)
      return JSON.parse(extracted)
    }
    throw new Error('Unable to parse structured response from Gemini: ' + err.message)
  }
}

/**
 * Directly generates listing content using Gemini SDK in client-side demo mode.
 */
async function generateDirectWithGemini(apiKey, payload) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const candidateModels = [
    import.meta.env.VITE_GEMINI_MODEL,
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash'
  ].filter(Boolean)

  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description: 'Clear and attractive product title (up to 80 characters)'
      },
      description: {
        type: SchemaType.STRING,
        description: 'Detailed, natural-sounding product description (max 480 characters) strictly based on provided facts without hallucinating claims'
      },
      category: {
        type: SchemaType.STRING,
        description: 'Best matching category from: Books, Electronics, Accessories, Stationary, Others'
      },
      keywords: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: 'Array of 3 to 6 relevant search keywords for campus marketplace search'
      },
      conditionSummary: {
        type: SchemaType.STRING,
        description: 'Short description of the product condition based strictly and only on user-provided details'
      }
    },
    required: ['title', 'description', 'category', 'keywords', 'conditionSummary']
  }

  const systemInstruction = `You are the AI Listing Assistant for MANIT Mart, a peer-to-peer campus marketplace for students of MANIT Bhopal.
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

  const promptParts = []
  let userPromptText = `Generate a marketplace listing with the following student-provided details:
- Product Name / Item: ${payload.productName}
- Condition: ${payload.condition}
`
  if (payload.category) {
    userPromptText += `- Currently Selected Category: ${payload.category}\n`
  }
  if (payload.price !== null && !isNaN(payload.price)) {
    userPromptText += `- Selling Price: ₹${payload.price}\n`
  }
  if (payload.originalPrice !== null && !isNaN(payload.originalPrice)) {
    userPromptText += `- Original Price: ₹${payload.originalPrice}\n`
  }
  if (payload.additionalInfo) {
    userPromptText += `- Additional Information: ${payload.additionalInfo}\n`
  }
  promptParts.push(userPromptText)

  if (payload.image && payload.image.data && payload.image.mimeType) {
    promptParts.push({
      inlineData: {
        mimeType: payload.image.mimeType,
        data: payload.image.data
      }
    })
    promptParts.push(
      'Note: An image of the item is attached. Use it only to visually identify the item type, color, and visible characteristics. DO NOT assume or claim unverified internal specs or working condition.'
    )
  }

  let responseText = ''
  let lastError = null

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2
        },
        systemInstruction
      })

      const result = await model.generateContent(promptParts)
      const response = await result.response
      responseText = response.text()
      if (responseText) {
        lastError = null
        break
      }
    } catch (apiError) {
      console.warn(`Model ${modelName} failed, trying fallback if available:`, apiError?.message || apiError)
      lastError = apiError
    }
  }

  if (!responseText && lastError) {
    console.error('All candidate Gemini models failed:', lastError)
    const msg = String(lastError.message || lastError)
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please try again in a moment.')
    }
    if (msg.includes('API_KEY_INVALID') || msg.includes('403') || msg.includes('invalid API key')) {
      throw new Error('Gemini API key is invalid or unauthorized. Please verify the key in .env.')
    }
    throw new Error('Failed to generate listing using Gemini: ' + (lastError.message || 'Unknown error'))
  }

  const parsed = parseGeminiJson(responseText)
  const title = typeof parsed.title === 'string' && parsed.title.trim().length > 0
    ? parsed.title.trim()
    : payload.productName

  let description = typeof parsed.description === 'string' && parsed.description.trim().length > 0
    ? parsed.description.trim()
    : (payload.additionalInfo || `Listing for ${payload.productName} in ${payload.condition} condition.`)

  if (description.length > 500) {
    description = description.slice(0, 497) + '...'
  }

  const resolvedCategory = normalizeCategory(parsed.category, payload.category)

  const keywords = Array.isArray(parsed.keywords)
    ? parsed.keywords.filter((k) => typeof k === 'string' && k.trim().length > 0).map((k) => k.trim()).slice(0, 8)
    : [payload.productName, resolvedCategory]

  const conditionSummary = typeof parsed.conditionSummary === 'string' && parsed.conditionSummary.trim().length > 0
    ? parsed.conditionSummary.trim()
    : `Condition: ${payload.condition}`

  return {
    title,
    description,
    category: resolvedCategory,
    keywords,
    conditionSummary
  }
}

/**
 * Invokes the AI assistant to generate optimized listing details.
 *
 * Uses direct Gemini client mode if VITE_GEMINI_API_KEY is configured (ideal for Spark plan demo/evaluation),
 * or routes through the secure Firebase Callable Cloud Function if configured on Blaze.
 *
 * @param {Object} params
 * @param {string} params.productName - Rough product name or title
 * @param {string} params.category - Existing category choice
 * @param {string} params.condition - Selected condition (Like New, Good, Fair, Poor)
 * @param {number|string} [params.price] - Selling price in INR
 * @param {number|string} [params.originalPrice] - Original purchase price in INR
 * @param {string} [params.additionalInfo] - Additional features or condition notes
 * @param {File} [params.imageFile] - Local image file for multimodal understanding
 * @returns {Promise<{ title: string, description: string, category: string, keywords: string[], conditionSummary: string }>}
 */
export async function generateListingWithAI({
  productName,
  category,
  condition,
  price,
  originalPrice,
  additionalInfo,
  imageFile
}) {
  // 1. Client-side authentication check
  if (!auth.currentUser) {
    throw new Error('Please log in with your MANIT student account to use the AI Listing Assistant.')
  }

  // 2. Validate essential inputs
  const trimmedName = (productName || '').trim()
  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('Please enter a product title or rough name first (at least 2 characters).')
  }

  const trimmedCondition = (condition || '').trim()
  if (!trimmedCondition) {
    throw new Error('Please select a condition before generating with AI.')
  }

  // 3. Prepare optional image data
  let imagePayload = null
  if (imageFile) {
    try {
      imagePayload = await convertFileToAiImage(imageFile)
    } catch (err) {
      console.warn('Could not process image for AI context:', err)
      imagePayload = null
    }
  }

  // 4. Construct payload
  const payload = {
    productName: trimmedName,
    condition: trimmedCondition,
    category: category || '',
    price: price !== undefined && price !== '' ? Number(price) : null,
    originalPrice: originalPrice !== undefined && originalPrice !== '' ? Number(originalPrice) : null,
    additionalInfo: (additionalInfo || '').trim(),
    image: imagePayload
  }

  // 5. If VITE_GEMINI_API_KEY is defined in .env, execute direct client mode (Spark plan / Demo)
  const directApiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (directApiKey && typeof directApiKey === 'string' && directApiKey.trim().length > 0) {
    return await generateDirectWithGemini(directApiKey.trim(), payload)
  }

  // 6. Otherwise invoke Firebase Callable Cloud Function (Production Blaze mode)
  try {
    const generateFn = httpsCallable(functions, 'generateListingAssistant')
    const response = await generateFn(payload)
    const result = response?.data

    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response structure from AI Assistant.')
    }

    const generatedTitle = typeof result.title === 'string' && result.title.trim().length > 0
      ? result.title.trim()
      : trimmedName

    const generatedDescription = typeof result.description === 'string' && result.description.trim().length > 0
      ? result.description.trim()
      : ''

    let generatedCategory = ALLOWED_CATEGORIES.includes(result.category)
      ? result.category
      : (ALLOWED_CATEGORIES.includes(category) ? category : 'Others')

    const generatedKeywords = Array.isArray(result.keywords)
      ? result.keywords.filter((k) => typeof k === 'string' && k.trim().length > 0).map((k) => k.trim())
      : []

    const conditionSummary = typeof result.conditionSummary === 'string'
      ? result.conditionSummary.trim()
      : `Condition: ${trimmedCondition}`

    return {
      title: generatedTitle,
      description: generatedDescription,
      category: generatedCategory,
      keywords: generatedKeywords,
      conditionSummary
    }
  } catch (error) {
    console.error('AI Assistant invocation error:', error)

    const code = error?.code || ''
    const msg = error?.message || ''

    if (code === 'functions/unauthenticated' || msg.includes('unauthenticated')) {
      throw new Error('You must be signed in to use the AI Listing Assistant.')
    }
    if (code === 'functions/resource-exhausted' || msg.includes('limit') || msg.includes('quota')) {
      throw new Error('AI generation limit reached. Please wait a moment before trying again.')
    }
    if (code === 'functions/deadline-exceeded' || msg.includes('timeout')) {
      throw new Error('The AI generation request timed out. Please try again.')
    }
    if (code === 'functions/failed-precondition') {
      throw new Error('AI Assistant is not configured on the backend. Please contact the admin.')
    }
    if (code === 'functions/invalid-argument') {
      throw new Error(msg.replace(/^functions\//, '') || 'Please verify the entered product information.')
    }
    if (code === 'functions/unavailable' || code === 'functions/not-found' || msg.includes('Failed to fetch') || msg.includes('network')) {
      throw new Error('AI Listing Assistant service is currently unavailable. You can continue creating your listing manually.')
    }

    throw new Error(msg || 'Failed to generate listing with AI. Please try again or complete manually.')
  }
}
