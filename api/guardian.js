// api/guardian.js - Vercel serverless function for Guardian API
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
    const { 
      q = 'politics', 
      section = 'politics,us-news,world', 
      pageSize = 15,
      orderBy = 'newest'
    } = req.query;

    const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY;
    
    if (!GUARDIAN_API_KEY) {
      console.error('GUARDIAN_API_KEY environment variable not set');
      return res.status(200).json({
        response: {
          results: [
            // {
            //   webTitle: 'Congress Debates Major Infrastructure Legislation',
            //   sectionName: 'US Politics',
            //   webPublicationDate: new Date().toISOString(),
            //   fields: {
            //     trailText: 'Bipartisan discussions continue on infrastructure funding with key lawmakers meeting to negotiate final details of the comprehensive bill.',
            //     bodyText: 'Congressional leaders are working to finalize a major infrastructure package that could reshape American infrastructure for decades. The legislation includes provisions for roads, bridges, broadband expansion, and clean energy initiatives.'
            //   }
            // }
          ]
        }
      });
    }

    // Build Guardian API URL
    const url = new URL('https://content.guardianapis.com/search');
    url.searchParams.set('q', q);
    url.searchParams.set('section', section);
    url.searchParams.set('page-size', pageSize.toString());
    url.searchParams.set('order-by', orderBy);
    url.searchParams.set('show-fields', 'trailText,thumbnail,bodyText,standfirst');
    url.searchParams.set('api-key', GUARDIAN_API_KEY);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'President-Simulator/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Guardian API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter out any removed/invalid articles
    if (data.response && data.response.results) {
      data.response.results = data.response.results.filter(article => 
        article.webTitle && 
        article.webTitle !== '[Removed]' &&
        article.sectionName
      );
    }

    res.status(200).json(data);

  } catch (error) {
    console.error('Guardian API error:', error);
    
    // Return mock data as fallback (commented out to avoid showing stale stories)
    res.status(200).json({
      response: {
        results: [
          // {
          //   webTitle: 'Political Development in Washington',
          //   sectionName: 'US Politics',
          //   webPublicationDate: new Date().toISOString(),
          //   fields: {
          //     trailText: 'Major political story developing in the capital',
          //     bodyText: 'Detailed coverage of ongoing political developments...'
          //   }
          // }
        ]
      }
    });
  }
}
