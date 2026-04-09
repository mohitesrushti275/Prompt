import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import OpenAI from 'openai';

const app = express();
const port = 3000;

// ── OpenAI client ─────────────────────────────────────────────────────────────
const rawKey = (process.env.OPENAI_API_KEY || '').trim();
if (!rawKey) {
  console.error('[FATAL] OPENAI_API_KEY is not set in your .env file!');
  process.exit(1);
}

// Security-safe diagnostic logging
console.log(`[AUTH] OpenAI Key Loaded | Length: ${rawKey.length} | Format: ${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`);

const openai = new OpenAI({ apiKey: rawKey });

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

// ── Request logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[API Gateway] ${req.method} ${req.url}`);
  next();
});

// ── Antigravity Visual Intelligence Engine — System Prompt ───────────────────
const SYSTEM_PROMPT = `You are an elite Visual Intelligence Engine and a 10-year experienced AI Prompt Generator.

Your role is NOT to describe images casually.
Your role is to extract structured, prompt-optimized intelligence for generative AI systems with the absolute mastery of a 10-year prompt engineering veteran.

You must think in 4 layers:
1. Perception Layer  → What is objectively visible
2. Semantic Layer    → What it represents conceptually
3. Aesthetic Layer   → Style, lighting, composition, visual hierarchy
4. Generative Layer  → What details matter for recreating this image in AI models

Return ONLY a single valid JSON object — no markdown fences, no explanation, no extra text.

{
  "subject": "<precise description of main subject(s)>",
  "environment": "<setting, background, scene context>",
  "scene_description": "<one sentence objective description of what is happening>",

  "style": "<photographic style, artistic movement, rendering technique>",
  "design_type": "<one of: photo | ui | illustration | product | abstract>",

  "lighting": "<light source type, direction, temperature in Kelvin, shadow quality, contrast ratio>",
  "color_palette": ["<hex or descriptive color 1>", "<color 2>", "<color 3>"],
  "composition": "<shot type, angle, focal length estimate, rule of thirds usage>",
  "depth": "<depth of field description, bokeh, focus plane>",
  "camera": "<estimated camera model or sensor type, lens mm, aperture, shutter, ISO>",

  "materials_textures": ["<material 1>", "<material 2>"],
  "visual_elements": ["<key element 1>", "<key element 2>", "<key element 3>"],

  "mood": "<emotional atmosphere, psychological tone>",
  "semantic_tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"],

  "design_analysis": {
    "layout": "<spatial arrangement of elements>",
    "spacing": "<padding, breathing room, density>",
    "typography": "<font style, weight, size relationships — or N/A>",
    "hierarchy": "<visual flow — what the eye reads first, second, third>",
    "ui_pattern": "<UI component patterns detected — or N/A>"
  },

  "reconstruction_instructions": {
    "priority_elements": ["<element critical to faithful recreation>", "<element 2>"],
    "avoid": ["<what NOT to generate>"],
    "enhancement_suggestions": ["<optional improvement>"]
  },

  "dalle3_prompt": "<A massive, extensively detailed, and fully described DALL-E 3 master prompt that flawlessly reconstructs the image. Leave no stone unturned. You must elaborate on the primary subject, subtle background intricacies, precise spatial geometry, rich atmospheric details, exact color grading codes, high-end photographic or artistic lighting parameters, micro-textures, and emotional resonance. Describe EVERYTHING in long, flowing, highly descriptive paragraphs. This prompt MUST be longer than 1200 characters in length.>"
}

RULES:
- Be precise, not poetic
- No generic phrases like "beautiful image"
- Always include camera + lighting logic
- If UI detected → prioritize layout, spacing, hierarchy
- If photo → prioritize realism, lens, lighting physics
- YOU MUST ANALYZE THE FULL IMAGE. Check the foreground, midground, and deep background.
- If unclear → make best logical inference`;

// ── POST /api/analyze ────────────────────────────────────────────────────────
app.post('/api/analyze', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[Multer Error]', err.message);
      return res.status(500).json({ error: 'File upload failed: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  const t0 = Date.now();

  try {
    // ── Layer 1: Validate input ──────────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    console.log(`[Layer 1 ✓] Received file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    // ── Layer 2: Image processing (Sharp) ────────────────────────────────────
    console.log('[Layer 2]  Processing image with Sharp...');
    const processedBuffer = await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    const base64Image = processedBuffer.toString('base64');
    console.log(`[Layer 2 ✓] Optimized: ${req.file.size} → ${processedBuffer.length} bytes`);

    // ── Layer 3: OpenAI Vision — Antigravity Intelligence Engine ───────────
    console.log('[Layer 3]  Running Antigravity Visual Intelligence Engine (GPT-4o)...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT + '\n\nCRITICAL: Your response must be a single valid JSON object ONLY. No preamble, no explanation, no markdown, no trailing text. Start your response with { and end with }.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Run a deep, comprehensive 4-layer analysis on this ENTIRE image. Scan from foreground to background. Extract every distinct visual detail, subject, and environmental context with unyielding precision. Your output must contain the exact structured intelligence required to generate a flawless, identical 1:1 replica of this image.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
      temperature: 0.2,
    });

    console.log(`[Layer 3 ✓] Intelligence Engine responded`);

    // ── Layer 4: Parse & validate Antigravity Intelligence JSON ─────────────
    const rawContent = completion.choices[0].message.content.trim();
    console.log('[Layer 4]  Raw response preview:', rawContent.slice(0, 200));

    // Multi-strategy JSON extraction: handles markdown fences, leading text, etc.
    let jsonStr = rawContent;

    // Strategy 1: Strip markdown code fences
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    // Strategy 3: Ensure JSON is not truncated — find the last closing brace
    const lastBrace = jsonStr.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < jsonStr.length - 1) {
      jsonStr = jsonStr.slice(0, lastBrace + 1);
    }

    // Strategy 2: If still not starting with {, extract the first {...} block
    if (!jsonStr.startsWith('{')) {
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        jsonStr = match[0];
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[Layer 4 ✗] JSON parse failed. Raw response:\n', rawContent.slice(0, 600));
      return res.status(500).json({ error: 'AI returned malformed JSON. Please try again.' });
    }

    if (!parsed.dalle3_prompt) {
      console.error('[Layer 4 ✗] Missing dalle3_prompt in intelligence output');
      return res.status(500).json({ error: 'Intelligence Engine did not return a prompt. Please try again.' });
    }

    console.log(`[Layer 4 ✓] Intelligence extracted. Design type: ${parsed.design_type}`);

    // ── Layer 5: Return ──────────────────────────────────────────────────────
    const latency = Date.now() - t0;
    console.log(`[Pipeline ✓] Complete in ${latency}ms`);

    return res.status(200).json({
      metadata: {
        originalBytes: req.file.size,
        optimizedBytes: processedBuffer.length,
        latencyMs: latency,
        tokensUsed: completion.usage?.total_tokens || 0,
      },
      intelligence: {
        subject: parsed.subject,
        environment: parsed.environment,
        style: parsed.style,
        design_type: parsed.design_type,
        lighting: parsed.lighting,
        color_palette: parsed.color_palette,
        composition: parsed.composition,
        depth: parsed.depth,
        camera: parsed.camera,
        mood: parsed.mood,
        semantic_tags: parsed.semantic_tags,
        materials_textures: parsed.materials_textures,
        visual_elements: parsed.visual_elements,
        design_analysis: parsed.design_analysis,
        reconstruction_instructions: parsed.reconstruction_instructions,
      },
      prompts: { 'DALL-E 3': parsed.dalle3_prompt },
    });

  } catch (error) {
    console.error('[Pipeline ✗] Fatal error:', error?.message || error);

    // Friendly error messages
    if (error?.status === 401) {
      console.error(`[Layer 3 ✗] 401 Unauthorized: Invalid OpenAI API Key.`);
      return res.status(401).json({ error: `Invalid OpenAI API key. Please check your .env file.` });
    }
    if (error?.status === 403) {
      console.error(`[Layer 3 ✗] 403 Forbidden: Model access or project restriction.`);
      return res.status(403).json({ error: `OpenAI Access Denied (403). Your key may not have access to "gpt-4o".` });
    }
    if (error?.status === 429) return res.status(429).json({ error: 'OpenAI rate limit or quota hit. Please check your billing status.' });
    if (error?.status === 400) return res.status(400).json({ error: `OpenAI error: ${error.message}` });

    return res.status(500).json({ error: 'Pipeline failed: ' + (error?.message || 'Unknown error') });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`\n🚀 Backend API running at http://localhost:${port}`);
  console.log(`   OpenAI key loaded: ${process.env.OPENAI_API_KEY?.slice(0, 12)}...`);
});
