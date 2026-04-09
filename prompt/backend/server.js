import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// ── Persistence Layer ────────────────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { components: [] };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('[DB] Error reading data:', err);
    return { components: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[DB] Error writing data:', err);
  }
}

// ── API Clients ─────────────────────────────────────────────────────────────
const anthropicKey = (process.env.ANTHROPIC_API_KEY || '').trim();
if (!anthropicKey) {
  console.error('[FATAL] ANTHROPIC_API_KEY is missing.');
  process.exit(1);
}

// Security-safe diagnostic logging
console.log(`[AUTH] Anthropic Key Loaded | Length: ${anthropicKey.length} | Format: ${anthropicKey.slice(0, 12)}...${anthropicKey.slice(-4)}`);

const anthropic = new Anthropic({ apiKey: anthropicKey });

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── COMPONENT CRUD ───────────────────────────────────────────────────────────
app.get('/api/components', (req, res) => {
  const data = readData();
  res.json(data.components);
});

app.post('/api/components', (req, res) => {
  const { name, count } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const data = readData();
  const newComponent = {
    id: Date.now().toString(),
    name,
    count: count || 0,
    subsections: []
  };
  data.components.push(newComponent);
  writeData(data);
  res.json(newComponent);
});

app.put('/api/components/:id', (req, res) => {
  const { id } = req.params;
  const { name, count } = req.body;
  const data = readData();
  const index = data.components.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Component not found' });

  const oldName = data.components[index].name;
  const newName = name || oldName;

  data.components[index] = { 
    ...data.components[index], 
    name: newName, 
    count: count !== undefined ? count : data.components[index].count 
  };

  // Propagate name change to subsections
  if (newName !== oldName) {
    data.components[index].subsections.forEach(s => {
      s.category = newName;
    });
  }

  writeData(data);
  res.json(data.components[index]);
});

app.delete('/api/components/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  data.components = data.components.filter(c => c.id !== id);
  writeData(data);
  res.json({ success: true });
});

// ── SUBSECTION CRUD ──────────────────────────────────────────────────────────
app.get('/api/components/:id/subsections', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const comp = data.components.find(c => c.id === id);
  if (!comp) return res.status(404).json({ error: 'Component not found' });
  res.json(comp.subsections);
});

app.get('/api/subsections/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  for (let comp of data.components) {
    const section = comp.subsections.find(s => s.id === id);
    if (section) return res.json(section);
  }
  res.status(404).json({ error: 'Subsection not found' });
});

app.post('/api/components/:id/subsections', (req, res) => {
  const { id } = req.params;
  const { title, desc, prompt, code, image } = req.body;
  const data = readData();
  const index = data.components.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Component not found' });

  const newSection = {
    id: Date.now().toString(),
    title,
    desc,
    prompt: prompt || '',
    code: code || '',
    image: image || '',
    category: data.components[index].name
  };
  data.components[index].subsections.push(newSection);
  data.components[index].count = data.components[index].subsections.length;
  writeData(data);
  res.json(newSection);
});

app.put('/api/subsections/:id', (req, res) => {
  const { id } = req.params;
  const { title, desc, prompt, code, image } = req.body;
  const data = readData();
  let updated = null;

  for (let comp of data.components) {
    const sIndex = comp.subsections.findIndex(s => s.id === id);
    if (sIndex !== -1) {
      comp.subsections[sIndex] = { 
        ...comp.subsections[sIndex], 
        title: title !== undefined ? title : comp.subsections[sIndex].title,
        desc: desc !== undefined ? desc : comp.subsections[sIndex].desc,
        prompt: prompt !== undefined ? prompt : comp.subsections[sIndex].prompt,
        code: code !== undefined ? code : comp.subsections[sIndex].code,
        image: image !== undefined ? image : comp.subsections[sIndex].image
      };
      updated = comp.subsections[sIndex];
      break;
    }
  }

  if (!updated) return res.status(404).json({ error: 'Subsection not found' });
  writeData(data);
  res.json(updated);
});

app.delete('/api/subsections/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  let deleted = false;

  for (let comp of data.components) {
    const sIndex = comp.subsections.findIndex(s => s.id === id);
    if (sIndex !== -1) {
      comp.subsections.splice(sIndex, 1);
      comp.count = comp.subsections.length;
      deleted = true;
      break;
    }
  }

  if (!deleted) return res.status(404).json({ error: 'Subsection not found' });
  writeData(data);
  res.json({ success: true });
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

  "dalle3_prompt": "<A massive, extensively detailed, and fully described DALL-E 3 master prompt that flawlessly reconstructs the image. Leave no stone unturned. You must elaborate on the primary subject, subtle background intricacies, precise spatial geometry, rich atmospheric details, exact color grading codes, high-end photographic or artistic lighting parameters, micro-textures, and emotional resonance. Describe EVERYTHING in long, flowing, highly descriptive paragraphs. This prompt MUST be longer than 1200 characters in length. Format as a single continuous string. DO NOT use literal newlines, use \\n for line breaks.>"
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

    // ── Layer 3: Visual Intelligence Engine (Anthropic) ───────────
    console.log('[Layer 3]  Running Antigravity Visual Intelligence Engine (Claude 4.6 Sonnet)...');

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      temperature: 0.2,
      system: SYSTEM_PROMPT + '\n\nCRITICAL: Your response must be a single valid JSON object ONLY. No preamble, no explanation, no markdown, no trailing text. Start your response with { and end with }.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Run a deep, comprehensive 4-layer analysis on this ENTIRE image. Scan from foreground to background. Extract every distinct visual detail, subject, and environmental context with unyielding precision. Your output must contain the exact structured intelligence required to generate a flawless, identical 1:1 replica of this image.'
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              }
            }
          ]
        }
      ]
    });

    console.log(`[Layer 3 ✓] Intelligence Engine responded via Anthropic`);
    const rawContent = completion.content[0].text.trim();
    const tokensUsed = (completion.usage?.input_tokens || 0) + (completion.usage?.output_tokens || 0);

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
        tokensUsed: tokensUsed,
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
      return res.status(401).json({ error: `Invalid API key. Please check your .env file.` });
    }
    if (error?.status === 403) {
      return res.status(403).json({ error: `Access Denied (403). Your key may not have access.` });
    }
    if (error?.status === 429) return res.status(429).json({ error: 'Rate limit or quota hit. Please check your billing status.' });
    if (error?.status >= 400 && error?.status < 500) return res.status(error.status).json({ error: `API error: ${error.message}` });

    return res.status(500).json({ error: 'Pipeline failed: ' + (error?.message || 'Unknown error') });
  }
});

app.listen(port, () => console.log(`🚀 Backend running at http://localhost:${port}`));
