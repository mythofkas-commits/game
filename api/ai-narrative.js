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
    if (generationType === 'crisis_options') {
      prompt = `You are creating response options for a political simulation game. The president faces this real news:

"${newsHeadline}"

Player state:
- Chaos: ${playerContext.chaos}/100
- Energy: ${playerContext.energy}/100
- Power centers: ${JSON.stringify(playerContext.relationships)}

Generate 4 DISTINCT, SPECIFIC response options. Each must be:
1. A concrete action (e.g., "Deploy carrier group", "Call NATO summit", "Propose $500B package")
2. NOT vague (no "take measured approach", "be decisive")
3. Meaningfully different from others
4. Start with an emoji

Return ONLY valid JSON:
{
  "options": [
    {
      "text": "🚢 Deploy naval forces to Taiwan Strait",
      "effects": {
        "relationships": [
          { "center": "military", "change": 15 },
          { "center": "wallstreet", "change": -10 }
        ]
      },
      "chaos": 20,
      "energy": 25
    },
    // ... 3 more options
  ]
}

Valid centers: military, congress, intelligence, wallstreet, media, public, industry, science
Vary chaos: -10 to +30, energy: 10 to 30`;
    } else if (generationType === 'scandal') {
      prompt = `Generate satirical scandal based on: "${newsHeadline}". Return ONLY JSON: { "headline": "string", "description": "string", "impacts": { "chaos": number, "energy": number, "relationships": [{ "center": "string", "change": number }] } }`;
    } else if (generationType === 'diplomaticTwist') {
      prompt = `Create diplomatic event for: "${newsHeadline}". Return ONLY JSON: { "event": "string", "options": ["string"], "outcomes": [{ "chaos": number, "energy": number, "relationships": [{ "center": "string", "change": number }] }] }`;
    } else {
      throw new Error('Invalid generation type');
    }

    let response = await openai.chat.completions.create({
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
    if (generationType === 'crisis_options') {
      if (!generated.options || !Array.isArray(generated.options) || generated.options.length < 3) {
        throw new Error('Need at least 3 crisis options');
      }
      for (const opt of generated.options) {
        if (!opt.text || !opt.effects || !opt.effects.relationships) {
          throw new Error('Invalid option structure');
        }
      }
    }

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
      },
      crisis_options: {
        options: [
          {
            text: '🚨 Declare federal emergency response',
            effects: { relationships: [{ center: 'public', change: 12 }] },
            chaos: 8,
            energy: 18
          },
          {
            text: '🤝 Convene bipartisan summit',
            effects: { relationships: [{ center: 'congress', change: 10 }] },
            chaos: -4,
            energy: 16
          },
          {
            text: '🐦 Address nation via social media blitz',
            effects: { relationships: [{ center: 'media', change: -6 }, { center: 'public', change: 9 }] },
            chaos: 14,
            energy: 6
          },
          {
            text: '🎖️ Mobilize military advisors',
            effects: { relationships: [{ center: 'military', change: 11 }] },
            chaos: 16,
            energy: 20
          }
        ]
      }
    };
    res.status(200).json({ success: false, narrative: fallback[generationType] || fallback.scandal });
  }
}