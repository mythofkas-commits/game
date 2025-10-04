// api/cron/fetch-news.js
// Vercel Cron Job - Runs every 2 hours to fetch and cache news

export const config = {
  runtime: 'edge',
};

const NEWS_CACHE_KEY = 'political_news_cache';
const CACHE_TIMESTAMP_KEY = 'news_cache_timestamp';

export default async function handler(req) {
  // Verify this is a cron request
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('[CRON] Starting news fetch...');
    
    const newsData = await fetchPoliticalNews();
    
    if (newsData && newsData.articles && newsData.articles.length > 0) {
      console.log(`[CRON] Fetched ${newsData.articles.length} articles`);
      
      return new Response(JSON.stringify({
        success: true,
        articlesCount: newsData.articles.length,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('No articles fetched');
    }
  } catch (error) {
    console.error('[CRON] News fetch failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function fetchPoliticalNews() {
  const API_KEY = process.env.NEWS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('NEWS_API_KEY not configured');
  }

  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', '(politics OR congress OR president OR senate OR china OR russia OR economy OR scandal OR military OR healthcare)');
  url.searchParams.set('language', 'en');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', '20');
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

  return data;
}
