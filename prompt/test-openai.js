import 'dotenv/config';
import OpenAI from 'openai';

const key = process.env.OPENAI_API_KEY;
console.log('Testing OpenAI Key:', key.slice(0, 12) + '...' + key.slice(-4));

const openai = new OpenAI({ apiKey: key });

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: 'Say hello' }
      ]
    });
    console.log('Success:', response.choices[0].message.content);
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

test();
