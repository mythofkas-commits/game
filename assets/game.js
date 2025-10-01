/*
=============================================================================
PRESIDENT SIMULATOR - TOTAL CHAOS EDITION
Smart Twitter Algorithm + Adaptive Crisis System
Place this file at: assets/game.js
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

        // UPDATED POLITICIANS (2025)
        this.relationships = [
            {
                name: 'Chuck Schumer',
                trust: 30,
                respect: 40,
                fear: 20,
                role: 'Senate Majority Leader',
                personality: 'strategic',
                lastInteraction: null,
                history: [],
                currentIssues: ['budget', 'healthcare']
            },
            {
                name: 'John Thune',
                trust: 60,
                respect: 50,
                fear: 10,
                role: 'Senate GOP Leader',
                personality: 'calculating',
                lastInteraction: null,
                history: [],
                currentIssues: ['taxes', 'judges']
            },
            {
                name: 'Mike Johnson',
                trust: 55,
                respect: 45,
                fear: 15,
                role: 'House Speaker',
                personality: 'ideological',
                lastInteraction: null,
                history: [],
                currentIssues: ['spending', 'border']
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
                name: 'Keir Starmer',
                trust: 65,
                respect: 50,
                fear: 5,
                role: 'UK Prime Minister',
                personality: 'pragmatic',
                lastInteraction: null,
                history: [],
                currentIssues: ['brexit', 'trade', 'nato']
            }
        ];

        this.reporters = [
            { name: 'Jim Acosta', outlet: 'CNN', mood: 'hostile', trust: 20, specialty: 'scandal' },
            { name: 'Peter Doocy', outlet: 'Fox News', mood: 'friendly', trust: 80, specialty: 'economy' },
            { name: 'Yamiche Alcindor', outlet: 'PBS', mood: 'neutral', trust: 50, specialty: 'policy' },
            { name: 'April Ryan', outlet: 'The Grio', mood: 'hostile', trust: 30, specialty: 'social' }
        ];

        this.currentReporter = null;
        this.currentCrisis = null;
        this.scandalActive = false;
        this.scandalInterval = null;
        this.currentCaller = null;
        this.gameInterval = null;
        this.newsInterval = null;
        this.lastNewsFetch = 0;
        this.pendingCascades = [];
        this.respondingToCrisis = false; // Track if responding to crisis via tweet
        
        this.debug = new URLSearchParams(location.search).has('debug');
        this.crisisAIEligibleCount = Number(localStorage.getItem('aiEligibleCount') || 0);
        this.aiShadowMode = true;
        this.aiMinDecisions = 4;
        this.aiMinCategoryDiversity = 3;
        this.aiSchemaPassStreak = 0;
        this.aiSchemaPassTarget = 3;
        this.aiUsed = false;

        function mulberry32(a) {
            return function () {
                a |= 0;
                a = a + 0x6D2B79F5 | 0;
                let t = Math.imul(a ^ a >>> 15, 1 | a);
                t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            };
        }
        this.rand = this.debug ? mulberry32(Number(localStorage.getItem('seed') || 1234)) : Math.random;

        this.now = () => (this.debug && this._t != null) ? this._t : Date.now();

        // Analytics tracking
        const randomId = this.debug ? this.rand() : Math.random();
        this.sessionId = Date.now() + '-' + randomId.toString(36).substr(2, 9);
        this.sessionStart = Date.now();
        this.analytics = {
            events: [],
            decisions: [],
            tweets: [],
            powerChanges: [],
            crises: []
        };
    }

    // ============= ANALYTICS TRACKING =============

    trackEvent(eventType, data = {}) {
        const event = {
            type: eventType,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            gameState: {
                day: this.day,
                energy: this.energy,
                chaos: this.chaos,
                score: this.score
            },
            ...data
        };

        this.analytics.events.push(event);
        
        // Save to localStorage for admin dashboard
        this.saveAnalytics();
        
        console.log(`📊 Event tracked: ${eventType}`, data);
    }

    saveAnalytics() {
        try {
            // Get existing analytics
            const existing = JSON.parse(localStorage.getItem('presidentAnalytics') || '{"sessions": []}');

            // Find or create current session
            let session = existing.sessions.find(s => s.sessionId === this.sessionId);
            if (!session) {
                session = {
                    sessionId: this.sessionId,
                    startTime: this.sessionStart,
                    events: [],
                    finalState: null
                };
                existing.sessions.push(session);
            }
            
            // Update session
            session.events = this.analytics.events;
            session.lastUpdate = Date.now();
            session.duration = Date.now() - this.sessionStart;
            session.finalState = {
                day: this.day,
                energy: this.energy,
                chaos: this.chaos,
                score: this.score,
                powerCenters: this.powerCenters.map(p => ({ id: p.id, value: p.value }))
            };
            
            // Keep only last 50 sessions
            if (existing.sessions.length > 50) {
                existing.sessions = existing.sessions.slice(-50);
            }
            
            localStorage.setItem('presidentAnalytics', JSON.stringify(existing));
        } catch (e) {
            console.warn('Failed to save analytics:', e);
        }
    }

    saveAICounter() {
        try {
            localStorage.setItem('aiEligibleCount', String(this.crisisAIEligibleCount));
        } catch {
            // ignore storage failures
        }
    }

    logDebug(...args) {
        if (this.debug) console.debug('[DBG]', ...args);
    }

    knownPowerCentersSet() {
        return new Set((this.powerCenters || []).map(p => p.id));
    }

    getPlayerContextForAI() {
        return {
            chaos: this.chaos,
            energy: this.energy,
            relationships: Object.fromEntries((this.powerCenters || []).map(pc => [pc.id, pc.value])),
            history: (this.history?.decisions || []).slice(-20).map(d => ({
                event: d.title || d.action || 'decision',
                category: d.category || d.type || 'unknown',
                delta: { chaos: d.chaos || 0, energy: -(d.energy || 0) }
            }))
        };
    }

    aiReady() {
        const decisions = (this.history?.decisions || []).length;
        const categories = new Set((this.history?.decisions || []).map(d => d.category || d.type || 'unknown')).size;
        return decisions >= this.aiMinDecisions
            && categories >= this.aiMinCategoryDiversity
            && this.aiSchemaPassStreak >= this.aiSchemaPassTarget;
    }

    installDebugOverlay() {
        if (!this.debug || document.getElementById('debugPane')) return;
        const pane = document.createElement('div');
        pane.id = 'debugPane';
        Object.assign(pane.style, {
            position: 'fixed',
            right: '8px',
            bottom: '8px',
            width: '360px',
            maxHeight: '50vh',
            overflow: 'auto',
            background: 'rgba(0,0,0,0.85)',
            color: '#0f0',
            fontFamily: 'monospace',
            fontSize: '12px',
            padding: '8px',
            border: '1px solid #333',
            zIndex: 99999
        });
        pane.innerHTML = '<div style="color:#9f9">debug on</div><pre id="debugLog"></pre>';
        document.body.appendChild(pane);
    }

    debugTrace(title, payload) {
        if (!this.debug) return;
        if (!document.getElementById('debugPane')) this.installDebugOverlay();
        const pre = document.getElementById('debugLog');
        if (pre) pre.textContent =
            `[${new Date().toLocaleTimeString()}] ${title}\n` +
            `${JSON.stringify(payload, null, 2)}\n\n` +
            pre.textContent.slice(0, 20000);
    }

    snapshotState() {
        return {
            chaos: this.chaos,
            energy: this.energy,
            power: Object.fromEntries(this.powerCenters.map(p => [p.id, p.value]))
        };
    }

    diffStates(a, b) {
        const d = {};
        if (a.chaos !== b.chaos) d.chaos = [a.chaos, b.chaos];
        if (a.energy !== b.energy) d.energy = [a.energy, b.energy];
        const power = {};
        for (const k of Object.keys(a.power)) {
            if (a.power[k] !== b.power[k]) power[k] = [a.power[k], b.power[k]];
        }
        if (Object.keys(power).length) d.power = power;
        return d;
    }

    explainDisabled(btn, reason) {
        if (!btn) return;
        btn.setAttribute('title', reason);
        btn.dataset.disabledReason = reason;
    }

    async fetchJson(url, init) {
        if (this.debug && url.includes('/api/ai-narrative')) {
            return {
                narrative: {
                    headline: 'Test Narrative',
                    description: 'stub',
                    impacts: {
                        chaos: -2,
                        energy: 5,
                        relationships: [{ center: 'media', change: 1 }]
                    }
                }
            };
        }
        const res = await fetch(url, init);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }

    async fetchAINarrative({ headline, generationType }) {
        const body = {
            playerContext: this.getPlayerContextForAI(),
            newsHeadline: headline,
            generationType
        };

        const attempt = async () => {
            if (typeof this.fetchJson === 'function') {
                return this.fetchJson('/api/ai-narrative', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            }
            const res = await fetch('/api/ai-narrative', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('ai-narrative ' + res.status);
            return res.json();
        };

        let resp;
        try {
            resp = await attempt();
        } catch (err) {
            if (typeof this.debugTrace === 'function') {
                this.debugTrace('AI narrative fetch failed (first attempt)', { error: String(err) });
            } else {
                console.debug('AI narrative fetch failed (first attempt):', err);
            }
            // Exponential backoff: wait 500ms before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
            // Log the first error at debug level
            if (typeof this.debugTrace === 'function') {
                this.debugTrace('AI narrative fetch error (first attempt)', { error: String(err), stack: err?.stack });
            }
            // Check if error is transient (network or 5xx)
            let shouldRetry = false;
            if (err && typeof err === 'object') {
                // If error is from fetchJson or fetch, check status
                if (err.message && /ai-narrative (\d+)/.test(err.message)) {
                    const status = Number(err.message.match(/ai-narrative (\d+)/)[1]);
                    if (status >= 500 && status < 600) {
                        shouldRetry = true;
                    }
                } else if (err.name === 'TypeError' || err.message?.includes('NetworkError')) {
                    // Network error
                    shouldRetry = true;
                }
            }
            if (shouldRetry) {
                // Basic backoff before retrying
                await new Promise(res => setTimeout(res, 500));
                try {
                    resp = await attempt();
                } catch (err2) {
                    if (typeof this.debugTrace === 'function') {
                        this.debugTrace('AI narrative fetch error (second attempt)', { error: String(err2), stack: err2?.stack });
                    }
                    throw err2;
                }
            } else {
                throw err;
            }
        }

        if (!resp || !resp.narrative) {
            const keys = resp && typeof resp === 'object' ? Object.keys(resp) : [];
            let snippet = '';
            try {
                snippet = JSON.stringify(resp, null, 2).slice(0, 200);
            } catch (e) {
                snippet = String(resp);
            }
            throw new Error(
                `Bad AI payload: missing narrative (keys: ${keys.join(', ')})\nPayload snippet: ${snippet}`
            );
        }

        const n = resp.narrative;
        const impacts = n.impacts || n.impact || {};
        const toNum = value => {
            const num = Number(value);
            return Number.isFinite(num) ? num : NaN;
        };

        const chaos = toNum(impacts.chaos ?? impacts.chaosDelta ?? 0);
        const energy = toNum(impacts.energy ?? impacts.energyDelta ?? 0);
        if (!Number.isFinite(chaos) || !Number.isFinite(energy)) throw new Error('Non-numeric chaos/energy');

        let relationships = impacts.relationships || impacts.relationshipsDelta || [];
        if (!Array.isArray(relationships) && relationships && typeof relationships === 'object') {
            relationships = Object.entries(relationships).map(([center, change]) => ({ center, change }));
        }

        return {
            title: n.headline || n.title || 'Policy Response',
            description: n.description || n.body || '',
            impacts: { chaos, energy, relationships }
        };
    }

    translateAINarrativeToOption(ai) {
        const known = this.knownPowerCentersSet();
        const rel = Array.isArray(ai.impacts.relationships) ? ai.impacts.relationships : [];
        const effects = [];
        const unknowns = [];
        for (const entry of rel) {
            if (!entry || typeof entry.center !== 'string') continue;
            const trimmed = String(entry.center).trim();
            if (!trimmed) continue;
            const centerId = trimmed.toLowerCase();
            const change = Number(entry.change || 0);
            if (!Number.isFinite(change) || change === 0) continue;
            if (known.has(centerId)) {
                effects.push({ center: centerId, change });
            } else {
                unknowns.push(trimmed);
            }
        }
        if (unknowns.length) console.warn('AI returned unknown centers:', unknowns);

        const chaosValue = Number(ai.impacts.chaos || 0);
        const chaos = Number.isFinite(chaosValue) ? chaosValue : 0;
        const energyRaw = Number(ai.impacts.energy || 0);
        const energy = Number.isFinite(energyRaw) ? energyRaw : 0;
        const text = typeof ai.title === 'string' && ai.title.trim() ? ai.title.trim() : 'AI Response';

        return {
            text,
            effects,
            chaos,
            energy
        };
    }

    assert(cond, msg) {
        if (!cond) {
            throw new Error('Invariant: ' + msg);
        }
    }

    async init() {
        // Show loading screen
        this.showLoadingScreen();
        
        this.updateDisplay();
        this.displayPowerCenters();
        this.displayRelationships();
        this.setupReporters();
        this.setupTwitterInput();
        
        // Wait for REAL news to load (no mock news)
        await this.fetchRealPoliticalNews();
        
        // If we have news, hide loading and start game
        if (this.currentNewsStories.length > 0) {
            this.hideLoadingScreen();
            setTimeout(() => this.generateContextualCrisis(), 500);
        } else {
            // If news failed, show error
            this.showLoadingError();
        }

        this.gameInterval = setInterval(() => this.gameLoop(), 5000);
        this.newsInterval = setInterval(() => this.checkForNewsUpdate(), 600000);

        // Track game start for analytics
        this.trackEvent('game_started');

        if (this.debug) this.installDebugOverlay();

        const origHandleDecision = this.handleDecision.bind(this);
        this.handleDecision = (option) => {
            const before = this.snapshotState();
            this.debugTrace('handleDecision:before', { option });
            try {
                return origHandleDecision(option);
            } finally {
                const delta = this.diffStates(before, this.snapshotState());
                if (!Object.keys(delta).length) {
                    this.debugTrace('no effect detected', { option });
                } else {
                    this.debugTrace('handleDecision:after', delta);
                }
            }
        };
    }

    showLoadingError() {
        const loading = document.getElementById('loadingScreen');
        if (loading) {
            loading.innerHTML = `
                <div class="loading-content">
                    <h2 style="color: #ff0000; margin: 20px 0;">⚠️ Failed to Load News</h2>
                    <p style="color: #ddd;">Unable to fetch political news. Please check your connection.</p>
                    <button class="start-presidency-btn" onclick="location.reload()" style="margin-top: 20px;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    showLoadingScreen() {
        const loading = document.createElement('div');
        loading.id = 'loadingScreen';
        loading.className = 'loading-screen';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <h2 style="color: #ffd700; margin: 20px 0;">Loading Your Presidency</h2>
                <p style="color: #ddd;">Fetching real-time political news from around the world...</p>
                <p style="color: #aaa; font-size: 14px; margin-top: 10px;">Initializing power centers and crisis systems</p>
            </div>
        `;
        document.body.appendChild(loading);
    }

    hideLoadingScreen() {
        const loading = document.getElementById('loadingScreen');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.remove(), 500);
        }
    }

    setupTwitterInput() {
        const input = document.getElementById('tweetInput');
        
        // Add Enter key handler: Enter = send, Shift+Enter = new line
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendTweet();
            }
        });
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
            coalitionEl.className = 'coalition-status coalition-warning';
        } else if (allies.length >= 3) {
            coalitionEl.innerHTML = `✅ <strong>Strong Coalition:</strong> ${allies.map(a => a.icon).join(' ')}`;
            coalitionEl.className = 'coalition-status coalition-positive';
        } else {
            coalitionEl.innerHTML = '📊 Political Balance Maintained';
            coalitionEl.className = 'coalition-status';
        }
    }

    // ============= SMART TWITTER ALGORITHM =============

    sendTweet() {
        const input = document.getElementById('tweetInput');
        const content = input.value.trim();

        if (!content) {
            this.showNotification('❌ Tweet is empty!');
            return;
        }

        // Analyze the tweet
        const analysis = this.analyzeTweet(content);

        // Track tweet
        this.trackEvent('tweet_sent', {
            content,
            tone: analysis.tone,
            chaos: analysis.chaos,
            targets: analysis.targets,
            warnings: analysis.warnings
        });

        this.history.tweets.push({
            content,
            analysis,
            timestamp: Date.now()
        });

        // Apply effects to power centers
        Object.entries(analysis.powerEffects).forEach(([centerId, change]) => {
            if (Math.abs(change) > 0) {
                this.updatePowerCenter(centerId, change, 'Your tweet');
            }
        });

        // Apply game effects
        this.chaos = Math.min(100, this.chaos + analysis.chaos);
        this.energy -= analysis.energyCost;
        

        input.value = '';
        
        // Show detailed feedback
        this.showTweetFeedback(analysis);
        this.updateDisplay();

        // If responding to crisis or breaking news, dismiss it
        if (this.respondingToCrisis) {
            this.respondingToCrisis = false;
            
            // Dismiss breaking news modal if present
            const modal = document.querySelector('.breaking-news-modal');
            if (modal) modal.remove();
            
            // Generate next crisis
            setTimeout(() => {
                if (this.currentNewsStories.length > 0) {
                    const randomNews = this.currentNewsStories[Math.floor(this.rand() * this.currentNewsStories.length)];
                    this.generateAdaptiveCrisis(randomNews);
                } else {
                    this.generateContextualCrisis();
                }
            }, 2000);
        }
    }

    analyzeTweet(tweet) {
        const lower = tweet.toLowerCase();
        const analysis = {
            tone: 'neutral',
            targets: [],
            keywords: [],
            powerEffects: {},
            chaos: 5,
            energyCost: 5,
            warnings: []
        };

        // TONE DETECTION
        const aggressiveWords = ['attack', 'destroy', 'enemy', 'war', 'fight', 'crush', 'annihilate', 'terrible', 'disaster', 'pathetic', 'loser', 'worst'];
        const diplomaticWords = ['cooperate', 'together', 'discuss', 'solution', 'partnership', 'dialogue', 'understanding', 'respect'];
        const profanity = ['damn', 'hell', 'crap', 'shit', 'fuck', 'ass'];

        let aggressiveScore = 0;
        let diplomaticScore = 0;

        aggressiveWords.forEach(word => {
            if (lower.includes(word)) aggressiveScore++;
        });
        diplomaticWords.forEach(word => {
            if (lower.includes(word)) diplomaticScore++;
        });

        if (aggressiveScore > diplomaticScore) {
            analysis.tone = 'aggressive';
            analysis.chaos += 15;
            analysis.powerEffects.military = 10;
            analysis.powerEffects.media = -10;
            analysis.powerEffects.public = 15;
        } else if (diplomaticScore > aggressiveScore) {
            analysis.tone = 'diplomatic';
            analysis.chaos -= 5;
            analysis.powerEffects.congress = 10;
            analysis.powerEffects.media = 8;
            analysis.powerEffects.military = -5;
        }

        // PROFANITY CHECK
        profanity.forEach(word => {
            if (lower.includes(word)) {
                analysis.chaos += 20;
                analysis.powerEffects.media = (analysis.powerEffects.media || 0) - 15;
                analysis.powerEffects.public = (analysis.powerEffects.public || 0) + 10;
                analysis.warnings.push('Profanity increased chaos!');
            }
        });

        // ALL CAPS CHECK
        if (tweet === tweet.toUpperCase() && tweet.length > 10) {
            analysis.chaos += 10;
            analysis.powerEffects.public = (analysis.powerEffects.public || 0) + 8;
            analysis.warnings.push('ALL CAPS = Maximum engagement!');
        }

        // TARGET DETECTION
        if (lower.match(/media|press|fake news|cnn|fox|nbc|reporters?/)) {
            analysis.targets.push('media');
            analysis.powerEffects.media = (analysis.powerEffects.media || 0) - 15;
            analysis.powerEffects.public = (analysis.powerEffects.public || 0) + 10;
            analysis.chaos += 10;
        }

        if (lower.match(/congress|senate|house|legislat/)) {
            analysis.targets.push('congress');
            analysis.powerEffects.congress = (analysis.powerEffects.congress || 0) - 10;
        }

        if (lower.match(/china|chinese|xi|beijing/)) {
            analysis.targets.push('china');
            analysis.powerEffects.wallstreet = (analysis.powerEffects.wallstreet || 0) - 10;
            analysis.powerEffects.military = (analysis.powerEffects.military || 0) + 5;
            analysis.chaos += 15;
        }

        if (lower.match(/russia|russian|putin|moscow/)) {
            analysis.targets.push('russia');
            analysis.powerEffects.intelligence = (analysis.powerEffects.intelligence || 0) + 5;
            analysis.powerEffects.military = (analysis.powerEffects.military || 0) + 5;
            analysis.chaos += 10;
        }

        if (lower.match(/market|stock|economy|wall street|dow/)) {
            analysis.targets.push('markets');
            if (analysis.tone === 'aggressive') {
                analysis.powerEffects.wallstreet = (analysis.powerEffects.wallstreet || 0) - 15;
                analysis.warnings.push('Markets don\'t like uncertainty!');
            } else {
                analysis.powerEffects.wallstreet = (analysis.powerEffects.wallstreet || 0) + 5;
            }
        }

        // SPECIAL PATTERNS
        if (lower.match(/fake news/)) {
            analysis.powerEffects.media = (analysis.powerEffects.media || 0) - 20;
            analysis.powerEffects.public = (analysis.powerEffects.public || 0) + 15;
            analysis.chaos += 15;
            analysis.warnings.push('"Fake news" enrages media!');
        }

        if (lower.match(/witch hunt/)) {
            analysis.powerEffects.media = (analysis.powerEffects.media || 0) - 10;
            analysis.powerEffects.public = (analysis.powerEffects.public || 0) + 10;
            analysis.chaos += 10;
        }

        // EMOJI CHECK
        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        if (emojiRegex.test(tweet)) {
            analysis.powerEffects.public = (analysis.powerEffects.public || 0) + 5;
            analysis.warnings.push('Emojis increase public appeal!');
        }

        // LENGTH CHECK
        if (tweet.length > 200) {
            analysis.energyCost += 5;
            analysis.warnings.push('Long tweet = more effort');
        }

        // SPELLING/TYPO CHECK (intentional)
        const commonTypos = ['covfefe', 'unpresidented', 'hamberder', 'smocking'];
        commonTypos.forEach(typo => {
            if (lower.includes(typo)) {
                analysis.powerEffects.media = (analysis.powerEffects.media || 0) - 10;
                analysis.powerEffects.public = (analysis.powerEffects.public || 0) + 5;
                analysis.chaos += 5;
                analysis.warnings.push('Typo goes viral!');
            }
        });

        return analysis;
    }

    showTweetFeedback(analysis) {
        const feedback = document.createElement('div');
        feedback.className = 'tweet-feedback';
        
        let feedbackHTML = `<strong>Tweet Analysis:</strong><br>`;
        feedbackHTML += `Tone: ${analysis.tone.toUpperCase()} | Chaos: +${analysis.chaos}<br>`;
        
        if (analysis.warnings.length > 0) {
            feedbackHTML += `⚠️ ${analysis.warnings.join(' ')}<br>`;
        }
        
        const significantEffects = Object.entries(analysis.powerEffects)
            .filter(([_, val]) => Math.abs(val) >= 5)
            .map(([center, val]) => {
                const c = this.powerCenters.find(p => p.id === center);
                return c ? `${c.icon} ${val > 0 ? '+' : ''}${val}` : '';
            })
            .filter(s => s);
        
        if (significantEffects.length > 0) {
            feedbackHTML += `Impact: ${significantEffects.join(', ')}`;
        }

        feedback.innerHTML = feedbackHTML;
        document.getElementById('tweetFeedback').appendChild(feedback);

        setTimeout(() => feedback.remove(), 5000);
    }

    focusTwitter() {
        this.respondingToCrisis = true; // Mark that we're responding via tweet
        const input = document.getElementById('tweetInput');
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ============= NEWS SYSTEM (SHOW ALL) =============

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

            // Merge with existing stories and deduplicate
            const allStories = [...this.currentNewsStories, ...newsStories];
            this.currentNewsStories = this.deduplicateNews(allStories);
            
            this.cacheNews(this.currentNewsStories);
            this.displayNewsTicker();
            this.lastNewsFetch = Date.now();

            // Trigger breaking news for high relevance
            const breakingNews = this.currentNewsStories.filter(s => s.relevance > 0.75);
            if (breakingNews.length > 0 && this.rand() < 0.4) {
                setTimeout(() => this.triggerBreakingNews(breakingNews[0]), 2000);
            }

            console.log('✅ Fetched', newsStories.length, 'new stories from NewsAPI');
            
        } catch (error) {
            console.error('News fetch failed:', error);
            await this.fetchRSSNews();
        }
    }

    async fetchRSSNews() {
        try {
            const feeds = ['bbc', 'nyt'];
            const randomFeed = feeds[Math.floor(this.rand() * feeds.length)];
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

            // Merge with existing and deduplicate
            const allStories = [...this.currentNewsStories, ...newsStories];
            this.currentNewsStories = this.deduplicateNews(allStories);
            
            this.cacheNews(this.currentNewsStories);
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
        const categories = [];
        let primaryCategory = 'domestic';
        let maxScore = 0;

        // Define category patterns with weighted scoring
        const patterns = {
            foreign: {
                keywords: ['china', 'russia', 'ukraine', 'nato', 'foreign', 'diplomat', 'putin', 'xi', 'taiwan', 'iran', 'north korea', 'israel', 'palestine', 'embassy', 'ambassador', 'treaty', 'alliance', 'invasion', 'sovereignty'],
                weight: 2
            },
            military: {
                keywords: ['military', 'pentagon', 'defense', 'war', 'troops', 'army', 'navy', 'air force', 'marines', 'soldier', 'combat', 'missile', 'weapon', 'aircraft', 'deployment', 'operation'],
                weight: 2
            },
            economy: {
                keywords: ['market', 'economy', 'inflation', 'fed', 'unemployment', 'stock', 'trade', 'tariff', 'gdp', 'recession', 'growth', 'interest rate', 'dollar', 'jobs', 'fiscal', 'monetary', 'wall street', 'dow', 'nasdaq'],
                weight: 1.5
            },
            scandal: {
                keywords: ['scandal', 'investigation', 'corruption', 'resign', 'indict', 'probe', 'allegation', 'impeach', 'fraud', 'bribery', 'misconduct', 'ethics', 'lawsuit', 'charges'],
                weight: 2
            },
            healthcare: {
                keywords: ['healthcare', 'medicare', 'medicaid', 'drug', 'pharma', 'hospital', 'insurance', 'obamacare', 'affordable care', 'prescription', 'medical', 'doctor', 'patient'],
                weight: 1.5
            },
            climate: {
                keywords: ['climate', 'environment', 'carbon', 'emissions', 'renewable', 'fossil fuel', 'epa', 'pollution', 'global warming', 'green energy', 'solar', 'wind'],
                weight: 1.5
            },
            immigration: {
                keywords: ['immigration', 'border', 'refugee', 'asylum', 'migrant', 'deportation', 'visa', 'citizenship', 'daca', 'ice'],
                weight: 1.5
            },
            technology: {
                keywords: ['tech', 'technology', 'cyber', 'ai', 'artificial intelligence', 'data', 'privacy', 'security', 'hack', 'silicon valley', 'social media', 'facebook', 'google', 'amazon', 'apple'],
                weight: 1
            }
        };

        // Calculate scores for each category
        for (const [category, data] of Object.entries(patterns)) {
            let score = 0;
            for (const keyword of data.keywords) {
                if (text.includes(keyword)) {
                    score += data.weight;
                }
            }
            
            if (score > 0) {
                categories.push({ category, score });
            }
            
            if (score > maxScore) {
                maxScore = score;
                primaryCategory = category;
            }
        }

        // If no strong match, check for general domestic indicators
        if (maxScore < 2) {
            if (text.match(/congress|senate|house|legislation|bill|vote|law/)) {
                primaryCategory = 'domestic';
            }
        }

        console.log(`📊 Categorized: "${title.substring(0, 50)}..." as ${primaryCategory} (score: ${maxScore.toFixed(1)})`);
        
        return primaryCategory;
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

        // Deduplicate before displaying
        const uniqueStories = this.deduplicateNews(this.currentNewsStories);

        uniqueStories.forEach(story => {
            const item = document.createElement('span');
            item.className = 'news-item';
            
            // Add emoji badge based on relevance
            const badge = story.relevance > 0.75 ? '🔥' : 
                         story.relevance > 0.5 ? '⚡' : '📰';
            
            item.innerHTML = `${badge} [${story.source}] ${story.headline}`;
            item.onclick = () => this.respondToNews(story);
            ticker.appendChild(item);
        });

        console.log(`📰 Showing ${uniqueStories.length} unique stories (filtered from ${this.currentNewsStories.length})`);
    }

    // ============= INTELLIGENT NEWS DEDUPLICATION =============

    deduplicateNews(stories) {
        if (stories.length === 0) return stories;

        const TWO_HOURS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        const SIMILARITY_THRESHOLD = 0.6; // 60% overlap = duplicate

        // Sort by timestamp (newest first) and relevance
        const sorted = [...stories].sort((a, b) => {
            if (Math.abs(a.timestamp - b.timestamp) < 60000) {
                return b.relevance - a.relevance; // If same time, prefer higher relevance
            }
            return b.timestamp - a.timestamp;
        });

        const unique = [];
        const seen = new Set();

        for (const story of sorted) {
            let isDuplicate = false;

            // Only compare with stories in the same time window
            for (const existingStory of unique) {
                const timeDiff = Math.abs(story.timestamp - existingStory.timestamp);
                
                if (timeDiff <= TWO_HOURS) {
                    const similarity = this.calculateHeadlineSimilarity(
                        story.headline, 
                        existingStory.headline
                    );

                    if (similarity >= SIMILARITY_THRESHOLD) {
                        isDuplicate = true;
                        console.log(`🔄 Duplicate found: "${story.headline}" ≈ "${existingStory.headline}" (${Math.round(similarity * 100)}% similar)`);
                        break;
                    }
                }
            }

            if (!isDuplicate) {
                unique.push(story);
                seen.add(story.headline);
            }
        }

        return unique;
    }

    calculateHeadlineSimilarity(headline1, headline2) {
        // Extract significant words (entities and actions)
        const words1 = this.extractSignificantWords(headline1);
        const words2 = this.extractSignificantWords(headline2);

        if (words1.length === 0 || words2.length === 0) return 0;

        // Calculate overlap
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        
        let overlap = 0;
        set1.forEach(word => {
            if (set2.has(word)) overlap++;
        });

        // Calculate similarity as percentage of overlap
        const similarity = overlap / Math.max(set1.size, set2.size);

        return similarity;
    }

    extractSignificantWords(headline) {
        // Common stop words to ignore
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'could', 'should', 'may', 'might', 'can', 'about', 'over',
            'after', 'before', 'during', 'between', 'through', 'into', 'out'
        ]);

        // Important entities and action words
        const importantWords = new Set([
            'china', 'russia', 'taiwan', 'ukraine', 'iran', 'israel', 'north korea',
            'biden', 'trump', 'putin', 'xi', 'congress', 'senate', 'house',
            'threatens', 'warns', 'announces', 'proposes', 'condemns', 'attacks',
            'invades', 'sanctions', 'imposes', 'passes', 'rejects', 'approves',
            'military', 'economic', 'trade', 'war', 'deal', 'agreement', 'crisis',
            'scandal', 'investigation', 'impeachment', 'election', 'vote'
        ]);

        const words = headline.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/)
            .filter(word => {
                // Keep if: not a stop word AND (length > 4 OR in important words)
                return !stopWords.has(word) && (word.length > 4 || importantWords.has(word));
            });

        return words;
    }

    respondToNews(story) {
        console.log('📰 Responding to:', story.headline);
        this.generateAdaptiveCrisis(story);
        this.showNotification(`⚡ ${story.headline.substring(0, 60)}...`);
    }

    // ============= ADAPTIVE CRISIS GENERATION =============

    async generateAdaptiveCrisis(story) {
        try {
            const headline = (story && story.headline) || 'Developing situation';
            const desc = (story && story.description) || 'Urgent developments require a response.';
            const category = (story && story.category) || 'domestic';
            const lower = headline.toLowerCase();
            const generationType =
                (lower.includes('scandal') || lower.includes('probe') || lower.includes('leak') || category === 'domestic')
                    ? 'scandal'
                    : 'diplomaticTwist';

            const resolveAffectedCenters = () => {
                if (Array.isArray(story?.affectedCenters) && story.affectedCenters.length > 0) {
                    return story.affectedCenters;
                }
                if (typeof this.identifyAffectedCenters === 'function') {
                    const inferred = this.identifyAffectedCenters(headline, desc);
                    if (Array.isArray(inferred) && inferred.length) {
                        return inferred;
                    }
                }
                return this.guessAffectedCenters(category);
            };

            const buildHandcrafted = () => {
                const affectedCenters = resolveAffectedCenters();
                return {
                    newsStory: story,
                    title: `URGENT: ${headline}`,
                    description: this.generateCrisisDescription(story, affectedCenters),
                    affectedCenters,
                    options: this.generateAdaptiveOptions(story, affectedCenters)
                };
            };

            let aiOption = null;
            let aiValid = false;
            try {
                const ai = await this.fetchAINarrative({ headline, generationType });
                aiOption = this.translateAINarrativeToOption(ai);
                aiValid = (Array.isArray(aiOption.effects) && aiOption.effects.length > 0)
                    || (aiOption.chaos !== 0 || aiOption.energy !== 0);
                this.aiSchemaPassStreak = aiValid ? this.aiSchemaPassStreak + 1 : 0;
            } catch (err) {
                console.warn('AI narrative error (shadow):', err);
                this.aiSchemaPassStreak = 0;
            }

            const ready = this.aiReady();
            let crisis = null;
            let usedAI = false;

            if (ready && aiValid) {
                const affectedCenters = resolveAffectedCenters();
                crisis = {
                    newsStory: story,
                    title: `URGENT: ${headline}`,
                    description: this.generateCrisisDescription(story, affectedCenters),
                    affectedCenters,
                    options: [aiOption]
                };
                usedAI = true;
                this.aiUsed = true;
            } else {
                crisis = buildHandcrafted();
                if ((!crisis.options || crisis.options.length === 0) && aiValid) {
                    const fallbackCenters = resolveAffectedCenters();
                    crisis = {
                        newsStory: story,
                        title: `URGENT: ${headline}`,
                        description: this.generateCrisisDescription(story, fallbackCenters),
                        affectedCenters: fallbackCenters,
                        options: [aiOption]
                    };
                    usedAI = true;
                    this.aiUsed = true;
                }
            }

            if (!crisis) return;

            this.aiShadowMode = !usedAI;

            this.currentCrisis = crisis;
            if (typeof this.displayCrisis === 'function') {
                this.displayCrisis();
            }

            const eventData = {
                headline,
                category,
                affectedCenters: crisis.affectedCenters,
                source: story?.source || 'news',
                usedAI,
                aiSchemaPassStreak: this.aiSchemaPassStreak
            };
            if (typeof this.trackEvent === 'function') {
                this.trackEvent('crisis_generated', eventData);
            }
        } catch (err) {
            console.error('generateAdaptiveCrisis error:', err);
        }
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

    generateAdaptiveOptions(story, affectedCenters) {
        const options = [];
        const category = story.category || 'domestic';
        const headline = (story.headline || '').toLowerCase();

        console.log(`🎮 Generating options for: "${story.headline}" (Category: ${category})`);

        // Option 1: Context-specific aggressive response
        if (category === 'foreign') {
            const aggressiveText = headline.includes('china') ? '🚢 Deploy Naval Forces' : 
                                   headline.includes('russia') ? '🎯 Increase Sanctions' :
                                   headline.includes('iran') ? '⚔️ Military Threat' :
                                   '💪 Show Military Strength';
            
            options.push({
                text: aggressiveText,
                effects: affectedCenters.map(id => {
                    if (id === 'military') return { center: id, change: 15 };
                    if (id === 'wallstreet') return { center: id, change: -15 };
                    if (id === 'intelligence') return { center: id, change: 10 };
                    return { center: id, change: 5 };
                }),
                chaos: 20,
                energy: 25
            });
        } else if (category === 'economy') {
            const economicText = headline.includes('inflation') ? '🏦 Emergency Fed Meeting' :
                                headline.includes('market') ? '💵 Stimulus Package' :
                                headline.includes('unemploy') ? '💼 Jobs Program' :
                                '📊 Economic Intervention';
            
            options.push({
                text: economicText,
                effects: affectedCenters.map(id => {
                    if (id === 'wallstreet') return { center: id, change: 15 };
                    if (id === 'industry') return { center: id, change: 10 };
                    if (id === 'public') return { center: id, change: 8 };
                    return { center: id, change: 5 };
                }),
                chaos: 10,
                energy: 20
            });
        } else if (category === 'scandal') {
            options.push({
                text: '⚔️ Attack Accusers',
                effects: affectedCenters.map(id => {
                    if (id === 'media') return { center: id, change: -20 };
                    if (id === 'public') return { center: id, change: 10 };
                    if (id === 'congress') return { center: id, change: -10 };
                    return { center: id, change: -5 };
                }),
                chaos: 25,
                energy: 15
            });
        } else if (category === 'military') {
            options.push({
                text: '🎖️ Mobilize Forces',
                effects: affectedCenters.map(id => {
                    if (id === 'military') return { center: id, change: 20 };
                    if (id === 'congress') return { center: id, change: -10 };
                    if (id === 'public') return { center: id, change: 12 };
                    return { center: id, change: 5 };
                }),
                chaos: 25,
                energy: 25
            });
        } else {
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
        }

        // Option 2: Context-specific diplomatic response
        if (category === 'foreign') {
            options.push({
                text: '🤝 Diplomatic Negotiations',
                effects: affectedCenters.map(id => {
                    if (id === 'congress') return { center: id, change: 12 };
                    if (id === 'military') return { center: id, change: -8 };
                    if (id === 'media') return { center: id, change: 10 };
                    return { center: id, change: 5 };
                }),
                chaos: -5,
                energy: 15
            });
        } else if (category === 'economy') {
            options.push({
                text: '📋 Bipartisan Commission',
                effects: affectedCenters.map(id => {
                    if (id === 'congress') return { center: id, change: 15 };
                    if (id === 'media') return { center: id, change: 8 };
                    return { center: id, change: 5 };
                }),
                chaos: -8,
                energy: 12
            });
        } else {
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
        }

        // Option 3: Twitter Response (always available)
        options.push({
            text: '🐦 Tweet About It',
            effects: affectedCenters.map(id => {
                if (id === 'public') return { center: id, change: 12 };
                if (id === 'media') return { center: id, change: -8 };
                return { center: id, change: this.rand() > 0.5 ? 5 : -5 };
            }),
            chaos: 15,
            energy: 5,
            action: 'focusTwitter'
        });

        // Option 4: Context-specific bold move
        if (category === 'scandal') {
            options.push({
                text: '🎤 Emergency Press Conference',
                effects: affectedCenters.map(id => {
                    if (id === 'media') return { center: id, change: 10 };
                    if (id === 'public') return { center: id, change: 8 };
                    return { center: id, change: 3 };
                }),
                chaos: 5,
                energy: 15,
                action: 'pressConference'
            });
        } else if (category === 'military') {
            options.push({
                text: '🎖️ Emergency War Powers',
                effects: affectedCenters.map(id => {
                    if (id === 'military') return { center: id, change: 20 };
                    if (id === 'congress') return { center: id, change: -15 };
                    if (id === 'public') return { center: id, change: 10 };
                    return { center: id, change: 5 };
                }),
                chaos: 30,
                energy: 25
            });
        } else if (category === 'foreign') {
            options.push({
                text: '🌍 Call Allied Summit',
                effects: affectedCenters.map(id => {
                    if (id === 'intelligence') return { center: id, change: 15 };
                    if (id === 'congress') return { center: id, change: 10 };
                    return { center: id, change: 5 };
                }),
                chaos: 8,
                energy: 20
            });
        } else {
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
        }

        console.log(`✅ Generated ${options.length} context-specific options`);
        return options;
    }

    displayCrisis() {
        if (!this.currentCrisis) return;

        const crisis = this.currentCrisis;

        this.assert(Array.isArray(crisis.options) && crisis.options.length, 'crisis has no options');
        this.assert(Number.isFinite(this.chaos) && this.chaos >= 0 && this.chaos <= 100, 'chaos out of range');

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
            btn.classList.add('decision-btn');
            btn.setAttribute('data-testid', 'decision-btn');
            btn.innerHTML = `
                ${option.text}
                <div class="option-preview">
                    Chaos: ${option.chaos > 0 ? '+' : ''}${option.chaos} |
                    Energy: -${option.energy}
                </div>
            `;
            btn.onclick = () => this.handleDecision(option);
            optionsDiv.appendChild(btn);
        });

        // Scroll crisis into view
        document.getElementById('crisisPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    handleDecision(option) {
        // Track decision
        this.trackEvent('decision_made', {
            crisis: this.currentCrisis.title,
            option: option.text,
            category: this.currentCrisis.newsStory?.category,
            chaos: option.chaos,
            energy: option.energy
        });

        // Special actions
        if (option.action === 'focusTwitter') {
            this.focusTwitter();
            return;
        }
        if (option.action === 'pressConference') {
            this.startPressConference();
        }

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
                const randomNews = this.currentNewsStories[Math.floor(this.rand() * this.currentNewsStories.length)];
                this.generateAdaptiveCrisis(randomNews);
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
                    <button class="breaking-btn primary" onclick="game.respondToBreakingNews('${story.headline.replace(/'/g, "\\'")}')">
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
            this.generateAdaptiveCrisis(story);
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
                headline: 'Congress Debates $2 Trillion Infrastructure Package',
                source: 'Reuters',
                relevance: 0.9,
                category: 'domestic',
                affectedCenters: ['congress', 'public', 'industry'],
                timestamp: Date.now()
            },
            {
                headline: 'China Conducts Military Exercises Near Taiwan',
                source: 'CNN',
                relevance: 0.85,
                category: 'foreign',
                affectedCenters: ['military', 'intelligence', 'wallstreet'],
                timestamp: Date.now()
            },
            {
                headline: 'Federal Reserve Signals Interest Rate Changes',
                source: 'Bloomberg',
                relevance: 0.8,
                category: 'economy',
                affectedCenters: ['wallstreet', 'public', 'industry'],
                timestamp: Date.now()
            },
            {
                headline: 'Supreme Court to Review Major Healthcare Case',
                source: 'NPR',
                relevance: 0.75,
                category: 'domestic',
                affectedCenters: ['congress', 'public', 'science'],
                timestamp: Date.now()
            },
            {
                headline: 'Pentagon Unveils New Defense Strategy',
                source: 'Defense News',
                relevance: 0.7,
                category: 'military',
                affectedCenters: ['military', 'intelligence', 'congress'],
                timestamp: Date.now()
            },
            {
                headline: 'Tech Giants Face New Regulation Proposals',
                source: 'Wall Street Journal',
                relevance: 0.65,
                category: 'economy',
                affectedCenters: ['industry', 'congress', 'wallstreet'],
                timestamp: Date.now()
            },
            {
                headline: 'Climate Scientists Issue Urgent Warning',
                source: 'Nature',
                relevance: 0.6,
                category: 'domestic',
                affectedCenters: ['science', 'public', 'industry'],
                timestamp: Date.now()
            },
            {
                headline: 'Russia Responds to Latest Sanctions Package',
                source: 'BBC',
                relevance: 0.75,
                category: 'foreign',
                affectedCenters: ['intelligence', 'military', 'congress'],
                timestamp: Date.now()
            }
        ];
        this.displayNewsTicker();
        console.log('📰 Showing initial mock news (8 stories)');
    }

    // ============= EXISTING SYSTEMS =============

    generateContextualCrisis() {
        // Fallback crisis generator
        const mockStory = {
            headline: 'Domestic Policy Deadlock in Congress',
            source: 'Political Wire',
            category: 'domestic',
            affectedCenters: ['congress', 'public']
        };
        this.generateAdaptiveCrisis(mockStory);
    }

    gameLoop() {
        this.day += 1;
        this.energy = Math.max(0, this.energy - 2);
        this.score += 10;

        // Small random power center drift
        if (this.rand() < 0.3) {
            const randomCenter = this.powerCenters[Math.floor(this.rand() * this.powerCenters.length)];
            const drift = (this.rand() - 0.5) * 4;
            this.updatePowerCenter(randomCenter.id, drift, 'Daily drift');
        }

        this.updateDisplay();
    }

    initiatePhoneCall(caller) {
        if (caller.lastInteraction && Date.now() - caller.lastInteraction < 30000) {
            this.showNotification(`${caller.name} is busy right now`);
            return;
        }

        this.currentCaller = caller;
        caller.lastInteraction = Date.now();

        const demand = `Regarding ${caller.currentIssues[0]}: We need to discuss this matter urgently.`;
        
        this.history.phoneCalls.push({
            caller: caller.name,
            demand,
            timestamp: Date.now()
        });

        // Quick negotiation
        const roll = this.rand() * 100;
        const successChance = caller.trust;

        if (roll < successChance) {
            // Success
            this.score += 50;
            this.chaos = Math.max(0, this.chaos - 10);
            this.updateRelationshipValues(caller.name, 10, 5, 0);
            this.showNotification(`✅ Successful negotiation with ${caller.name}!`);
        } else {
            // Failure
            this.chaos += 10;
            this.updateRelationshipValues(caller.name, -10, -5, 10);
            this.showNotification(`❌ ${caller.name} rejects your proposal!`);
        }

        this.energy -= 10;
        this.updateDisplay();
        this.displayRelationships();
    }

    updateRelationshipValues(name, trustChange, respectChange, fearChange) {
        const rel = this.relationships.find(r => r.name === name);
        if (!rel) return;

        rel.trust = Math.max(0, Math.min(100, rel.trust + trustChange));
        rel.respect = Math.max(0, Math.min(100, rel.respect + respectChange));
        rel.fear = Math.max(0, Math.min(100, rel.fear + fearChange));
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
            joke: { media: this.rand() > 0.5 ? 10 : -10, public: 5, chaos: 10 }
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
}

window.addEventListener('unhandledrejection', e => window.game?.debugTrace('unhandled rejection', { reason: String(e.reason) }));
window.addEventListener('error', e => window.game?.debugTrace('error', { msg: e.message, src: e.filename, line: e.lineno }));

console.log('President Simulator - Smart Twitter Edition loaded');
window.startPresidency = startPresidency;
