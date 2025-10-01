// /api/ai-narrative.js
import OpenAI from 'openai';

export default async function handler(req, res) {
  // Enable CORS, matching news.js
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { playerContext, newsHeadline, generationType } = req.body;

    if (!playerContext || !newsHeadline || !generationType) {
      throw new Error('Missing required parameters');
    }

    // Craft prompt based on generation type
    let prompt = '';
    if (generationType === 'scandal') {
      prompt = `Generate a satirical political scandal for a US President simulator game. Base it on this real-world news headline: "${newsHeadline}". Incorporate the player's history: ${JSON.stringify(playerContext.history)}. Affect relationships with ${playerContext.relationships.map(r => r.name).join(', ')} (e.g., adjust trust, respect, fear). Return ONLY valid JSON: { "headline": "string", "description": "string", "impacts": { "chaos": number, "energy": number, "score": number, "relationships": [{ "name": "string", "trust": number, "respect": number, "fear": number }] } }`;
    } else if (generationType === 'diplomaticTwist') {
      prompt = `Create a diplomatic event for a US President simulator based on news: "${newsHeadline}". Use player decisions: ${JSON.stringify(playerContext.decisions)}. Make it engaging and unpredictable. Return ONLY valid JSON: { "event": "string", "options": ["string"], "outcomes": [{ "chaos": number, "energy": number, "score": number, "relationships": [{ "name": "string", "trust": number, "respect": number, "fear": number }] }] }`;
    } else {
      throw new Error('Invalid generation type');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-efficient, ~$0.15/1M input tokens
      messages: [
        { role: 'system', content: 'You are a creative, satirical political narrative generator for a game. Always return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.8,
    });

    // Parse JSON response with retry for hallucinations
    let generated;
    let retries = 3;
    while (retries > 0) {
      try {
        generated = JSON.parse(response.choices[0].message.content.trim());
        break;
      } catch (parseError) {
        retries--;
        if (retries === 0) throw new Error('Invalid JSON after retries');
        // Fallback prompt for retry
        const fallbackPrompt = `Return valid JSON for the previous request: ${prompt}`;
        const retryResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: fallbackPrompt }],
          max_tokens: 300,
        });
        response = retryResponse;
      }
    }

    // Validate required fields
    if (generationType === 'scandal' && (!generated.headline || !generated.description || !generated.impacts)) {
      throw new Error('Incomplete scandal response');
    }
    if (generationType === 'diplomaticTwist' && (!generated.event || !generated.options || !generated.outcomes)) {
      throw new Error('Incomplete diplomatic twist response');
    }

    res.status(200).json({ success: true, narrative: generated });
  } catch (error) {
    console.error('AI Narrative Error:', error);
    // Fallback mock data
    const fallback = {
      scandal: {
        headline: 'Generic Scandal Erupts!',
        description: 'A vague controversy from nowhere!',
        impacts: { chaos: 10, energy: -5, score: -20, relationships: [] }
      },
      diplomaticTwist: {
        event: 'Diplomatic Misstep!',
        options: ['Apologize', 'Double Down'],
        outcomes: [{ chaos: 15, energy: -10, score: -10, relationships: [] }]
      }
    };
    res.status(200).json({ success: false, narrative: fallback[generationType] || fallback.scandal });
  }
}