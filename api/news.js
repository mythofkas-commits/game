// api/news.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { q, language = 'en', sortBy = 'publishedAt', pageSize = 10 } = req.query;
    const API_KEY = process.env.NEWS_API_KEY;
    
    if (!API_KEY) {
      console.error('NEWS_API_KEY environment variable not set');
      return res.status(200).json({
        articles: [
          {
            title: 'Congress Debates Infrastructure Bill Worth $2 Trillion',
            source: { name: 'Reuters' },
            description: 'Major infrastructure legislation under discussion',
            publishedAt: new Date().toISOString()
          },
          {
            title: 'China Warns Against Taiwan Independence',
            source: { name: 'CNN' },
            description: 'International tensions rising',
            publishedAt: new Date().toISOString()
          }
        ]
      });
    }

    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', q || 'politics');
    url.searchParams.set('language', language);
    url.searchParams.set('sortBy', sortBy);
    url.searchParams.set('pageSize', pageSize.toString());
    url.searchParams.set('apiKey', API_KEY);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'President-Simulator/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.articles) {
      data.articles = data.articles.filter(article => 
        article.title !== '[Removed]' && 
        article.description !== '[Removed]' &&
        article.title && 
        article.source
      );
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('News API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
