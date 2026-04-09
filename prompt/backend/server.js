import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
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

// ── OpenAI client ─────────────────────────────────────────────────────────────
const rawKey = (process.env.OPENAI_API_KEY || '').trim();
const openai = rawKey ? new OpenAI({ apiKey: rawKey }) : null;

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

  data.components[index] = { ...data.components[index], name: name || data.components[index].name, count: count !== undefined ? count : data.components[index].count };
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

// ── AI ANALYZE ENDPOINT (Existing Functionality) ─────────────────────────────
const SYSTEM_PROMPT = `You are an elite Visual Intelligence Engine and a 10-year experienced AI Prompt Generator. Return ONLY valid JSON for DALL-E 3 reconstruction.`;

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  if (!openai) return res.status(500).json({ error: 'OpenAI client not initialized' });
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  try {
    const processedBuffer = await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'inside' })
      .jpeg({ quality: 90 })
      .toBuffer();

    const base64Image = processedBuffer.toString('base64');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: [{ type: 'text', text: 'Analyze this image for DALL-E 3 reconstruction.' }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }] }
      ],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    res.json({
      intelligence: parsed,
      prompts: { 'DALL-E 3': parsed.dalle3_prompt || 'Prompt generation failed' }
    });
  } catch (error) {
    res.status(500).json({ error: 'Pipeline failed: ' + error.message });
  }
});

app.listen(port, () => console.log(`🚀 Backend running at http://localhost:${port}`));
