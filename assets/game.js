/*
=============================================================================
PRESIDENT SIMULATOR - TOTAL CHAOS EDITION
With Real Live News Integration
=============================================================================
*/

let game = null;
window.game = null;

function startPresidency() {
    document.getElementById('introScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    game = new PresidentGame();
    window.game = game;
    game.init();
}

class PresidentGame {
    constructor() {
        this.day = 1;
        this.energy = 100;
        this.chaos = 0;
        this.score = 0;

        // NEWS_API_KEY removed from client-side code for security.
        // News data should be fetched from a secure backend endpoint.

        this.currentNewsStories = [];
        this.processedNewsEvents = [];
        this.newsRelevanceThreshold = 0.5;

        this.history = {
            tweets: [],
            decisions: [],
            phoneCalls: [],
            pressConferences: [],
            scandals: [],
            newsResponses: []
        };

        this.currentContext = {
            recentEvents: [],
            activeNarratives: [],
            publicMood: 'neutral',
            economicState: 'stable',
            internationalTension: 'low'
        };

        this.relationships = [
            {
                name: 'Chuck Schumer',
                trust: 30,
                respect: 40,
                fear: 20,
                role: 'Senate Leader',
                personality: 'strategic',
                lastInteraction: null,
                history: [],
                currentIssues: ['budget', 'healthcare']
            },
            {
                name: 'Mitch McConnell',
                trust: 60,
                respect: 50,
                fear: 10,
                role: 'Senate GOP',
                personality: 'calculating',
                lastInteraction: null,
                history: [],
                currentIssues: ['taxes', 'judges']
            },
            {
                name: 'Nancy Pelosi',
                trust: 20,
                respect: 30,
                fear: 30,
                role: 'House Speaker',
                personality: 'aggressive',
                lastInteraction: null,
                history: [],
                currentIssues: ['impeachment', 'oversight']
            },
            {
                name: 'Vladimir Putin',
                trust: 50,
                respect: 60,
                fear: 40,
                role: 'Russian President',
                personality: 'ruthless',
                lastInteraction: null,
                history: [],
                currentIssues: ['sanctions', 'ukraine', 'syria']
            },
            {
                name: 'Xi Jinping',
                trust: 40,
                respect: 55,
                fear: 35,
                role: 'Chinese President',
                personality: 'patient',
                lastInteraction: null,
                history: [],
                currentIssues: ['trade', 'taiwan', 'technology']
            },
            {
                name: 'Rishi Sunak',
                trust: 65,
                respect: 50,
                fear: 10,
                role: 'UK PM',
                personality: 'pragmatic',
                lastInteraction: null,
                history: [],
                currentIssues: ['inflation', 'cost of living', 'ukraine', 'trade']
            }
        ];

        this.crisisTemplates = {
            domestic: ['budget', 'scandal', 'protest', 'shooting', 'natural disaster'],
            international: ['trade war', 'military conflict', 'diplomatic incident', 'terrorism'],
            economic: ['market crash', 'unemployment', 'inflation', 'bank failure'],
            political: ['impeachment', 'election', 'supreme court', 'congress revolt']
        };

        this.reporters = [
            { name: 'Jim Acosta', outlet: 'CNN', mood: 'hostile', trust: 20, specialty: 'scandal' },
            { name: 'Peter Doocy', outlet: 'Fox News', mood: 'friendly', trust: 80, specialty: 'economy' },
            { name: 'Yamiche Alcindor', outlet: 'PBS', mood: 'neutral', trust: 50, specialty: 'policy' },
            { name: 'April Ryan', outlet: 'The Grio', mood: 'hostile', trust: 30, specialty: 'social' }
        ];

        this.currentReporter = null;
        this.currentQuestion = '';
        this.currentCrisis = null;
        this.scandalActive = false;
        this.scandalInterval = null;
        this.currentCaller = null;
        this.gameInterval = null;
        this.newsInterval = null;
    }

    async init() {
        this.updateDisplay();
        this.displayRelationships();
        await this.loadInitialNews();
        this.setupReporters();

        this.gameInterval = setInterval(() => this.gameLoop(), 5000);
        this.newsInterval = setInterval(() => this.fetchRealPoliticalNews(), 120000); // Every 2 minutes
    }

    async loadInitialNews() {
        const ticker = document.getElementById('newsTickerContent');
        ticker.innerHTML = '<span class="news-item">Loading real political news...</span>';
        
        await this.fetchRealPoliticalNews();
    }

    async fetchRealPoliticalNews() {
        try {
            // Fetch from your own backend API endpoint to avoid CORS and protect the API key
            const response = await fetch(
                '/api/news?q=(politics OR congress OR president OR senate OR china OR russia OR economy OR "federal reserve" OR scandal OR impeachment OR election)&' +
                'language=en&' +
                'sortBy=publishedAt&' +
                'pageSize=10'
            );

            if (!response.ok) {
                throw new Error('NewsAPI failed, trying RSS backup');
            }

            const data = await response.json();
            
            if (!data.articles || data.articles.length === 0) {
                throw new Error('No articles found');
            }

            const newsStories = data.articles.map(article => {
                return {
                    headline: article.title,
                    source: article.source.name,
                    relevance: this.calculateRelevance(article.title, article.description),
                    category: this.categorizeNews(article.title, article.description),
                    actors: this.extractActors(article.title, article.description),
                    timestamp: new Date(article.publishedAt).getTime()
                };
            });

            this.currentNewsStories = newsStories.filter(s => s.relevance >= this.newsRelevanceThreshold);
            this.displayNewsTicker();

            const topStory = newsStories.find(s => s.relevance > 0.75);
            if (topStory && !this.currentCrisis) {
                setTimeout(() => this.generateNewsBasedCrisis(topStory), 3000);
            }

            console.log('✓ Fetched real news:', newsStories.length, 'stories from NewsAPI');
            
        } catch (error) {
            console.error('NewsAPI failed, trying RSS backup:', error);
            await this.fetchRSSNews();
        }
    }

    async fetchRSSNews() {
        try {
            const rssFeeds = [
                'https://feeds.bbci.co.uk/news/politics/rss.xml',
                'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml'
            ];

            const randomFeed = rssFeeds[Math.floor(Math.random() * rssFeeds.length)];
            
            const response = await fetch(randomFeed);

            if (!response.ok) {
                throw new Error('RSS backup failed');
            }

            const rssText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(rssText, "application/xml");

            // Try to get feed title
            let feedTitle = "RSS Feed";
            const channel = xmlDoc.querySelector("channel");
            if (channel && channel.querySelector("title")) {
                feedTitle = channel.querySelector("title").textContent;
            }

            const items = Array.from(xmlDoc.querySelectorAll("item"));
            if (!items || items.length === 0) {
                throw new Error('No RSS items found');
            }

            const newsStories = items.map(item => {
                const title = item.querySelector("title") ? item.querySelector("title").textContent : "";
                const description = item.querySelector("description") ? item.querySelector("description").textContent : "";
                const pubDate = item.querySelector("pubDate") ? item.querySelector("pubDate").textContent : "";
                return {
                    headline: title,
                    source: feedTitle,
                    relevance: this.calculateRelevance(title, description),
                    category: this.categorizeNews(title, description),
                    actors: this.extractActors(title, description),
                    timestamp: pubDate ? new Date(pubDate).getTime() : Date.now()
                };
            });

            this.currentNewsStories = newsStories.filter(s => s.relevance >= this.newsRelevanceThreshold);
            this.displayNewsTicker();

            const topStory = newsStories.find(s => s.relevance > 0.75);
            if (topStory && !this.currentCrisis) {
                setTimeout(() => this.generateNewsBasedCrisis(topStory), 3000);
            }

            console.log('✓ Fetched RSS news:', newsStories.length, 'stories');
            
        } catch (error) {
            console.error('All news sources failed, using mock news:', error);
            this.loadMockNews();
        }
    }

    calculateRelevance(title, description) {
        const text = (title + ' ' + (description || '')).toLowerCase();
        let score = 0.5;

        const highKeywords = ['president', 'congress', 'senate', 'white house', 'impeach', 'scandal', 'crisis', 'trump', 'biden'];
        highKeywords.forEach(keyword => {
            if (text.includes(keyword)) score += 0.1;
        });

        const medKeywords = ['election', 'bill', 'vote', 'policy', 'federal', 'democrat', 'republican', 'nato', 'china', 'russia'];
        medKeywords.forEach(keyword => {
            if (text.includes(keyword)) score += 0.05;
        });

        return Math.min(1, score);
    }

    categorizeNews(title, description) {
        const text = (title + ' ' + (description || '')).toLowerCase();

        if (text.match(/china|russia|ukraine|nato|foreign|international|diplomat|putin|xi/)) {
            return 'foreign';
        }
        if (text.match(/scandal|investigation|corruption|resign|indict|probe|allegation/)) {
            return 'scandal';
        }
        if (text.match(/market|economy|inflation|fed|unemployment|gdp|stock|trade|tariff/)) {
            return 'economy';
        }
        return 'domestic';
    }

    extractActors(title, description) {
        const text = (title + ' ' + (description || '')).toLowerCase();
        const actors = [];

        const figures = {
            'biden': 'Joe Biden',
            'trump': 'Donald Trump',
            'harris': 'Kamala Harris',
            'mcconnell': 'Mitch McConnell',
            'schumer': 'Chuck Schumer',
            'pelosi': 'Nancy Pelosi',
            'putin': 'Vladimir Putin',
            'xi jinping': 'Xi Jinping',
            'xi': 'Xi Jinping',
            'johnson': 'Boris Johnson',
            'macron': 'Emmanuel Macron'
        };

        Object.entries(figures).forEach(([search, proper]) => {
            if (text.includes(search) && !actors.includes(proper)) {
                actors.push(proper);
            }
        });

        if (actors.length === 0) {
            if (text.includes('congress')) actors.push('Congress');
            if (text.includes('senate')) actors.push('Senate');
            if (text.includes('house')) actors.push('House');
        }

        return actors;
    }

    loadMockNews() {
        const mockNews = [
            {
                headline: 'Congress Debates Infrastructure Bill Worth $2 Trillion',
                source: 'Reuters',
                relevance: 0.9,
                category: 'domestic',
                actors: ['Congress', 'Chuck Schumer', 'Mitch McConnell'],
                timestamp: Date.now()
            },
            {
                headline: 'China Warns Against Taiwan Independence',
                source: 'CNN',
                relevance: 0.8,
                category: 'foreign',
                actors: ['Xi Jinping', 'Taiwan'],
                timestamp: Date.now()
            },
            {
                headline: 'Fed Considers Interest Rate Hike Amid Inflation Concerns',
                source: 'Bloomberg',
                relevance: 0.7,
                category: 'economy',
                actors: ['Federal Reserve'],
                timestamp: Date.now()
            },
            {
                headline: 'Putin Calls for New Security Talks with NATO',
                source: 'BBC',
                relevance: 0.85,
                category: 'foreign',
                actors: ['Vladimir Putin', 'NATO'],
                timestamp: Date.now()
            },
            {
                headline: 'Supreme Court to Review Controversial Voting Rights Case',
                source: 'NPR',
                relevance: 0.75,
                category: 'domestic',
                actors: ['Supreme Court'],
                timestamp: Date.now()
            }
        ];

        this.currentNewsStories = mockNews;
        this.displayNewsTicker();

        const topStory = this.getTopRelevantNews();
        if (topStory) {
            setTimeout(() => this.generateNewsBasedCrisis(topStory), 3000);
        }

        console.log('✓ Using mock news (fallback)');
    }

    getTopRelevantNews() {
        return this.currentNewsStories.sort((a, b) => b.relevance - a.relevance)[0];
    }

    displayNewsTicker() {
        const ticker = document.getElementById('newsTickerContent');
        ticker.innerHTML = '';

        this.currentNewsStories.forEach(story => {
            const item = document.createElement('span');
            item.className = 'news-item';
            item.setAttribute('role', 'listitem');
            item.tabIndex = 0;
            item.textContent = `[${story.source}] ${story.headline}`;
            item.onclick = () => this.respondToNews(story);
            item.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.respondToNews(story);
                }
            });
            ticker.appendChild(item);
        });
    }

    triggerBreakingNews(story) {
        const existing = document.querySelector('.breaking-news-alert');
        if (existing) existing.remove();

        const alert = document.createElement('div');
        alert.className = 'breaking-news-alert active';
        alert.innerHTML = `
            <div class="news-source">BREAKING NEWS - ${story.source}</div>
            <h2 style="color: #fff; margin-bottom: 20px;">${story.headline}</h2>
            <p style="color: #ddd; margin-bottom: 20px;">This requires your immediate attention!</p>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <button class="decision-btn" data-action="dismiss">Dismiss</button>
                <button class="decision-btn" data-action="tweet">Tweet Response</button>
                <button class="decision-btn" data-action="call">Emergency Call</button>
                <button class="decision-btn" data-action="crisis">Crisis Mode</button>
            </div>
        `;

        alert.querySelectorAll('.decision-btn[data-action]').forEach(button => {
            const action = button.dataset.action;
            button.addEventListener('click', () => this.quickNewsResponse(action, story.headline));
        });
        document.body.appendChild(alert);

        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
                this.chaos += 5;
                this.showNotification('Ignored breaking news - chaos increases!');
                this.updateDisplay();
            }
        }, 10000);
    }

    quickNewsResponse(action, headline) {
        const alert = document.querySelector('.breaking-news-alert');
        if (alert) alert.remove();

        const story = this.currentNewsStories.find(s => s.headline === headline);
        if (!story) return;

        this.history.newsResponses.push({
            story,
            action,
            timestamp: Date.now()
        });

        switch (action) {
            case 'dismiss':
                this.chaos += 10;
                this.showNotification('Media criticizes your silence!');
                break;
            case 'tweet':
                document.getElementById('tweetInput').value = `Regarding ${story.headline.substring(0, 50)}...`;
                document.getElementById('tweetInput').focus();
                break;
            case 'call':
                this.callRelevantActor(story);
                break;
            case 'crisis':
                this.generateNewsBasedCrisis(story);
                break;
        }

        this.updateDisplay();
    }

    callRelevantActor(story) {
        const relevantActor = this.relationships.find(r =>
            story.actors.some(actor => r.name.includes(actor) || actor.includes(r.name.split(' ').pop()))
        );

        if (relevantActor) {
            this.initiatePhoneCall(relevantActor);
        } else {
            this.showNotification('No direct contact available.');
        }
    }

    respondToNews(story) {
        if (this.processedNewsEvents.includes(story.headline)) return;

        this.processedNewsEvents.push(story.headline);
        this.generateNewsBasedCrisis(story);
        this.showNotification(`Responding to: ${story.headline.substring(0, 60)}...`);
    }

    generateNewsBasedCrisis(story) {
        const crisis = {
            type: story.category,
            category: story.category,
            title: `URGENT: ${story.headline}`,
            description: `${story.source} reports this developing situation. Your response will shape public opinion.`,
            newsSource: story.source,
            options: this.generateNewsContextualOptions(story)
        };

        this.currentCrisis = crisis;
        this.displayCrisis();

        story.actors.forEach(actor => {
            const rel = this.relationships.find(r =>
                r.name.includes(actor) || actor.includes(r.name.split(' ').pop())
            );
            if (rel && !rel.currentIssues.includes(story.category)) {
                rel.currentIssues.push(story.category);
            }
        });
    }

    generateNewsContextualOptions(story) {
        const options = [];

        options.push({
            text: `Support the ${story.category === 'foreign' ? 'diplomatic' : 'legislative'} process`,
            effect: 'diplomatic',
            impacts: story.actors
        });

        options.push({
            text: 'Blame the opposition',
            effect: 'aggressive',
            impacts: []
        });

        if (story.category === 'economy') {
            options.push({
                text: 'Emergency economic measures',
                effect: 'strategic',
                impacts: []
            });
        }

        if (story.category === 'foreign') {
            options.push({
                text: 'Military posturing',
                effect: 'aggressive',
                impacts: story.actors
            });
        }

        if (story.category === 'scandal') {
            options.push({
                text: 'Launch counter-investigation',
                effect: 'chaotic',
                impacts: []
            });
        }

        options.push({
            text: 'Twitter storm about fake news',
            effect: 'chaotic',
            impacts: []
        });

        return options;
    }

    randomFrom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    gameLoop() {
        this.day += 1;
        this.updateGameContext();

        this.chaos += this.currentContext.publicMood === 'angry' ? 2 : 1;
        this.energy = Math.max(0, this.energy - 2);
        this.score += 10;

        this.updateDisplay();

        if (Math.random() < 0.15) {
            this.triggerContextualEvent();
        }

        if (Math.random() < 0.2) {
            this.evolveRelationships();
        }
    }

    updateGameContext() {
        const recentChaos = this.history.decisions
            .slice(-3)
            .reduce((sum, d) => sum + (d.chaosChange || 0), 0);

        if (recentChaos > 30) {
            this.currentContext.publicMood = 'angry';
        } else if (recentChaos < -10) {
            this.currentContext.publicMood = 'happy';
        } else {
            this.currentContext.publicMood = 'neutral';
        }

        if (this.chaos > 70) {
            this.currentContext.economicState = 'crisis';
        } else if (this.chaos > 40) {
            this.currentContext.economicState = 'unstable';
        } else {
            this.currentContext.economicState = 'stable';
        }

        const foreignRelations = this.relationships.filter(r =>
            ['Vladimir Putin', 'Xi Jinping', 'Boris Johnson'].includes(r.name)
        );
        const avgTrust = foreignRelations.reduce((sum, r) => sum + r.trust, 0) / foreignRelations.length;

        if (avgTrust < 30) {
            this.currentContext.internationalTension = 'high';
        } else if (avgTrust < 50) {
            this.currentContext.internationalTension = 'medium';
        } else {
            this.currentContext.internationalTension = 'low';
        }
    }

    generateContextualCrisis() {
        const recentCrises = this.history.decisions.slice(-5).map(d => d.crisisType);

        let crisisCategory;

        if (this.currentContext.internationalTension === 'high') {
            crisisCategory = 'international';
        } else if (this.currentContext.economicState === 'crisis') {
            crisisCategory = 'economic';
        } else if (this.currentContext.publicMood === 'angry') {
            crisisCategory = 'domestic';
        } else {
            const categories = ['domestic', 'international', 'economic', 'political'];
            crisisCategory = categories[Math.floor(Math.random() * categories.length)];
        }

        const availableTypes = this.crisisTemplates[crisisCategory].filter(t => !recentCrises.includes(t));
        const crisisType = availableTypes[Math.floor(Math.random() * availableTypes.length)] || 'general';

        this.currentCrisis = this.generateCrisisDetails(crisisType, crisisCategory);
        this.displayCrisis();
    }

    generateCrisisDetails(type, category) {
        return {
            type,
            category,
            title: this.generateCrisisTitle(type),
            description: this.generateCrisisDescription(type),
            options: this.generateCrisisOptions(type, category)
        };
    }

    generateCrisisTitle(type) {
        const titles = {
            budget: 'GOVERNMENT SHUTDOWN IMMINENT',
            scandal: 'BREAKING SCANDAL',
            protest: 'MASSIVE PROTESTS ERUPTING',
            'trade war': 'TRADE WAR ESCALATING',
            'military conflict': 'MILITARY CRISIS',
            'market crash': 'MARKETS IN FREEFALL',
            impeachment: 'IMPEACHMENT THREAT'
        };
        return titles[type] || 'CRISIS EMERGING';
    }

    generateCrisisDescription(type) {
        const descriptions = {
            budget: `Congress deadlocked over spending. ${this.currentContext.economicState === 'crisis' ? 'Economic crisis worsening the situation.' : 'Time is running out.'}`,
            scandal: `${this.history.scandals.length > 2 ? 'Another scandal rocks your administration' : 'Major allegations surfacing'}`,
            protest: `Citizens taking to the streets. ${this.currentContext.publicMood === 'angry' ? 'Public fury reaching boiling point!' : 'Tensions rising.'}`,
            'trade war': `${this.currentContext.internationalTension === 'high' ? 'International tensions exploding' : 'Trade disputes escalating'}`,
            'military conflict': 'Military situation deteriorating rapidly',
            'market crash': `Stock market plummeting. ${this.currentContext.economicState === 'crisis' ? 'Economic disaster unfolding!' : 'Investors panicking.'}`,
            impeachment: 'Congress moving toward impeachment proceedings'
        };
        return descriptions[type] || 'Situation requires immediate attention.';
    }

    generateCrisisOptions(type) {
        const options = [];

        options.push({
            text: this.generateAggressiveOption(type),
            effect: 'aggressive',
            impacts: this.determineImpactedParties(type, 'aggressive')
        });

        if (this.getAverageRelationshipHealth() > 30) {
            options.push({
                text: this.generateDiplomaticOption(type),
                effect: 'diplomatic',
                impacts: this.determineImpactedParties(type, 'diplomatic')
            });
        }

        if (this.energy > 30) {
            options.push({
                text: this.generateStrategicOption(type),
                effect: 'strategic',
                impacts: []
            });
        }

        if (this.chaos > 50 || this.currentContext.publicMood === 'angry') {
            options.push({
                text: 'Double down on chaos',
                effect: 'chaotic',
                impacts: []
            });
        }

        return options;
    }

    generateAggressiveOption(type) {
        const options = {
            budget: 'Threaten to shut down government',
            scandal: 'Attack accusers viciously',
            protest: 'Deploy federal forces',
            'trade war': 'Impose massive tariffs',
            'military conflict': 'Military strike',
            'market crash': 'Blame the Fed',
            impeachment: 'Threaten Congress'
        };
        return options[type] || 'Attack everyone';
    }

    generateDiplomaticOption(type) {
        const options = {
            budget: 'Negotiate compromise',
            scandal: 'Address nation calmly',
            protest: 'Meet with protest leaders',
            'trade war': 'Seek diplomatic solution',
            'military conflict': 'Emergency diplomacy',
            'market crash': 'Reassure markets',
            impeachment: 'Cooperate with investigation'
        };
        return options[type] || 'Seek peaceful solution';
    }

    generateStrategicOption(type) {
        const options = {
            budget: 'Executive order workaround',
            scandal: 'Strategic distraction',
            protest: 'Announce reforms',
            'trade war': 'Multilateral approach',
            'military conflict': 'Covert operations',
            'market crash': 'Emergency measures',
            impeachment: 'Legal maneuvering'
        };
        return options[type] || 'Complex strategic move';
    }

    determineImpactedParties(type, approach) {
        const impacted = [];

        if (type === 'budget' && approach === 'aggressive') {
            impacted.push('Chuck Schumer', 'Nancy Pelosi');
        } else if (type === 'trade war') {
            impacted.push('Xi Jinping');
        } else if (type === 'military conflict') {
            impacted.push('Vladimir Putin');
        }

        return impacted;
    }

    getAverageRelationshipHealth() {
        const total = this.relationships.reduce((sum, r) => sum + r.trust + r.respect, 0);
        return total / (this.relationships.length * 2);
    }

    initiatePhoneCall(caller) {
        if (caller.lastInteraction && Date.now() - caller.lastInteraction < 30000) {
            this.showNotification(`${caller.name} is not available right now`);
            return;
        }

        this.currentCaller = caller;
        caller.lastInteraction = Date.now();

        const demand = this.generateContextualDemand(caller);
        caller.currentDemand = demand;

        this.history.phoneCalls.push({
            caller: caller.name,
            demand,
            timestamp: Date.now()
        });

        document.getElementById('phoneInterface').classList.add('active');
        document.getElementById('overlay').classList.add('active');
        document.getElementById('callerName').textContent = caller.name;

        const info = document.getElementById('negotiationInfo');
        info.innerHTML = `
            <div style="color: #fff;">
                <div>Trust: ${caller.trust}%</div>
                <div>Respect: ${caller.respect}%</div>
                <div>Fear: ${caller.fear}%</div>
                <div style="margin-top: 10px; color: #ffd700;">Current Demand:</div>
                <div>${demand.text}</div>
                <div style="margin-top: 10px; color: #aaa; font-size: 12px;">Context: ${demand.context}</div>
            </div>
        `;

        this.displayContextualLeverageCards(caller, demand);
    }

    generateContextualDemand(caller) {
        const recentDemands = this.history.phoneCalls
            .filter(c => c.caller === caller.name)
            .slice(-3)
            .map(c => c.demand.issue);

        const availableIssues = caller.currentIssues.filter(i => !recentDemands.includes(i));
        const issue = availableIssues[Math.floor(Math.random() * availableIssues.length)] || caller.currentIssues[0];

        let demandText;
        let context;

        if (caller.personality === 'aggressive' && caller.fear < 50) {
            demandText = this.generateAggressiveDemand(caller, issue);
            context = 'They seem confrontational';
        } else if (caller.trust > 60) {
            demandText = this.generateFriendlyDemand(caller, issue);
            context = 'They seem cooperative';
        } else {
            demandText = this.generateNeutralDemand(caller, issue);
            context = 'Standard diplomatic approach';
        }

        return { text: demandText, issue, context };
    }

    generateAggressiveDemand(caller, issue) {
        const demands = {
            sanctions: 'Remove all sanctions immediately or face consequences',
            trade: 'Accept our trade terms or we impose tariffs',
            budget: 'Pass our budget or we shut down government',
            healthcare: 'Kill that healthcare bill or we block everything'
        };
        return demands[issue] || `Strong action needed on ${issue}`;
    }

    generateFriendlyDemand(caller, issue) {
        const demands = {
            sanctions: 'Could we discuss easing some sanctions?',
            trade: "Let's work together on a trade deal",
            budget: 'We need to find common ground on the budget',
            healthcare: 'Can we collaborate on healthcare reform?'
        };
        return demands[issue] || `Let's cooperate on ${issue}`;
    }

    generateNeutralDemand(caller, issue) {
        const demands = {
            sanctions: 'We need to address the sanctions issue',
            trade: 'Trade negotiations must move forward',
            budget: 'The budget situation needs resolution',
            healthcare: 'Healthcare policy requires attention'
        };
        return demands[issue] || `We must discuss ${issue}`;
    }

    displayContextualLeverageCards(caller, demand) {
        const container = document.getElementById('leverageCards');
        container.innerHTML = '';

        const leverageOptions = this.generateLeverageOptions(caller, demand);

        leverageOptions.forEach(option => {
            const cardEl = document.createElement('div');
            cardEl.className = 'leverage-card';
            cardEl.innerHTML = `
                <div style="font-weight: bold;">${option.name}</div>
                <div style="font-size: 12px; margin-top: 5px;">
                    Success: ${option.successChance}% | Risk: ${option.risk}
                </div>
            `;
            cardEl.onclick = () => this.useContextualLeverage(option, caller, cardEl);
            container.appendChild(cardEl);
        });
    }

    generateLeverageOptions(caller) {
        const options = [
            {
                name: 'Agree to demands',
                successChance: 90,
                risk: 'Low',
                effect: 'cooperative'
            },
            {
                name: 'Refuse outright',
                successChance: 20,
                risk: 'High',
                effect: 'aggressive'
            }
        ];

        if (caller.fear > 30) {
            options.push({
                name: 'Threaten retaliation',
                successChance: Math.round(50 + caller.fear / 2),
                risk: 'Very High',
                effect: 'intimidation'
            });
        }

        if (caller.trust > 40) {
            options.push({
                name: 'Propose compromise',
                successChance: Math.round(30 + caller.trust / 2),
                risk: 'Medium',
                effect: 'diplomatic'
            });
        }

        if (caller.respect > 50) {
            options.push({
                name: 'Appeal to shared interests',
                successChance: Math.round(40 + caller.respect / 3),
                risk: 'Low',
                effect: 'strategic'
            });
        }

        if (this.currentContext.economicState === 'crisis' && caller.currentDemand.issue === 'trade') {
            options.push({
                name: 'Emergency economic deal',
                successChance: 70,
                risk: 'Medium',
                effect: 'desperate'
            });
        }

        return options;
    }

    useContextualLeverage(option, caller, element) {
        if (element.classList.contains('used')) return;
        element.classList.add('used');

        const success = Math.random() * 100 < option.successChance;

        if (option.effect === 'cooperative') {
            this.updateRelationship(caller.name, 15, 10, -10);
            this.chaos = Math.max(0, this.chaos - 10);
            this.showNotification(`Agreement reached with ${caller.name}`);
        } else if (option.effect === 'aggressive' && success) {
            this.updateRelationship(caller.name, -20, -10, 20);
            this.chaos += 15;
            this.showNotification(`${caller.name} backs down... for now`);
        } else if (option.effect === 'diplomatic' && success) {
            this.updateRelationship(caller.name, 10, 15, 0);
            this.showNotification(`Compromise reached with ${caller.name}`);
        } else if (!success) {
            this.updateRelationship(caller.name, -15, -20, 10);
            this.chaos += 20;
            this.showNotification(`${caller.name} is furious! Negotiations failed!`);
        }

        caller.history.push({
            demand: caller.currentDemand,
            response: option.name,
            success,
            timestamp: Date.now()
        });

        this.energy -= 15;
        this.updateDisplay();

        setTimeout(() => this.endCall(), 2000);
    }

    triggerContextualEvent() {
        const eventTypes = [];

        if (this.currentContext.economicState === 'crisis') {
            eventTypes.push('market_panic', 'unemployment_spike', 'bank_failure');
        }

        if (this.currentContext.internationalTension === 'high') {
            eventTypes.push('diplomatic_incident', 'military_provocation', 'alliance_strain');
        }

        if (this.currentContext.publicMood === 'angry') {
            eventTypes.push('protest', 'riot', 'approval_drop');
        }

        this.relationships.forEach(rel => {
            if (rel.trust < 20 && Math.random() < 0.3) {
                eventTypes.push({ type: 'betrayal', actor: rel.name });
            }
            if (rel.fear > 70 && Math.random() < 0.2) {
                eventTypes.push({ type: 'submission', actor: rel.name });
            }
        });

        if (eventTypes.length === 0) {
            eventTypes.push('routine_news', 'minor_scandal', 'policy_debate');
        }

        const selectedEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        this.executeContextualEvent(selectedEvent);
    }

    executeContextualEvent(event) {
        let notification;
        let impact = {};

        if (typeof event === 'object') {
            if (event.type === 'betrayal') {
                notification = `${event.actor} betrays you publicly!`;
                impact = { chaos: 20, relationship: { name: event.actor, trust: -30, respect: -20 } };

                if (Math.random() < 0.5) {
                    setTimeout(() => this.triggerScandal(), 2000);
                }
            } else if (event.type === 'submission') {
                notification = `${event.actor} caves to your pressure`;
                impact = { chaos: -10, score: 100, relationship: { name: event.actor, respect: -10, fear: 10 } };
            }
        } else {
            switch (event) {
                case 'market_panic':
                    notification = 'MARKETS CRASHING! Dow down 1000 points!';
                    impact = { chaos: 25, economic: 'worse' };
                    break;
                case 'diplomatic_incident':
                    notification = 'International incident developing!';
                    impact = { chaos: 15, tension: 'increase' };
                    const foreignLeader = this.relationships.find(r =>
                        ['Vladimir Putin', 'Xi Jinping'].includes(r.name)
                    );
                    if (foreignLeader) {
                        setTimeout(() => this.initiatePhoneCall(foreignLeader), 3000);
                    }
                    break;
                case 'protest':
                    notification = 'Massive protests outside White House!';
                    impact = { chaos: 10, publicMood: 'worse' };
                    break;
                default:
                    notification = 'News cycle churning...';
                    impact = { chaos: 2 };
            }
        }

        this.showNotification(notification);
        this.applyEventImpact(impact);
    }

    applyEventImpact(impact) {
        if (impact.chaos) {
            this.chaos = Math.min(100, Math.max(0, this.chaos + impact.chaos));
        }

        if (impact.score) {
            this.score += impact.score;
        }

        if (impact.relationship) {
            this.updateRelationship(
                impact.relationship.name,
                impact.relationship.trust || 0,
                impact.relationship.respect || 0,
                impact.relationship.fear || 0
            );
        }

        if (impact.economic === 'worse') {
            this.currentContext.economicState = 'crisis';
        }

        if (impact.tension === 'increase') {
            this.currentContext.internationalTension = 'high';
        }

        this.updateDisplay();
    }

    evolveRelationships() {
        this.relationships.forEach(rel => {
            if (rel.personality === 'strategic') {
                if (!rel.lastInteraction || Date.now() - rel.lastInteraction > 60000) {
                    rel.trust = Math.max(0, rel.trust - 3);
                }
            } else if (rel.personality === 'aggressive') {
                rel.fear = Math.min(100, rel.fear + 1);
                rel.respect = Math.max(0, rel.respect - 1);
            } else if (rel.personality === 'patient') {
                rel.trust = Math.min(100, rel.trust + 1);
            }

            if (this.currentContext.economicState === 'crisis' && !rel.currentIssues.includes('economy')) {
                rel.currentIssues.push('economy');
            }
        });

        this.displayRelationships();
    }

    generateQuestion(reporter) {
        const recentEvents = this.history.decisions.slice(-3);
        const recentTweets = this.history.tweets.slice(-3);
        const recentScandals = this.history.scandals.slice(-2);
        const recentNews = this.history.newsResponses.slice(-2);

        let questionPool = [];

        if (recentNews.length > 0) {
            const lastNewsResponse = recentNews[recentNews.length - 1];
            questionPool.push(
                `How do you respond to ${lastNewsResponse.story.source}'s report?`,
                `Can you explain your ${lastNewsResponse.action} to the recent news?`
            );
        }

        if (reporter.specialty === 'scandal' && recentScandals.length > 0) {
            questionPool.push(
                `Can you address the ${recentScandals[recentScandals.length - 1].type} scandal?`,
                'Why should Americans trust you after recent events?',
                'Will anyone be held accountable?'
            );
        } else if (reporter.specialty === 'economy' && this.currentContext.economicState !== 'stable') {
            questionPool.push(
                "What's your plan to fix the economy?",
                'How do you respond to market volatility?',
                'Are you concerned about unemployment?'
            );
        } else if (reporter.specialty === 'policy' && recentEvents.length > 0) {
            const lastCrisis = recentEvents[recentEvents.length - 1];
            questionPool.push(
                `Can you explain your ${lastCrisis.action} decision?`,
                "What's your legislative agenda?",
                'How will you work with Congress?'
            );
        }

        if (reporter.mood === 'hostile') {
            questionPool.push(
                'Why are you failing the American people?',
                'Do you take any responsibility?',
                'When will you resign?'
            );
        } else if (reporter.mood === 'friendly') {
            questionPool.push(
                'What achievements are you most proud of?',
                'How do you stay strong under pressure?',
                "What's your vision for America?"
            );
        }

        const controversialTweets = recentTweets.filter(t => t.chaos > 20);
        if (controversialTweets.length > 0) {
            questionPool.push(
                'Can you clarify your recent tweet?',
                'Do you regret what you tweeted?',
                'Is Twitter the appropriate platform for policy?'
            );
        }

        if (questionPool.length === 0) {
            questionPool = [
                'What are your priorities?',
                'How do you respond to critics?',
                "What's next for your administration?"
            ];
        }

        return questionPool[Math.floor(Math.random() * questionPool.length)];
    }

    triggerScandal() {
        if (this.scandalActive) return;

        const scandalType = this.generateScandalType();

        this.scandalActive = true;
        this.currentScandal = scandalType;

        this.history.scandals.push({
            type: scandalType,
            timestamp: Date.now(),
            contained: false
        });

        document.getElementById('scandalControl').classList.add('active');
        document.getElementById('overlay').classList.add('active');

        const scandalTitle = document.querySelector('#scandalControl h2');
        scandalTitle.textContent = `${scandalType.toUpperCase()} SCANDAL SPREADING!`;

        const grid = document.getElementById('scandalGrid');
        grid.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            const node = document.createElement('div');
            node.className = 'scandal-node';
            node.dataset.infected = 'false';
            node.onclick = () => this.containNode(node);
            grid.appendChild(node);
        }

        this.startScandalSpread();
        this.createContextualDamageControl(scandalType);
    }

    generateScandalType() {
        const types = [];

        if (this.history.tweets.some(t => t.chaos > 30)) {
            types.push('twitter');
        }

        if (this.relationships.some(r => r.trust < 20)) {
            types.push('betrayal');
        }

        if (this.currentContext.economicState === 'crisis') {
            types.push('financial');
        }

        if (this.history.newsResponses.some(r => r.action === 'dismiss')) {
            types.push('coverup');
        }

        types.push('personal', 'corruption', 'coverup');

        return types[Math.floor(Math.random() * types.length)];
    }

    createContextualDamageControl(scandalType) {
        const control = document.getElementById('damageControl');
        control.innerHTML = '';

        const strategies = this.generateDamageControlStrategies(scandalType);

        strategies.forEach(strategy => {
            const btn = document.createElement('button');
            btn.className = 'decision-btn';
            btn.style.width = '100%';
            btn.innerHTML = `${strategy.name}<br><span style="font-size: 10px;">Success: ${Math.round(strategy.effectiveness * 100)}%</span>`;
            btn.onclick = () => this.executeSmartDamageControl(strategy);
            control.appendChild(btn);
        });
    }

    generateDamageControlStrategies(scandalType) {
        const strategies = [
            {
                name: 'Deny Everything',
                approach: 'aggressive',
                effectiveness: scandalType === 'twitter' ? 0.3 : 0.5
            }
        ];

        if (scandalType === 'twitter') {
            strategies.push({
                name: 'Claim account was hacked',
                approach: 'deflect',
                effectiveness: 0.4
            });
        }

        if (scandalType === 'financial') {
            strategies.push({
                name: 'Release tax returns',
                approach: 'transparent',
                effectiveness: 0.7
            });
        }

        if (this.relationships.some(r => r.trust > 70)) {
            strategies.push({
                name: 'Get allies to defend you',
                approach: 'coalition',
                effectiveness: 0.6
            });
        }

        strategies.push({
            name: 'Create bigger story',
            approach: 'distraction',
            effectiveness: Math.random() * 0.8 + 0.2
        });

        return strategies;
    }

    executeSmartDamageControl(strategy) {
        clearInterval(this.scandalInterval);

        const success = Math.random() < strategy.effectiveness;

        if (success) {
            this.chaos = Math.max(0, this.chaos - 20);
            this.score += 100;
            this.showNotification(`Strategy worked! Scandal contained!`);
            this.history.scandals[this.history.scandals.length - 1].contained = true;
        } else {
            this.chaos += 15;
            this.showNotification(`Strategy failed! Scandal worsens!`);

            if (strategy.approach === 'aggressive') {
                this.reporters.forEach(r => {
                    r.trust = Math.max(0, r.trust - 20);
                    if (r.mood === 'neutral') r.mood = 'hostile';
                });
            }
        }

        this.closeScandal();
    }

    sendTweet() {
        const input = document.getElementById('tweetInput');
        const content = input.value;

        if (!content) {
            this.showNotification('No content!');
            return;
        }

        this.history.tweets.push({
            content,
            timestamp: Date.now(),
            chaos: 0
        });

        const hotWords = ['fake', 'disaster', 'tremendous', 'witch hunt', 'enemy'];
        let tweetChaos = 0;
        hotWords.forEach(word => {
            if (content.toLowerCase().includes(word)) {
                tweetChaos += 10;
            }
        });

        this.relationships.forEach(rel => {
            const lastName = rel.name.split(' ').pop();
            if (content.toLowerCase().includes(lastName.toLowerCase())) {
                if (content.toLowerCase().includes('great') || content.toLowerCase().includes('friend')) {
                    this.updateRelationship(rel.name, 15, 10, 0);
                } else if (content.toLowerCase().includes('bad') || content.toLowerCase().includes('terrible')) {
                    this.updateRelationship(rel.name, -20, -15, 15);
                    tweetChaos += 15;
                }
            }
        });

        this.chaos = Math.min(100, this.chaos + tweetChaos);
        this.score += tweetChaos * 10;
        this.history.tweets[this.history.tweets.length - 1].chaos = tweetChaos;

        input.value = '';

        this.triggerDopamineHit(tweetChaos > 20 ? 'VIRAL!' : 'SENT!');
        this.showNotification(`Tweet sent! Chaos +${tweetChaos}`);

        this.updateDisplay();
    }

    displayCrisis() {
        if (!this.currentCrisis) return;

        document.getElementById('crisisTitle').textContent = this.currentCrisis.title;
        document.getElementById('crisisDescription').textContent = this.currentCrisis.description;

        const optionsDiv = document.getElementById('crisisOptions');
        optionsDiv.innerHTML = '';

        this.currentCrisis.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'decision-btn';
            btn.textContent = option.text;
            btn.onclick = () => this.handleDecision(option);
            optionsDiv.appendChild(btn);
        });
    }

    handleDecision(option) {
        this.history.decisions.push({
            crisisType: this.currentCrisis.type,
            action: option.text,
            timestamp: Date.now(),
            chaosChange: 0
        });

        let chaosChange = 0;
        if (option.effect === 'aggressive') {
            chaosChange = 15;
            this.energy -= 10;
            this.score += 50;
        } else if (option.effect === 'diplomatic') {
            chaosChange = -5;
            this.energy -= 5;
            this.score += 30;
        } else if (option.effect === 'strategic') {
            chaosChange = 5;
            this.energy -= 15;
            this.score += 70;
        } else if (option.effect === 'chaotic') {
            chaosChange = 25;
            this.energy -= 20;
            this.score += 100;
        }

        this.chaos = Math.min(100, Math.max(0, this.chaos + chaosChange));
        this.history.decisions[this.history.decisions.length - 1].chaosChange = chaosChange;

        if (option.impacts && option.impacts.length > 0) {
            option.impacts.forEach(name => {
                const rel = this.relationships.find(r => r.name === name);
                if (rel) {
                    if (option.effect === 'aggressive') {
                        this.updateRelationship(name, -15, -10, 20);
                    } else if (option.effect === 'diplomatic') {
                        this.updateRelationship(name, 10, 15, -5);
                    }
                }
            });
        }

        this.showNotification(`You chose: ${option.text}`);
        this.updateDisplay();

        setTimeout(() => {
            if (Math.random() < 0.5 && this.currentNewsStories.length > 0) {
                const randomNews = this.currentNewsStories[Math.floor(Math.random() * this.currentNewsStories.length)];
                this.generateNewsBasedCrisis(randomNews);
            } else {
                this.generateContextualCrisis();
            }
        }, 3000);
    }

    displayRelationships() {
        const grid = document.getElementById('relationshipsGrid');
        grid.innerHTML = '';

        this.relationships.forEach(rel => {
            const card = document.createElement('div');
            card.className = 'relationship-card';
            card.innerHTML = `
                <div class="relationship-name">${rel.name}</div>
                <div style="font-size: 12px; color: #aaa; margin-bottom: 10px;">${rel.role}</div>
                <div class="meter">
                    <div class="meter-fill trust-fill" style="width: ${rel.trust}%"></div>
                </div>
                <div style="font-size: 10px; color: #aaa;">Trust: ${rel.trust}%</div>
                <div class="meter">
                    <div class="meter-fill respect-fill" style="width: ${rel.respect}%"></div>
                </div>
                <div style="font-size: 10px; color: #aaa;">Respect: ${rel.respect}%</div>
                <div class="meter">
                    <div class="meter-fill fear-fill" style="width: ${rel.fear}%"></div>
                </div>
                <div style="font-size: 10px; color: #aaa;">Fear: ${rel.fear}%</div>
            `;
            card.onclick = () => this.negotiateWith(rel);
            grid.appendChild(card);
        });
    }

    updateRelationship(name, trustChange = 0, respectChange = 0, fearChange = 0) {
        const rel = this.relationships.find(r => r.name === name);
        if (!rel) return;

        rel.trust = Math.max(0, Math.min(100, rel.trust + trustChange));
        rel.respect = Math.max(0, Math.min(100, rel.respect + respectChange));
        rel.fear = Math.max(0, Math.min(100, rel.fear + fearChange));

        this.displayRelationships();

        if (trustChange !== 0 || respectChange !== 0 || fearChange !== 0) {
            const changes = [];
            if (trustChange !== 0) changes.push(`Trust ${trustChange > 0 ? '+' : ''}${trustChange}`);
            if (respectChange !== 0) changes.push(`Respect ${respectChange > 0 ? '+' : ''}${respectChange}`);
            if (fearChange !== 0) changes.push(`Fear ${fearChange > 0 ? '+' : ''}${fearChange}`);

            this.showNotification(`${name}: ${changes.join(', ')}`);
        }
    }

    negotiateWith(rel) {
        if (Math.random() < 0.5 && !document.getElementById('phoneInterface').classList.contains('active')) {
            this.initiatePhoneCall(rel);
        } else {
            const success = Math.random() < (rel.trust / 100);

            if (success) {
                this.score += 50;
                this.chaos = Math.max(0, this.chaos - 10);
                this.updateRelationship(rel.name, 10, 5, 0);
                this.showNotification(`Successful negotiation with ${rel.name}!`);
            } else {
                this.chaos += 5;
                this.updateRelationship(rel.name, -10, -5, 10);
                this.showNotification(`${rel.name} rejects your proposal!`);
            }

            this.energy -= 10;
            this.updateDisplay();
        }
    }

    setupReporters() {
        const row = document.getElementById('reportersRow');
        row.innerHTML = '';

        this.reporters.forEach(reporter => {
            const reporterEl = document.createElement('div');
            reporterEl.className = `reporter ${reporter.mood}`;
            reporterEl.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">${reporter.name}</div>
                <div style="font-size: 12px; color: #aaa; margin-bottom: 8px;">${reporter.outlet}</div>
                <div class="meter">
                    <div class="meter-fill" style="width: ${reporter.trust}%; background: ${
                        reporter.mood === 'hostile' ? '#ff0000' :
                        reporter.mood === 'friendly' ? '#00ff00' : '#ffff00'
                    }"></div>
                </div>
            `;
            reporterEl.onclick = () => this.selectReporter(reporter, reporterEl);
            row.appendChild(reporterEl);
        });
    }

    startPressConference() {
        document.getElementById('pressConference').classList.add('active');
        this.showNotification('Press Conference Started!');
        this.setupReporters();

        this.history.pressConferences.push({
            timestamp: Date.now(),
            context: this.currentContext
        });
    }

    endPressConference() {
        document.getElementById('pressConference').classList.remove('active');
        this.currentReporter = null;
        document.getElementById('currentQuestion').textContent = '';
        document.querySelectorAll('.reporter').forEach(r => r.classList.remove('selected'));
    }

    selectReporter(reporter, element) {
        document.querySelectorAll('.reporter').forEach(r => r.classList.remove('selected'));
        element.classList.add('selected');

        this.currentReporter = reporter;
        this.currentQuestion = this.generateQuestion(reporter);
        document.getElementById('currentQuestion').textContent = `${reporter.name} asks: "${this.currentQuestion}"`;
    }

    pressResponse(style) {
        if (!this.currentReporter) {
            this.showNotification('Select a reporter first!');
            return;
        }

        let chaosChange = 0;
        let scoreChange = 0;
        let message = '';

        if (style === 'attack') {
            chaosChange = 15;
            scoreChange = 30;
            message = 'You attack the media!';
            this.currentReporter.trust = Math.max(0, this.currentReporter.trust - 20);
        } else if (style === 'deflect') {
            chaosChange = 5;
            scoreChange = 20;
            message = 'You deflect the question!';
            this.currentReporter.trust = Math.max(0, this.currentReporter.trust - 10);
        } else if (style === 'answer') {
            chaosChange = -5;
            scoreChange = 10;
            message = 'You provide a direct answer.';
            this.currentReporter.trust = Math.min(100, this.currentReporter.trust + 10);
        } else if (style === 'joke') {
            chaosChange = 10;
            scoreChange = 50;
            message = 'You make a joke!';
            if (Math.random() < 0.5) {
                message += ' It lands well!';
                this.currentReporter.trust = Math.min(100, this.currentReporter.trust + 15);
            } else {
                message += ' Awkward silence...';
                chaosChange = 20;
            }
        }

        this.chaos = Math.max(0, Math.min(100, this.chaos + chaosChange));
        this.score += scoreChange;
        this.energy -= 5;

        this.showNotification(message);
        this.updateDisplay();
        this.setupReporters();

        this.currentReporter = null;
        document.getElementById('currentQuestion').textContent = '';
        document.querySelectorAll('.reporter').forEach(r => r.classList.remove('selected'));
    }

    startScandalSpread() {
        const nodes = document.querySelectorAll('.scandal-node');
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        randomNode.classList.add('infected');
        randomNode.dataset.infected = 'true';

        this.scandalInterval = setInterval(() => {
            const uninfected = document.querySelectorAll('.scandal-node:not(.infected)');
            if (uninfected.length === 0) {
                this.scandalFullySpread();
                return;
            }

            const toInfect = uninfected[Math.floor(Math.random() * uninfected.length)];
            toInfect.classList.add('infected');
            toInfect.dataset.infected = 'true';

            this.chaos += 3;
            this.updateDisplay();
        }, 2000);
    }

    containNode(node) {
        if (node.dataset.infected === 'true') {
            node.classList.remove('infected');
            node.dataset.infected = 'false';
            this.chaos = Math.max(0, this.chaos - 5);
            this.energy -= 5;
            this.updateDisplay();
            this.showNotification('Scandal contained in this area!');
        }
    }

    scandalFullySpread() {
        clearInterval(this.scandalInterval);
        this.chaos = Math.min(100, this.chaos + 30);
        this.showNotification('SCANDAL WENT VIRAL! Major damage to presidency!');
        this.triggerDopamineHit('DISASTER!');

        this.relationships.forEach(rel => {
            rel.trust = Math.max(0, rel.trust - 20);
            rel.respect = Math.max(0, rel.respect - 15);
        });
        this.displayRelationships();

        this.closeScandal();
    }

    closeScandal() {
        this.scandalActive = false;
        clearInterval(this.scandalInterval);
        document.getElementById('scandalControl').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }

    endCall() {
        document.getElementById('phoneInterface').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        this.currentCaller = null;
    }

    updateDisplay() {
        document.getElementById('day').textContent = this.day;
        document.getElementById('energy').textContent = this.energy;
        document.getElementById('chaos').textContent = this.chaos;
        document.getElementById('score').textContent = this.score;
    }

    showNotification(message) {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.textContent = message;
        document.body.appendChild(notif);

        setTimeout(() => notif.remove(), 3000);
    }

    triggerDopamineHit(text) {
        const burst = document.createElement('div');
        burst.className = 'dopamine-burst';
        burst.textContent = text;
        document.body.appendChild(burst);

        setTimeout(() => burst.remove(), 1000);
    }
}

console.log('President Simulator - Total Chaos Edition loaded with REAL NEWS!');

window.startPresidency = startPresidency;
