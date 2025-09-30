// Vercel serverless function for RSS feeds
// This handles RSS feed parsing and CORS
export default async function handler(req, res) {
  // Enable CORS
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
    const { feed } = req.query;

    const rssFeeds = {
      'bbc': 'https://feeds.bbci.co.uk/news/world/rss.xml',
      'nyt': 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
      'reuters': 'https://www.reuters.com/rssfeed/politics',
      'cnn': 'http://rss.cnn.com/rss/edition.rss'
    };

    const feedUrl = rssFeeds[feed];
    if (!feedUrl) {
      return res.status(400).json({ error: 'Invalid feed name' });
    }

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'President-Simulator/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Simple XML parsing for RSS items
    const items = [];
    const itemRegex = /<item>(.*?)<\/item>/gs;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/s;
    const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/s;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 10) {
      const itemXml = match[1];
      
      const titleMatch = titleRegex.exec(itemXml);
      const descMatch = descRegex.exec(itemXml);
      const pubDateMatch = pubDateRegex.exec(itemXml);

      if (titleMatch) {
        items.push({
          title: titleMatch[1] || titleMatch[2] || '',
          description: descMatch ? (descMatch[1] || descMatch[2] || '') : '',
          pubDate: pubDateMatch ? pubDateMatch[1] : new Date().toISOString()
        });
      }
    }

    // Extract feed title
    const feedTitleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
    const feedTitleMatch = feedTitleRegex.exec(xmlText);
    const feedTitle = feedTitleMatch ? (feedTitleMatch[1] || feedTitleMatch[2] || feed.toUpperCase()) : feed.toUpperCase();

    res.status(200).json({
      feedTitle,
      items
    });

  } catch (error) {
    console.error('RSS API error:', error);
    
    // Return mock RSS data as fallback
    res.status(200).json({
      feedTitle: 'Mock News Feed',
      items: [
        {
          title: 'Breaking: Political Development in Washington',
          description: 'Major political story developing',
          pubDate: new Date().toISOString()
        },
        {
          title: 'International Relations Update',
          description: 'Diplomatic relations continue to evolve',
          pubDate: new Date().toISOString()
        }
      ]
    });
  }
}