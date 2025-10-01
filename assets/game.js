/*
=============================================================================
PRESIDENT SIMULATOR - TOTAL CHAOS EDITION
Influence Network System
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

        // POWER CENTERS - The Core System
        this.powerCenters = [
            { id: 'congress', name: 'Congress', icon: '🏛️', value: 50, color: '#4169E1' },
            { id: 'military', name: 'Military', icon: '🎖️', value: 60, color: '#556B2F' },
            { id: 'intelligence', name: 'Intelligence', icon: '🕵️', value: 50, color: '#2F4F4F' },
            { id: 'wallstreet', name: 'Wall Street', icon: '💰', value: 55, color: '#FFD700' },
            { id: 'media', name: 'Media', icon: '📺', value: 40, color: '#FF4500' },
            { id: 'public', name: 'Public Opinion', icon: '👥', value: 50, color: '#32CD32' },
            { id: 'industry', name: 'Industry', icon: '🏭', value: 55, color: '#708090' },
            { id: 'science', name: 'Scientific Community', icon: '🎓', value: 45, color: '#9370DB' }
        ];

        this.currentNewsStories = [];
        this.newsCache = this.loadNewsCache() || [];
        this.processedNewsEvents = [];

        this.history = {
            tweets: [],
            decisions: [],
            phoneCalls: [],
            pressConferences: [],
            scandals: [],
            newsResponses: [],
            powerChanges: []
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
            }
        ];

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
        this.lastNewsFetch = 0;
        this.pendingCascades = [];
        this.aiCallsToday = 0;
        this.maxFreeAICalls = 3;
    }

    async init() {
        this.updateDisplay();
        this.displayPowerCenters();
        this.displayRelationships();
        await this.loadInitialNews();
        this.setupReporters();
        
        // Generate initial crisis
        this.generateContextualCrisis();

        this.gameInterval = setInterval(() => this.gameLoop(), 5000);
        this.newsInterval = setInterval(() => this.checkForNewsUpdate(), 600000); // Every 10 min
    }

    // ============= POWER CENTER SYSTEM =============
    
    displayPowerCenters() {
        const container = document.getElementById('powerCentersGrid');
        container.innerHTML = '';

        this.powerCenters.forEach(center => {
            const card = document.createElement('div');
            card.className = 'power-center-card';
            card.innerHTML = `
                <div class="power-center-header">
                    <span class="power-icon">${center.icon}</span>
                    <span class="power-name">${center.name}</span>
                </div>
                <div class="power-meter">
                    <div class="power-meter-fill" id="power-${center.id}" 
                         style="width: ${center.value}%; background: ${center.color}"></div>
                </div>
                <div class="power-value">${center.value}%</div>
            `;
            container.appendChild(card);
        });

        this.checkCoalitions();
    }

    updatePowerCenter(id, change, reason = '') {
        const center = this.powerCenters.find(p => p.id === id);
        if (!center) return;

        const oldValue = center.value;
        center.value = Math.max(0, Math.min(100, center.value + change));
        
        // Animate the change
        const fillEl = document.getElementById(`power-${id}`);
        if (fillEl) {
            fillEl.style.width = `${center.value}%`;
            
            // Flash effect
            const card = fillEl.closest('.power-center-card');
            card.classList.add(change > 0 ? 'power-increase' : 'power-decrease');
            setTimeout(() => {
                card.classList.remove('power-increase', 'power-decrease');
            }, 500);
        }

        // Show change notification
        if (Math.abs(change) >= 5) {
            this.showPowerChangeNotification(center, change, reason);
        }

        // Record in history
        this.history.powerChanges.push({
            center: id,
            oldValue,
            newValue: center.value,
            change,
            reason,
            timestamp: Date.now()
        });

        // Check for cascades
        this.triggerCascadeEffects(id, change);
        this.checkCoalitions();
    }

    showPowerChangeNotification(center, change, reason) {
        const notif = document.createElement('div');
        notif.className = 'power-notification';
        notif.innerHTML = `
            ${center.icon} ${center.name}: ${change > 0 ? '+' : ''}${Math.round(change)}
            ${reason ? `<div style="font-size: 11px; opacity: 0.8;">${reason}</div>` : ''}
        `;
        document.getElementById('powerNotifications').appendChild(notif);

        setTimeout(() => notif.remove(), 3000);
    }

    triggerCascadeEffects(triggerId, change) {
        // Define cascade rules
        const cascades = {
            wallstreet: [
                { target: 'industry', factor: 0.3, condition: () => Math.abs(change) > 15 },
                { target: 'public', factor: -0.2, condition: () => change < -10 }
            ],
            military: [
                { target: 'intelligence', factor: 0.2, condition: () => Math.abs(change) > 10 }
            ],
            media: [
                { target: 'public', factor: 0.4, condition: () => Math.abs(change) > 10 }
            ],
            congress: [
                { target: 'public', factor: 0.15, condition: () => change < -15 }
            ],
            public: [
                { target: 'congress', factor: 0.25, condition: () => Math.abs(change) > 20 }
            ]
        };

        const rules = cascades[triggerId];
        if (!rules) return;

        rules.forEach(rule => {
            if (rule.condition()) {
                const cascadeChange = change * rule.factor;
                setTimeout(() => {
                    this.updatePowerCenter(rule.target, cascadeChange, 'Cascade effect');
                }, 500);
            }
        });
    }

    checkCoalitions() {
        const hostile = this.powerCenters.filter(p => p.value < 30);
        const allies = this.powerCenters.filter(p => p.value > 70);

        // Update coalition display
        const coalitionEl = document.getElementById('coalitionStatus');
        if (hostile.length >= 3) {
            coalitionEl.innerHTML = `⚠️ <strong>Coalition Against You:</strong> ${hostile.map(h => h.icon).join(' ')}`;
            coalitionEl.className = 'coalition-warning';
        } else if (allies.length >= 3) {
            coalitionEl.innerHTML = `✅ <strong>Strong Coalition:</strong> ${allies.map(a => a.icon).join(' ')}`;
            coalitionEl.className = 'coalition-positive';
        } else {
            coalitionEl.innerHTML = '📊 Political Balance Maintained';
            coalitionEl.className = '';
        }
    }

    // ============= NEWS SYSTEM (SHOW ALL) =============

    async loadInitialNews() {
        const ticker = document.getElementById('newsTickerContent');
        ticker.innerHTML = '<span class="news-item">📡 Loading real political news...</span>';
        
        await this.fetchRealPoliticalNews();
    }

    async checkForNewsUpdate() {
        const timeSince = Date.now() - this.lastNewsFetch;
        if (timeSince > 600000) { // 10 minutes
            await this.fetchRealPoliticalNews();
        }
    }

    async fetchRealPoliticalNews() {
        try {
            const response = await fetch(
                '/api/news?q=(politics OR congress OR president OR senate OR china OR russia OR economy OR scandal OR military OR healthcare)&' +
                'language=en&sortBy=publishedAt&pageSize=15'
            );

            if (!response.ok) throw new Error('NewsAPI failed');

            const data = await response.json();
            
            if (!data.articles || data.articles.length === 0) throw new Error('No articles');

            const newsStories = data.articles.map(article => ({
                headline: article.title,
                source: article.source.name,
                relevance: this.calculateRelevance(article.title, article.description),
                category: this.categorizeNews(article.title, article.description),
                affectedCenters: this.identifyAffectedCenters(article.title, article.description),
                timestamp: new Date(article.publishedAt).getTime()
            }));

            // DON'T FILTER - SHOW ALL
            this.currentNewsStories = newsStories;
            this.cacheNews(newsStories);
            this.displayNewsTicker();
            this.lastNewsFetch = Date.now();

            // Trigger breaking news for high relevance
            const breakingNews = newsStories.filter(s => s.relevance > 0.75);
            if (breakingNews.length > 0 && Math.random() < 0.4) {
                setTimeout(() => this.triggerBreakingNews(breakingNews[0]), 2000);
            }

            console.log('✅ Fetched', newsStories.length, 'real news stories');
            
        } catch (error) {
            console.error('News fetch failed:', error);
            await this.fetchRSSNews();
        }
    }

    async fetchRSSNews() {
        try {
            const feeds = ['bbc', 'nyt'];
            const randomFeed = feeds[Math.floor(Math.random() * feeds.length)];
            const response = await fetch(`/api/rss?feed=${randomFeed}`);

            if (!response.ok) throw new Error('RSS failed');

            const rssJson = await response.json();
            const items = rssJson.items || [];

            const newsStories = items.map(item => ({
                headline: item.title || "",
                source: rssJson.feedTitle || "RSS Feed",
                relevance: this.calculateRelevance(item.title, item.description),
                category: this.categorizeNews(item.title, item.description),
                affectedCenters: this.identifyAffectedCenters(item.title, item.description),
                timestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
            }));

            this.currentNewsStories = newsStories;
            this.cacheNews(newsStories);
            this.displayNewsTicker();
            
            console.log('✅ Fetched RSS news');
            
        } catch (error) {
            console.error('RSS failed, using cache:', error);
            this.loadCachedNews();
        }
    }

    calculateRelevance(title, description) {
        const text = (title + ' ' + (description || '')).toLowerCase();
        let score = 0.3;

        const highKeywords = ['president', 'congress', 'senate', 'white house', 'impeach', 'scandal', 
            'crisis', 'trump', 'biden', 'government', 'federal', 'washington', 'supreme court'];
        highKeywords.forEach(keyword => {
            if (text.includes(keyword)) score += 0.15;
        });

        const medKeywords = ['election', 'bill', 'policy', 'democrat', 'republican', 'nato', 
            'china', 'russia', 'military', 'economy', 'inflation', 'trade'];
        medKeywords.forEach(keyword => {
            if (text.includes(keyword)) score += 0.08;
        });

        return Math.min(1, score);
    }

    categorizeNews(title, description) {
        const text = (title + ' ' + (description || '')).toLowerCase();

        if (text.match(/china|russia|ukraine|nato|foreign|diplomat|putin|xi/)) return 'foreign';
        if (text.match(/scandal|investigation|corruption|resign|indict/)) return 'scandal';
        if (text.match(/market|economy|inflation|fed|unemployment|stock|trade/)) return 'economy';
        if (text.match(/military|pentagon|defense|war|troops/)) return 'military';
        if (text.match(/healthcare|medicare|drug|pharma|hospital/)) return 'healthcare';
        
        return 'domestic';
    }

    identifyAffectedCenters(title, description) {
        const text = (title + ' ' + (description || '')).toLowerCase();
        const affected = [];

        if (text.match(/congress|senate|house|legislat/)) affected.push('congress');
        if (text.match(/military|pentagon|defense|troops/)) affected.push('military');
        if (text.match(/cia|fbi|intelligence|spy/)) affected.push('intelligence');
        if (text.match(/market|stock|wall street|dow|investor/)) affected.push('wallstreet');
        if (text.match(/media|press|journalist|cnn|fox/)) affected.push('media');
        if (text.match(/poll|voter|public|american/)) affected.push('public');
        if (text.match(/business|ceo|industry|corporate/)) affected.push('industry');
        if (text.match(/science|research|university|academic/)) affected.push('science');

        return affected;
    }

    displayNewsTicker() {
        const ticker = document.getElementById('newsTickerContent');
        ticker.innerHTML = '';

        this.currentNewsStories.forEach(story => {
            const item = document.createElement('span');
            item.className = 'news-item';
            
            // Add emoji badge based on relevance
            const badge = story.relevance > 0.75 ? '🔥' : 
                         story.relevance > 0.5 ? '⚡' : '📰';
            
            item.innerHTML = `${badge} [${story.source}] ${story.headline}`;
            item.onclick = () => this.respondToNews(story);
            ticker.appendChild(item);
        });
    }

    respondToNews(story) {
        console.log('📰 Responding to:', story.headline);
        this.generateUniversalCrisis(story);
        this.showNotification(`⚡ ${story.headline.substring(0, 60)}...`);
    }

    // ============= UNIVERSAL CRISIS GENERATION =============

    generateUniversalCrisis(story) {
        // Show which power centers are affected
        const affectedCenters = story.affectedCenters.length > 0 ? 
            story.affectedCenters : this.guessAffectedCenters(story.category);

        const crisis = {
            newsStory: story,
            title: `URGENT: ${story.headline}`,
            description: this.generateCrisisDescription(story, affectedCenters),
            affectedCenters,
            options: this.generateUniversalOptions(story, affectedCenters)
        };

        this.currentCrisis = crisis;
        this.displayCrisis();
    }

    guessAffectedCenters(category) {
        const mapping = {
            foreign: ['military', 'intelligence', 'congress'],
            economy: ['wallstreet', 'industry', 'public'],
            scandal: ['media', 'public', 'congress'],
            military: ['military', 'intelligence', 'congress'],
            healthcare: ['science', 'public', 'industry'],
            domestic: ['congress', 'public', 'media']
        };
        return mapping[category] || ['public', 'media'];
    }

    generateCrisisDescription(story, affectedCenters) {
        const centerNames = affectedCenters.map(id => {
            const center = this.powerCenters.find(p => p.id === id);
            return center ? `${center.icon} ${center.name}` : '';
        }).filter(n => n).join(', ');

        return `${story.source} reports this breaking development. Your response will impact: ${centerNames}`;
    }

    generateUniversalOptions(story, affectedCenters) {
        const options = [];

        // Option 1: Strong Response
        options.push({
            text: '💪 Take Strong Action',
            effects: affectedCenters.map(id => {
                if (id === 'military' || id === 'intelligence') return { center: id, change: 10 };
                if (id === 'media') return { center: id, change: -5 };
                if (id === 'public') return { center: id, change: 15 };
                return { center: id, change: 5 };
            }),
            chaos: 15,
            energy: 20
        });

        // Option 2: Diplomatic/Cautious
        options.push({
            text: '🤝 Measured Response',
            effects: affectedCenters.map(id => {
                if (id === 'congress') return { center: id, change: 10 };
                if (id === 'media') return { center: id, change: 8 };
                if (id === 'military') return { center: id, change: -5 };
                return { center: id, change: 5 };
            }),
            chaos: -5,
            energy: 10
        });

        // Option 3: Blame/Attack
        options.push({
            text: '🔥 Attack Opponents',
            effects: affectedCenters.map(id => {
                if (id === 'public') return { center: id, change: 10 };
                if (id === 'media') return { center: id, change: -15 };
                if (id === 'congress') return { center: id, change: -10 };
                return { center: id, change: -5 };
            }),
            chaos: 25,
            energy: 15
        });

        // Option 4: Tweet Storm
        options.push({
            text: '🐦 Twitter Response',
            effects: affectedCenters.map(id => {
                if (id === 'public') return { center: id, change: 15 };
                if (id === 'media') return { center: id, change: -10 };
                return { center: id, change: Math.random() > 0.5 ? 5 : -5 };
            }),
            chaos: 20,
            energy: 5
        });

        return options;
    }

    displayCrisis() {
        if (!this.currentCrisis) return;

        const crisis = this.currentCrisis;
        
        document.getElementById('crisisTitle').textContent = crisis.title;
        document.getElementById('crisisDescription').innerHTML = crisis.description;

        // Show affected power centers
        const affectedEl = document.getElementById('affectedCenters');
        affectedEl.innerHTML = crisis.affectedCenters.map(id => {
            const center = this.powerCenters.find(p => p.id === id);
            return center ? `<span class="affected-badge">${center.icon} ${center.name}</span>` : '';
        }).join('');

        const optionsDiv = document.getElementById('crisisOptions');
        optionsDiv.innerHTML = '';

        crisis.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'decision-btn';
            btn.innerHTML = `
                ${option.text}
                <div class="option-preview">
                    Chaos: ${option.chaos > 0 ? '+' : ''}${option.chaos} | 
                    Energy: -${option.energy}
                </div>
            `;
            btn.onclick = () => this.handleUniversalDecision(option);
            optionsDiv.appendChild(btn);
        });

        // Scroll crisis into view
        document.getElementById('crisisPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    handleUniversalDecision(option) {
        // Apply effects to power centers
        option.effects.forEach(effect => {
            this.updatePowerCenter(effect.center, effect.change, 'Your decision');
        });

        // Apply game state changes
        this.chaos = Math.max(0, Math.min(100, this.chaos + option.chaos));
        this.energy = Math.max(0, this.energy - option.energy);
        this.score += Math.abs(option.chaos) * 5;

        this.history.decisions.push({
            crisis: this.currentCrisis.title,
            option: option.text,
            effects: option.effects,
            timestamp: Date.now()
        });

        this.showNotification(`Decision made: ${option.text}`);
        this.updateDisplay();

        // Generate next crisis after delay
        setTimeout(() => {
            if (this.currentNewsStories.length > 0) {
                const randomNews = this.currentNewsStories[Math.floor(Math.random() * this.currentNewsStories.length)];
                this.generateUniversalCrisis(randomNews);
            } else {
                this.generateContextualCrisis();
            }
        }, 3000);
    }

    // ============= BREAKING NEWS ALERT =============

    triggerBreakingNews(story) {
        const existing = document.querySelector('.breaking-news-modal');
        if (existing) return;

        const modal = document.createElement('div');
        modal.className = 'breaking-news-modal';
        modal.innerHTML = `
            <div class="breaking-news-content">
                <div class="breaking-badge">🚨 BREAKING NEWS 🚨</div>
                <h2>${story.headline}</h2>
                <p style="color: #ddd; margin: 20px 0;">This requires immediate presidential response!</p>
                <div class="breaking-power-centers">
                    ${story.affectedCenters.map(id => {
                        const center = this.powerCenters.find(p => p.id === id);
                        return center ? `<span class="affected-badge">${center.icon} ${center.name}</span>` : '';
                    }).join('')}
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="breaking-btn primary" onclick="game.respondToBreakingNews('${story.headline}')">
                        RESPOND NOW
                    </button>
                    <button class="breaking-btn secondary" onclick="game.dismissBreakingNews()">
                        Ignore (Chaos +10)
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Auto-dismiss after 15 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                this.chaos += 10;
                this.updateDisplay();
                modal.remove();
                this.showNotification('⚠️ Ignored breaking news - chaos increased!');
            }
        }, 15000);
    }

    respondToBreakingNews(headline) {
        const story = this.currentNewsStories.find(s => s.headline === headline);
        const modal = document.querySelector('.breaking-news-modal');
        if (modal) modal.remove();
        
        if (story) {
            this.generateUniversalCrisis(story);
        }
    }

    dismissBreakingNews() {
        const modal = document.querySelector('.breaking-news-modal');
        if (modal) modal.remove();
        this.chaos += 10;
        this.updateDisplay();
        this.showNotification('⚠️ Breaking news ignored - media trust drops');
        this.updatePowerCenter('media', -10, 'Ignored breaking news');
    }

    // ============= NEWS CACHING =============

    cacheNews(stories) {
        try {
            const cache = {
                stories: stories.slice(0, 50),
                timestamp: Date.now()
            };
            localStorage.setItem('newsCache', JSON.stringify(cache));
        } catch (e) {
            console.warn('Failed to cache news:', e);
        }
    }

    loadNewsCache() {
        try {
            const cache = localStorage.getItem('newsCache');
            if (cache) {
                const parsed = JSON.parse(cache);
                // Only use cache if less than 24 hours old
                if (Date.now() - parsed.timestamp < 86400000) {
                    return parsed.stories;
                }
            }
        } catch (e) {
            console.warn('Failed to load news cache:', e);
        }
        return null;
    }

    loadCachedNews() {
        const cached = this.loadNewsCache();
        if (cached && cached.length > 0) {
            this.currentNewsStories = cached;
            this.displayNewsTicker();
            console.log('📦 Using cached news');
        } else {
            // Ultimate fallback
            this.loadMockNews();
        }
    }

    loadMockNews() {
        this.currentNewsStories = [
            {
                headline: 'Congress Debates Infrastructure Bill Worth $2 Trillion',
                source: 'Reuters',
                relevance: 0.9,
                category: 'domestic',
                affectedCenters: ['congress', 'public', 'industry'],
                timestamp: Date.now()
            },
            {
                headline: 'China Warns Against Taiwan Independence',
                source: 'CNN',
                relevance: 0.8,
                category: 'foreign',
                affectedCenters: ['military', 'intelligence', 'wallstreet'],
                timestamp: Date.now()
            },
            {
                headline: 'Fed Considers Interest Rate Hike Amid Inflation',
                source: 'Bloomberg',
                relevance: 0.7,
                category: 'economy',
                affectedCenters: ['wallstreet', 'public', 'industry'],
                timestamp: Date.now()
            }
        ];
        this.displayNewsTicker();
        console.log('📦 Using mock news (offline mode)');
    }

    // ============= EXISTING SYSTEMS (KEPT FOR COMPATIBILITY) =============

    generateContextualCrisis() {
        // Fallback crisis generator
        const crisis = {
            title: 'Domestic Policy Challenge',
            description: 'Congress is demanding action on a critical issue.',
            affectedCenters: ['congress', 'public'],
            options: this.generateUniversalOptions(
                { category: 'domestic', headline: 'Policy Challenge' },
                ['congress', 'public']
            )
        };
        this.currentCrisis = crisis;
        this.displayCrisis();
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
            timestamp: Date.now()
        });

        const hotWords = ['fake', 'disaster', 'tremendous', 'witch hunt', 'enemy', 'failing'];
        let tweetChaos = 5;
        hotWords.forEach(word => {
            if (content.toLowerCase().includes(word)) {
                tweetChaos += 10;
            }
        });

        // Affect power centers
        if (content.toLowerCase().includes('media') || content.toLowerCase().includes('fake news')) {
            this.updatePowerCenter('media', -15, 'Your tweet');
        }
        if (content.toLowerCase().includes('congress')) {
            this.updatePowerCenter('congress', -10, 'Your tweet');
        }
        
        this.updatePowerCenter('public', tweetChaos > 15 ? 10 : 5, 'Your tweet');

        this.chaos = Math.min(100, this.chaos + tweetChaos);
        this.score += tweetChaos * 10;

        input.value = '';
        this.showNotification(`Tweet sent! Chaos +${tweetChaos}`);
        this.updateDisplay();
    }

    gameLoop() {
        this.day += 1;
        this.energy = Math.max(0, this.energy - 2);
        this.score += 10;

        // Small random power center drift
        if (Math.random() < 0.3) {
            const randomCenter = this.powerCenters[Math.floor(Math.random() * this.powerCenters.length)];
            const drift = (Math.random() - 0.5) * 4;
            this.updatePowerCenter(randomCenter.id, drift, 'Daily drift');
        }

        this.updateDisplay();
    }

    initiatePhoneCall(caller) {
        // Simplified phone call system
        this.showNotification(`📞 ${caller.name} is calling...`);
    }

    startPressConference() {
        document.getElementById('pressConference').classList.add('active');
        this.setupReporters();
    }

    endPressConference() {
        document.getElementById('pressConference').classList.remove('active');
    }

    setupReporters() {
        const row = document.getElementById('reportersRow');
        row.innerHTML = '';

        this.reporters.forEach(reporter => {
            const reporterEl = document.createElement('div');
            reporterEl.className = `reporter ${reporter.mood}`;
            reporterEl.innerHTML = `
                <div style="font-weight: bold;">${reporter.name}</div>
                <div style="font-size: 12px;">${reporter.outlet}</div>
            `;
            reporterEl.onclick = () => this.selectReporter(reporter, reporterEl);
            row.appendChild(reporterEl);
        });
    }

    selectReporter(reporter, element) {
        document.querySelectorAll('.reporter').forEach(r => r.classList.remove('selected'));
        element.classList.add('selected');
        this.currentReporter = reporter;
        
        const question = `How do you respond to recent events?`;
        document.getElementById('currentQuestion').textContent = `${reporter.name} asks: "${question}"`;
    }

    pressResponse(style) {
        if (!this.currentReporter) {
            this.showNotification('Select a reporter first!');
            return;
        }

        const effects = {
            attack: { media: -15, public: 10, chaos: 15 },
            deflect: { media: -5, public: 0, chaos: 5 },
            answer: { media: 10, public: 5, chaos: -5 },
            joke: { media: Math.random() > 0.5 ? 10 : -10, public: 5, chaos: 10 }
        };

        const effect = effects[style];
        if (effect.media) this.updatePowerCenter('media', effect.media, `Press conference`);
        if (effect.public) this.updatePowerCenter('public', effect.public, `Press conference`);
        this.chaos = Math.max(0, Math.min(100, this.chaos + effect.chaos));
        
        this.energy -= 5;
        this.score += 20;
        
        this.showNotification(`You ${style} the question!`);
        this.updateDisplay();
        this.currentReporter = null;
        document.getElementById('currentQuestion').textContent = '';
    }

    displayRelationships() {
        const grid = document.getElementById('relationshipsGrid');
        grid.innerHTML = '';

        this.relationships.forEach(rel => {
            const card = document.createElement('div');
            card.className = 'relationship-card';
            card.innerHTML = `
                <div class="relationship-name">${rel.name}</div>
                <div style="font-size: 12px; color: #aaa;">${rel.role}</div>
                <div class="meter"><div class="meter-fill trust-fill" style="width: ${rel.trust}%"></div></div>
                <div style="font-size: 10px;">Trust: ${rel.trust}%</div>
            `;
            card.onclick = () => this.initiatePhoneCall(rel);
            grid.appendChild(card);
        });
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

    async generateAINarrative(newsStory, generationType) {
        if (this.aiCallsToday >= this.maxFreeAICalls) {
            this.showNotification('Upgrade to Premium for unlimited AI crises!');
            this.generateFallbackCrisis(newsStory);
            return;
        }
        this.aiCallsToday++;
        try {
            const response = await fetch('/api/ai-narrative', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerContext: {
                        history: this.history,
                        relationships: this.relationships,
                        decisions: this.history.decisions
                    },
                    newsHeadline: newsStory.headline,
                    generationType
                })
            });
            const data = await response.json();
            if (data.success) {
                this.applyNarrative(data.narrative, generationType);
                this.showNotification(`AI Crisis: ${data.narrative.headline || data.narrative.event}`);
            } else {
                this.generateFallbackCrisis(newsStory);
            }
        } catch (error) {
            console.error('AI Narrative Fetch Error:', error);
            this.generateFallbackCrisis(newsStory);
        }
    }

    applyNarrative(narrative, generationType) {
        if (generationType === 'scandal') {
            this.chaos += narrative.impacts.chaos || 0;
            this.energy += narrative.impacts.energy || 0;
            this.score += narrative.impacts.score || 0;
            narrative.impacts.relationships.forEach(rel => {
                const target = this.relationships.find(r => r.name === rel.name);
                if (target) {
                    target.trust = Math.max(0, Math.min(100, target.trust + (rel.trust || 0)));
                    target.respect = Math.max(0, Math.min(100, target.respect + (rel.respect || 0)));
                    target.fear = Math.max(0, Math.min(100, target.fear + (rel.fear || 0)));
                }
            });
            this.history.scandals.push(narrative);
        } else if (generationType === 'diplomaticTwist') {
            this.currentCrisis = {
                event: narrative.event,
                options: narrative.options,
                outcomes: narrative.outcomes
            };
            this.updateCrisisPanel();
        }
        this.updateDisplay();
        this.displayRelationships();
    }

    generateFallbackCrisis(newsStory) {
        const crisis = {
            headline: `Fallback: ${newsStory.headline}`,
            description: 'A generic crisis based on news.',
            impacts: { chaos: 10, energy: -5, score: -10, relationships: [] }
        };
        this.applyNarrative(crisis, 'scandal');
    }

    async generateNewsBasedCrisis(topStory) {
        if (Math.random() < 0.5) {
            await this.generateAINarrative(topStory, 'scandal');
        } else {
            await this.generateAINarrative(topStory, 'diplomaticTwist');
        }
    }

    updateCrisisPanel() {
        const panel = document.getElementById('crisisPanel');
        if (this.currentCrisis) {
            panel.innerHTML = `
                <h3>${this.currentCrisis.event}</h3>
                <div class="crisis-options">
                    ${this.currentCrisis.options.map((opt, i) => `
                        <button class="response-btn" onclick="game.handleCrisisOption(${i})">${opt}</button>
                    `).join('')}
                </div>
                <button class="response-btn" onclick="game.startPressConference()">Hold Press Conference</button>
            `;
        } else {
            panel.innerHTML = `
                <h3>Crisis Loading...</h3>
                <p>Preparing situation...</p>
                <button class="response-btn" onclick="game.startPressConference()">Hold Press Conference</button>
            `;
        }
    }

    handleCrisisOption(index) {
        const outcome = this.currentCrisis.outcomes[index];
        this.chaos += outcome.chaos || 0;
        this.energy += outcome.energy || 0;
        this.score += outcome.score || 0;
        outcome.relationships.forEach(rel => {
            const target = this.relationships.find(r => r.name === rel.name);
            if (target) {
                target.trust = Math.max(0, Math.min(100, target.trust + (rel.trust || 0)));
                target.respect = Math.max(0, Math.min(100, target.respect + (rel.respect || 0)));
                target.fear = Math.max(0, Math.min(100, target.fear + (rel.fear || 0)));
            }
        });
        this.history.decisions.push({ event: this.currentCrisis.event, option: this.currentCrisis.options[index], outcome });
        this.showNotification(`Decision made: ${outcome.chaos > 0 ? 'Chaos rises!' : 'Situation stabilized!'}`);
        this.currentCrisis = null;
        this.updateDisplay();
        this.displayRelationships();
        this.updateCrisisPanel();
    }
}

console.log('President Simulator - Total Chaos Edition loaded successfully');

window.startPresidency = startPresidency;