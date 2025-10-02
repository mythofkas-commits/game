# Chaos Potus — A News-Driven Political Strategy Game

A real-time political simulation game with live news integration, relationship management, and crisis decision-making.

![President Simulator Screenshot](https://github.com/user-attachments/assets/d12b3715-e9b6-4204-8acc-34b1fdf2f1cc)

## Features

- **Real-time News Integration**: Fetches live political news via NewsAPI and RSS feeds
- **Dynamic Crisis Generation**: News events trigger contextual political crises
- **Relationship Management**: Track trust, respect, and fear with key political figures
- **Tweet Storm System**: Send tweets that affect chaos levels and relationships
- **Phone Negotiations**: Interactive diplomatic calls with leverage options
- **Press Conferences**: Handle hostile and friendly reporters
- **Scandal Management**: Contain spreading scandals through strategic damage control

## Deployment

### Local Development

1. Clone the repository
2. Copy `.env.example` to `.env.local` and add your NewsAPI key
3. Run a local server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open http://localhost:8000

## API Endpoints

- `/api/news.js`: Secure NewsAPI proxy with CORS handling
- `/api/rss.js`: RSS feed parser for backup news sources

## Security Features

- API keys are protected server-side in Vercel functions
- CORS properly configured for cross-origin requests
- Graceful fallback to mock data when APIs are unavailable
- Input sanitization for user-generated content

## Game Mechanics

- **Energy**: Decreases with actions, affects available options
- **Chaos**: Increases with controversial decisions, affects game difficulty  
- **Score**: Points earned through successful political maneuvering
- **Relationships**: Dynamic trust/respect/fear system affects negotiation outcomes

## Technologies

- Vanilla JavaScript (ES6+)
- CSS3 with animations and responsive design
- Vercel Serverless Functions for API security
- NewsAPI and RSS feeds for real-time data
