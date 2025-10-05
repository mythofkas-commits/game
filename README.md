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

## Notification Inbox & Public Opinion Battle Setup

**Quick Install (3 Steps)**

````
1) Add CSS
# Copy everything from notification-inbox-styles.css
# Paste at END of assets/styles.css

2) Add JavaScript Classes
// In assets/game.js, BEFORE "class PresidentGame"
// Add NotificationInbox class
// Add PublicOpinionBattleGame class

3) Update Constructor & Methods
// In PresidentGame constructor, add:
this.inbox = new NotificationInbox(this);
this.activeBattles = [];

// Replace showNotification() method
// Replace createPublicOpinionBattle() method
``` :contentReference[oaicite:5]{index=5}
````

**Testing the Features** (verbatim, condensed by sections as given):  
````

Test Notification Inbox

1. Start the game - You should see a gold inbox icon (📫) in the top-right corner
2. Play normally - Notifications will appear and auto-save to inbox
3. Click inbox icon - Slide-out panel should appear from the right
4. Filter notifications - Click filter buttons (All, Info, Success, Warning, Error)
5. View details - Click any notification to see full popup with timestamp
6. Check unread badge - Red badge should show number of unread notifications
7. Refresh page - Notifications should persist (stored in localStorage)

Test Public Opinion Battle Mini-Game

1. Trigger a battle - This happens when opposition politicians respond to your tweets
2. Watch the intro - Animated entrance with purple gradient background
3. Choose responses - 5 rounds of strategic choices
4. Use power-ups - Try Media Spin, Populist Appeal, or Fact Check
5. Watch timer - 2-minute countdown with pulsing animation
6. See results - Victory/defeat screen with effects on power centers
7. Check inbox - Battle results are saved as notifications

``` :contentReference[oaicite:6]{index=6}
````

**Important Notes** (verbatim):  
```

Order Matters: Add classes BEFORE PresidentGame
Constructor: Must initialize inbox in constructor
Methods: Must replace showNotification & createPublicOpinionBattle
CSS: Must add ALL styles (don’t skip any)

``` :contentReference[oaicite:7]{index=7}

**Quick Troubleshooting** (verbatim):  
```

No inbox icon -> Check constructor initialization
Notifications not saving -> Check browser localStorage
Battles not appearing -> Add class & replace createPublicOpinionBattle
Console errors -> Paste CSS, check for conflicts

``` :contentReference[oaicite:8]{index=8}
