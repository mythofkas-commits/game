/*
=============================================================================
PRESIDENT SIMULATOR - TOTAL CHAOS EDITION
Smart Twitter Algorithm + Adaptive Crisis System
Place this file at: assets/game.js
=============================================================================
*/

import { GameState } from './state.js';

let game = null;
window.game = null;

function startPresidency() {
    document.getElementById('introScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    game = new PresidentGame();
    window.game = game;
    game.init();
}

/*
==============================================================================
ENHANCED GAME CODE — Notification Inbox & Public Opinion Battle Mini-Game
Add these methods and updates to your PresidentGame Class in assets/game.js
==============================================================================
*/

// ============= NOTIFICATION INBOX SYSTEM =============

class NotificationInbox {
  constructor(game) {
    this.game = game;
    this.notifications = [];
    this.unreadCount = 0;
    this.isOpen = false;
    this.currentFilter = 'all';
    this.maxStored = 100;

    this.loadStoredNotifications();
    this.setupInboxUI();
  }

  loadStoredNotifications() {
    try {
      const stored = localStorage.getItem('notificationInbox');
      if (stored) {
        const data = JSON.parse(stored);
        this.notifications = data.notifications || [];
        this.unreadCount = data.unreadCount || 0;
      }
    } catch (e) {
      console.warn('failed to load notification inbox:', e);
    }
  }

  saveNotifications() {
    try {
      localStorage.setItem('notificationInbox', JSON.stringify({
        notifications: this.notifications.slice(0, this.maxStored),
        unreadCount: this.unreadCount,
      }));
    } catch (e) {
      console.warn('failed to save notifications:', e);
    }
  }

  setupInboxUI() {
    // Create inbox icon
    const icon = document.createElement('div');
    icon.className = 'notification-inbox-icon';
    icon.innerHTML = `
      <div class="inbox-icon">📫</div>
      <div class="inbox-badge" style="display: ${this.unreadCount > 0 ? 'flex' : 'none'}">
        ${this.unreadCount}
      </div>
    `;
    icon.onclick = () => this.toggleInbox();
    document.body.appendChild(icon);
    this.iconElement = icon;

    // Create inbox panel
    const panel = document.createElement('div');
    panel.className = 'notification-inbox-panel';
    panel.innerHTML = `
      <div class="inbox-header">
        <h3>Notification Inbox</h3>
        <button class="inbox-close-btn">×</button>
      </div>
      <div class="inbox-filters">
        <button class="inbox-filter-btn active" data-filter="all">All</button>
        <button class="inbox-filter-btn" data-filter="info">Info</button>
        <button class="inbox-filter-btn" data-filter="success">Success</button>
        <button class="inbox-filter-btn" data-filter="warning">Warning</button>
        <button class="inbox-filter-btn" data-filter="error">Errors</button>
      </div>
      <div id="inboxContent"></div>
    `;
    document.body.appendChild(panel);
    this.panelElement = panel;

    panel.querySelector('.inbox-close-btn').onclick = () => this.closeInbox();
    panel.querySelectorAll('.inbox-filter-btn').forEach(btn => {
      btn.onclick = () => this.setFilter(btn.dataset.filter);
    });

    this.renderInbox();
  }

  addNotification(message, type = 'info', metadata = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      message: this.game.sanitizeText(message),
      type,
      timestamp: Date.now(),
      read: false,
      metadata,
    };

    this.notifications.unshift(notification);
    this.unreadCount++;

    // Update badge
    const badge = this.iconElement.querySelector('.inbox-badge');
    badge.style.display = 'flex';
    badge.textContent = this.unreadCount;

    // Keep only the latest notifications
    if (this.notifications.length > this.maxStored) {
      this.notifications = this.notifications.slice(0, this.maxStored);
    }

    this.saveNotifications();
    if (this.isOpen) this.renderInbox();

    return notification.id;
  }

  toggleInbox() {
    if (this.isOpen) this.closeInbox();
    else this.openInbox();
  }

  openInbox() {
    this.isOpen = true;
    this.panelElement.classList.add('open');
    this.renderInbox();
  }

  closeInbox() {
    this.isOpen = false;
    this.panelElement.classList.remove('open');
  }

  setFilter(filter) {
    this.currentFilter = filter;

    // Update active button
    this.panelElement.querySelectorAll('.inbox-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    this.renderInbox();
  }

  renderInbox() {
    const content = this.panelElement.querySelector('#inboxContent');

    const filtered = this.currentFilter === 'all'
      ? this.notifications
      : this.notifications.filter(n => n.type === this.currentFilter);

    if (filtered.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #aaa;">
          <div style="font-size: 48px; margin-bottom: 15px;">📭</div>
          <div>${this.currentFilter === 'all' ? 'No notifications' : `No ${this.currentFilter} notifications`}</div>
        </div>
      `;
      return;
    }

    content.innerHTML = filtered.map(n => {
      const timeAgo = this.formatTimeAgo(n.timestamp);
      return `
        <div class="inbox-notification ${n.type} ${n.read ? '' : 'unread'}" data-id="${n.id}">
          <div class="inbox-notification-header">
            <span style="font-weight: 600; text-transform: capitalize;">${n.type}</span>
            <span class="inbox-notification-time">${timeAgo}</span>
          </div>
          <div class="inbox-notification-preview">${n.message}</div>
        </div>
      `;
    }).join('');

    // Add click handlers
    content.querySelectorAll('.inbox-notification').forEach(el => {
      el.onclick = () => {
        const id = parseFloat(el.dataset.id);
        this.openNotificationDetail(id);
      };
    });
  }

  openNotificationDetail(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return;

    // Mark as read
    if (!notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);

      const badge = this.iconElement.querySelector('.inbox-badge');
      badge.textContent = this.unreadCount;
      badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
    }

    this.saveNotifications();
    this.renderInbox();

    // Create modal
    const existing = document.querySelector('.notification-detail-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'notification-detail-modal';

    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    const timestamp = new Date(notification.timestamp).toLocaleString();

    modal.innerHTML = `
      <div class="notification-detail-header">
        <div class="notification-detail-icon">${icons[notification.type] || ''}</div>
        <div class="notification-detail-title">
          <h3 style="text-transform: capitalize;">${notification.type} Notifications</h3>
          <div class="time">${timestamp}</div>
        </div>
      </div>
      <div class="notification-detail-content">
        ${notification.message}
        ${notification.metadata && Object.keys(notification.metadata).length ? `
          <div style="margin-top: 8px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 10px;">
            <div style="margin-bottom: 6px;">Additional Details:</div>
            ${Object.entries(notification.metadata).map(([key, value]) =>
              `<div style="margin-top: 8px;"><span style="color: var(--primary-gold);">${key}</span>: <span>${value}</span></div>`
            ).join('')}
          </div>` : ''
        }
      </div>
      <div class="notification-detail-actions">
        <button class="close-modal" style="flex: 1;">Close</button>
      </div>
    `;

    document.body.appendChild(modal);
    document.querySelector('.close-modal').onclick = () => modal.remove();
  }

  formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  clearAll() {
    if (confirm('Clear all notifications?')) {
      this.notifications = [];
      this.unreadCount = 0;
      this.saveNotifications();
      this.renderInbox();

      const badge = this.iconElement.querySelector('.inbox-badge');
      badge.style.display = 'none';
    }
  }
}

// ============== ENHANCED PUBLIC OPINION BATTLE MINI-GAME ==============

class PublicOpinionBattleGame {
  constructor(game, opponent, topic, initialData) {
    this.game = game;
    this.opponent = opponent;
    this.topic = topic;
    this.playerScore = initialData.playerScore || 50;
    this.opponentScore = initialData.opponentScore || 50;
    this.startTime = Date.now();
    this.duration = 120000; // 2 minutes
    this.maxRounds = 5;
    this.currentRound = 0;
    this.rounds = [];
    this.powerups = {
      mediaSpin: { used: false, effect: 15, cost: 10 },
      populistAppeal: { used: false, effect: 20, cost: 15 },
      factCheck: { used: false, effect: 10, cost: 5 },
    };
    this.resultShown = null;

    this.generateRounds();
    this.render();
    this.startTimer();
  }

  generateRounds() {
    const topics = [
      {
        question: `${this.opponent.name} claims your handling of ${this.topic} is inadequate. How do you respond?`,
        options: [
          { text: 'Present data and evidence', effect: 12, chaos: 3 },
          { text: 'Rally public support', effect: 15, chaos: 5 },
          { text: 'Attack their credibility', effect: 18, chaos: 10 },
          { text: 'Propose compromise', effect: 8, chaos: 5 },
        ],
      },
      {
        question: `The media is amplifying ${this.opponent.name}'s criticism. Your move?`,
        options: [
          { text: 'Schedule prime-time interview', effect: 14, chaos: 2 },
          { text: 'Launch tweet offensive', effect: 16, chaos: 8 },
          { text: 'Leak favorable story', effect: 12, chaos: 6 },
          { text: 'Stay silent, let it pass', effect: 5, chaos: 2 },
        ],
      },
      {
        question: `${this.opponent.name} just gained ground with swing voters. Counter?`,
        options: [
          { text: 'Promise economic relief', effect: 18, chaos: 4 },
          { text: 'Announce leadership reshuffle', effect: 15, chaos: 9 },
          { text: 'Go on the offensive', effect: 15, chaos: 12 },
          { text: 'Appeal to unity', effect: 10, chaos: 4 },
        ],
      },
      {
        question: `A scandal from your past resurfaces. ${this.opponent.name} is exploiting it.`,
        options: [
          { text: 'Deny and deflect', effect: 8, chaos: 8 },
          { text: 'Offer public apology', effect: 12, chaos: 3 },
          { text: 'Threaten legal action', effect: 13, chaos: 10 },
          { text: 'Make light of it', effect: 12, chaos: 4 },
        ],
      },
      {
        question: `Final showdown: ${this.opponent.name} challenges you to a public debate.`,
        options: [
          { text: 'Accept immediately and prepare', effect: 28, chaos: 6 },
          { text: 'Set strict conditions', effect: 18, chaos: 2 },
          { text: 'Avoid and stall', effect: -5, chaos: 3 },
          { text: 'Accept and attack', effect: 25, chaos: 15 },
        ],
      },
    ];

    this.rounds = topics.slice(0, this.maxRounds);
  }

  render() {
    const existing = document.querySelector('.public-opinion-battle');
    if (existing) existing.remove();

    const battle = document.createElement('div');
    battle.className = 'public-opinion-battle';
    this.battleElement = battle;

    this.updateBattleUI();

    const crisisPanel = document.getElementById('crisisPanel');
    if (crisisPanel) {
      crisisPanel.insertAdjacentElement('afterend', battle);
    } else {
      document.querySelector('.game-container').appendChild(battle);
    }
  }

  updateBattleUI() {
    if (!this.battleElement) return;

    const timeLeft = Math.max(0, Math.ceil((this.duration - (Date.now() - this.startTime)) / 1000));
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const round = this.rounds[this.currentRound];
    const isComplete = this.currentRound >= this.maxRounds;

    this.battleElement.innerHTML = `
      <div class="battle-header">
        <h4>Public Opinion Battle: ${this.topic}</h4>
        <div class="battle-timer">${minutes}:${seconds.toString().padStart(2, '0')}</div>
      </div>

      <div class="battle-progress">
        ${Array.from({ length: this.maxRounds }).map((_, i) => `
          <div class="battle-progress-dot ${i < this.currentRound ? 'completed' : (i === this.currentRound ? 'active' : '')}"></div>
        `).join('')}
      </div>

      <div class="battle-scores-container">
        <div class="battle-score-item">
          <div class="battle-score-label">
            <span style="color: var(--primary-gold); font-size: 18px;">${Math.round(this.playerScore)}%</span>
          </div>
          <div class="battle-score-bar">
            <div class="battle-score-fill player" style="width: ${this.playerScore}%"></div>
          </div>
        </div>

        <div class="battle-score-item">
          <div class="battle-score-label">
            <span>${this.opponent.name}</span>
            <span style="color: inherit; font-size: 18px;">${Math.round(this.opponentScore)}%</span>
          </div>
          <div class="battle-score-bar">
            <div class="battle-score-fill opponent" style="width: ${this.opponentScore}%"></div>
          </div>
        </div>
      </div>

      ${!isComplete ? `
        <div class="battle-interactive">
          <div class="battle-question">
            <strong>Round ${this.currentRound + 1}/${this.maxRounds}</strong><br>
            ${round.question}
          </div>

          <div class="battle-options">
            ${round.options.map((option, i) => `
              <button class="battle-option-btn" data-index="${i}">
                ${option.text}
                <div class="battle-option-effect">
                  ${option.effect >= 0 ? '+' : ''}${option.effect}${option.chaos ? ` · chaos: ${option.chaos}` : ''}
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="battle-powerups">
        ${Object.entries(this.powerups).map(([key, powerup]) => `
          <div class="battle-powerup ${powerup.used ? 'used' : ''}" data-powerup="${key}">
            <span>${this.getPowerupIcon(key)}</span>
            <span style="margin-left: auto;">${powerup.used ? 'USED' : `-${powerup.cost} energy`}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Add event listeners
    if (!isComplete) {
      this.battleElement.querySelectorAll('.battle-option-btn').forEach(btn => {
        btn.onclick = () => this.handleChoice(parseInt(btn.dataset.index));
      });
      this.battleElement.querySelectorAll('.battle-powerup').forEach(btn => {
        btn.onclick = () => this.usePowerup(btn.dataset.powerup);
      });
    }
  }

  handleChoice(index) {
    const round = this.rounds[this.currentRound];
    const option = round.options[index];

    // Calculate outcomes (weighted by their aggression)
    const opponentResponse = Math.random() * (this.opponent.aggression / 10);

    this.playerScore = Math.min(100, Math.max(0, this.playerScore + option.effect - opponentResponse));
    this.opponentScore = Math.max(0, Math.min(100, this.opponentScore + opponentResponse - (option.effect / 2)));

    // Store round result
    this.rounds[this.currentRound].playerEffect = option.effect;

    // Move to next round
    if (this.currentRound >= this.maxRounds || (Date.now() - this.startTime >= this.duration)) {
      this.endBattle();
    } else {
      this.currentRound++;
      this.updateBattleUI();
    }
  }

  usePowerup(powerupKey) {
    const powerup = this.powerups[powerupKey];
    if (!powerup || (this.game.energy < powerup.cost)) {
      this.game.showNotification('Cannot use power-up', 'warning');
      return;
    }

    powerup.used = true;
    this.playerScore = Math.min(100, this.playerScore + powerup.effect);
    this.opponentScore = Math.max(0, this.opponentScore - (powerup.effect / 2));

    this.game.state.applyEffects({
      power: '+ opinion-battle power-up',
    });

    this.game.inbox.addNotification(`Used ${this.getPowerupName(powerupKey)}!`, 'success');
    this.updateBattleUI();
  }

  getPowerupIcon(key) {
    const icons = { mediaSpin: '🌀', populistAppeal: '📣', factCheck: '🧾' };
    return icons[key] || '✨';
  }

  getPowerupName(key) {
    const names = { mediaSpin: 'Media Spin', populistAppeal: 'Populist Appeal', factCheck: 'Fact Check' };
    return names[key] || key;
  }

  renderResult() {
    const won = this.playerScore > this.opponentScore;
    const margin = Math.abs(this.playerScore - this.opponentScore);

    return `
      <div class="battle-result ${won ? 'victory' : 'defeat'}">
        <h3>${won ? '🏆 VICTORY!' : '❌ DEFEAT'}</h3>
        <p style="font-size: 16px; margin: 18px 0;">
          ${won
            ? `${this.opponent.name} by ${Math.round(margin)} points!`
            : `${this.opponent.name} defeated you by ${Math.round(margin)} points.`}
        </p>

        <div class="battle-result-effects">
          <div class="battle-result-effect">Public Opinion: ${Math.round(margin * 0.5)}%</div>
          <div class="battle-result-effect">Public Support: ${Math.round(margin * 0.3)}%</div>
          <div class="battle-result-effect">Chaos: ${Math.round(margin * 0.2)}%</div>
        </div>

        <button class="close-modal" onclick="this.closest('.public-opinion-battle').remove()" style="margin-top: 20px;">Close</button>
      </div>
    `;
  }

  endBattle() {
    const won = this.playerScore > this.opponentScore;
    const margin = Math.abs(this.playerScore - this.opponentScore);

    if (won) {
      this.game.state.applyEffects({ power: `+ public: margin x 0.5`, scoreDelta: margin * 1.5, chaosDelta: 5 });
      this.game.inbox.addNotification(
        `🏆 Victory in public opinion battle against ${this.opponent.name}! Public support increased by ${Math.round(margin * 0.5)}%.`,
        'success',
        { opponent: this.opponent.name, topic: this.topic, margin: Math.round(margin) },
      );
    } else {
      this.game.state.applyEffects({ power: `- public: margin x 0.5`, scoreDelta: -margin * 0.5, chaosDelta: 5 });
      this.game.inbox.addNotification(
        `Lost this topic's opinion battle to ${this.opponent.name}. Public support decreased.`,
        'warning',
        { opponent: this.opponent.name, topic: this.topic, margin: Math.round(margin) },
      );
    }

    this.updateBattleUI();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      const timeLeft = Math.max(0, this.duration - (Date.now() - this.startTime));
      if (timeLeft <= 0) {
        clearInterval(this.timerInterval);
        if (this.currentRound < this.maxRounds) this.endBattle();
        else this.updateBattleUI();
      }
    }, 1000);
  }
}

class PresidentGame {
    constructor() {
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

        this.state = new GameState({
            day: 1,
            energy: 100,
            chaos: 0,
            score: 0,
            powerCenters: this.powerCenters.map(({ id, value }) => ({ id, value }))
        });

        this.state.onChange((diff, prev, next, meta) => this.handleStateChange(diff, prev, next, meta));

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
        
        // OPPOSITION AI SYSTEM
        this.oppositionAI = this.initializeOppositionAI();
        this.publicOpinionBattles = [];
        this.influencers = this.initializeInfluencers();
        this.twitterWars = [];
        this.mediaManipulation = {
            narrativeControl: 50,
            spinDoctors: 3,
            mediaRelations: 50
        };
        
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
        this.sessionId = Date.now() + '-' + randomId.toString(36).substring(2, 11).padStart(9, '0');
        this.sessionStart = Date.now();
        this.analytics = {
            events: [],
            decisions: [],
            tweets: [],
            powerChanges: [],
            crises: []
        };

        this.inbox = new NotificationInbox(this);
        this.activeBattles = [];

        this.notifications = [];
        this.maxVisibleNotifications = 5;
        this.notificationId = 0;
        this.setupNotificationsContainer();
    }

    // ============= BACKSTORY GENERATION =============
    async generateAllBackstories() {
        for (const rel of this.relationships) {
            await this.generateRelationshipBackstory(rel);
        }
        this.displayRelationships();
    }

    async generateRelationshipBackstory(rel) {
        if (!rel) return;
        try {
            const ai = await this.fetchAINarrative({
                generationType: 'backstory',
                headline: rel.name,
                playerContext: {
                    relationship: {
                        name: rel.name,
                        personality: rel.personality,
                        role: rel.role,
                        trust: rel.trust,
                        respect: rel.respect,
                        fear: rel.fear
                    }
                }
            });
            const backstory = Array.isArray(ai?.backstory)
                ? ai.backstory
                : Array.isArray(ai?.narrative?.backstory)
                    ? ai.narrative.backstory
                    : [];
            if (backstory.length) {
                rel.history = backstory.map(event => ({
                    event: typeof event.event === 'string' ? event.event : typeof event.title === 'string' ? event.title : '',
                    trustChange: Number.isFinite(Number(event.trustChange)) ? Number(event.trustChange) : 0,
                    respectChange: Number.isFinite(Number(event.respectChange)) ? Number(event.respectChange) : 0,
                    fearChange: Number.isFinite(Number(event.fearChange)) ? Number(event.fearChange) : 0,
                    timestamp: event.timestamp ? new Date(event.timestamp).getTime() : Date.now()
                }));
                return;
            }
        } catch (e) {
            console.warn('Failed to generate backstory for', rel.name, e);
        }
        this.generateFallbackBackstory(rel);
    }

    generateFallbackBackstory(rel) {
        if (!rel) return;
        const events = [];
        let totalTrust = 0;
        let totalRespect = 0;
        let totalFear = 0;
        const numEvents = 3 + Math.floor(this.rand() * 3);
        for (let i = 0; i < numEvents; i++) {
            const event = this.generatePlausibleEvent(rel, i, numEvents);
            events.push(event);
            totalTrust += event.trustChange;
            totalRespect += event.respectChange;
            totalFear += event.fearChange;
        }
        if (events.length) {
            events[events.length - 1].trustChange += rel.trust - totalTrust;
            events[events.length - 1].respectChange += rel.respect - totalRespect;
            events[events.length - 1].fearChange += rel.fear - totalFear;
        }
        rel.history = events;
    }

    generatePlausibleEvent(rel, index, total) {
        const personalities = {
            strategic: ['negotiated a compromise', 'outmaneuvered opponents', 'formed alliances'],
            calculating: ['weighed options carefully', 'made pragmatic decisions', 'avoided unnecessary risks'],
            ideological: ['stood firm on principles', 'challenged the status quo', 'inspired followers'],
            ruthless: ['eliminated threats', 'seized opportunities', 'showed no mercy'],
            patient: ['waited for the right moment', 'built long-term strategies', 'endured setbacks'],
            pragmatic: ['adapted to circumstances', 'found middle ground', 'delivered results']
        };
        const options = personalities[rel.personality] || ['took decisive action'];
        const action = options[Math.floor(this.rand() * options.length)];
        const randomDelta = () => Math.round((this.rand() - 0.5) * 20);
        const monthsAgo = total - index;
        return {
            event: `${rel.name} ${action} during a key political moment`,
            trustChange: randomDelta(),
            respectChange: randomDelta(),
            fearChange: randomDelta(),
            timestamp: Date.now() - monthsAgo * 30 * 24 * 60 * 60 * 1000
        };
    }

    // ============= RELATIONSHIP CALL SYSTEM =============
    getRelevantNewsForLeader(rel) {
        if (!rel) return [];
        const leaderCategories = {
            'Chuck Schumer': ['domestic', 'healthcare', 'scandal'],
            'John Thune': ['domestic', 'economy', 'military'],
            'Mike Johnson': ['domestic', 'military', 'congress'],
            'Vladimir Putin': ['foreign', 'military', 'intelligence'],
            'Xi Jinping': ['foreign', 'economy', 'military'],
            'Keir Starmer': ['foreign', 'economy', 'nato']
        };
        const categories = leaderCategories[rel.name] || [];
        if (!categories.length) return this.currentNewsStories.slice();
        return this.currentNewsStories.filter(story => categories.includes(story.category));
    }

    getCurrentIssueForLeader(rel) {
        const relevant = this.getRelevantNewsForLeader(rel) || [];
        if (relevant.length) {
            const story = relevant[Math.floor(this.rand() * relevant.length)];
            if (story?.headline) {
                return `${story.headline.substring(0, 50)}...`;
            }
        }
        if (Array.isArray(rel.currentIssues) && rel.currentIssues.length) {
            return rel.currentIssues[Math.floor(this.rand() * rel.currentIssues.length)];
        }
        return 'urgent developments';
    }

    showCallModal(rel) {
        if (!rel) return;
        const existing = document.querySelector('.call-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'call-modal';

        const issue = this.getCurrentIssueForLeader(rel);
        const safeIssue = this.sanitizeText(issue);

        const content = document.createElement('div');
        content.className = 'call-content';

        const title = document.createElement('h2');
        title.textContent = `📞 Call with ${rel.name}`;
        content.appendChild(title);

        const role = document.createElement('p');
        role.innerHTML = `<strong>Role:</strong> ${this.sanitizeText(rel.role)}`;
        content.appendChild(role);

        const personality = document.createElement('p');
        personality.innerHTML = `<strong>Personality:</strong> ${this.sanitizeText(rel.personality)}`;
        content.appendChild(personality);

        const meters = document.createElement('div');
        meters.className = 'relationship-meters';
        ['Trust', 'Respect', 'Fear'].forEach((label, index) => {
            const value = [rel.trust, rel.respect, rel.fear][index] ?? 0;
            const meterItem = document.createElement('div');
            meterItem.textContent = `${label}: ${value}%`;
            meters.appendChild(meterItem);
        });
        content.appendChild(meters);

        const issueEl = document.createElement('p');
        issueEl.innerHTML = `<strong>Issue:</strong> ${safeIssue}`;
        content.appendChild(issueEl);

        const optionsWrap = document.createElement('div');
        optionsWrap.className = 'call-options';
        const approaches = [
            { approach: 'diplomatic', label: '🤝 Diplomatic' },
            { approach: 'firm', label: '💪 Firm' },
            { approach: 'aggressive', label: '⚔️ Aggressive' },
            { approach: 'concessions', label: '🤲 Concessions' }
        ];
        approaches.forEach(({ approach, label }) => {
            const btn = document.createElement('button');
            btn.className = 'call-option';
            btn.textContent = label;
            btn.addEventListener('click', () => this.handleCallApproach(rel, approach, modal, issue));
            optionsWrap.appendChild(btn);
        });
        content.appendChild(optionsWrap);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-modal';
        closeBtn.textContent = 'Cancel';
        closeBtn.addEventListener('click', () => modal.remove());
        content.appendChild(closeBtn);

        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    handleCallApproach(rel, approach, modal, issue) {
        if (modal) modal.remove();
        const outcome = this.calculateCallOutcome(rel, approach);
        this.showCallResult(rel, approach, outcome, issue);

        this.updateRelationshipValues(rel.name, outcome.trustChange, outcome.respectChange, outcome.fearChange);
        if (!Array.isArray(rel.history)) rel.history = [];
        rel.history.push({
            event: `Phone call: ${approach} approach on ${issue}`,
            trustChange: outcome.trustChange,
            respectChange: outcome.respectChange,
            fearChange: outcome.fearChange,
            timestamp: Date.now()
        });

        this.history.phoneCalls.push({
            caller: rel.name,
            approach,
            issue,
            result: outcome.result,
            timestamp: Date.now()
        });

        this.trackEvent('phone_call', { leader: rel.name, approach, result: outcome.result, issue });

        const stateEffects = outcome.result === 'success'
            ? { chaosDelta: -10, energyDelta: -10, scoreDelta: 50 }
            : { chaosDelta: 10, energyDelta: -10 };
        this.state.applyEffects(stateEffects, { source: 'phone-call', leader: rel.name, approach, result: outcome.result });

        this.displayRelationships();
    }

    calculateCallOutcome(rel, approach) {
        let modifier = 0;
        switch (rel.personality) {
            case 'strategic':
                if (approach === 'diplomatic') modifier += 0.4;
                if (approach === 'firm') modifier += 0.2;
                if (approach === 'aggressive') modifier -= 0.3;
                break;
            case 'calculating':
                if (approach === 'concessions') modifier += 0.4;
                if (approach === 'diplomatic') modifier += 0.2;
                break;
            case 'ideological':
                if (approach === 'firm') modifier += 0.4;
                if (approach === 'aggressive') modifier += 0.2;
                if (approach === 'concessions') modifier -= 0.3;
                break;
            case 'ruthless':
                if (approach === 'aggressive') modifier += 0.4;
                if (approach === 'firm') modifier += 0.2;
                if (approach === 'diplomatic') modifier -= 0.2;
                break;
            case 'patient':
                if (approach === 'diplomatic') modifier += 0.4;
                if (approach === 'firm') modifier += 0.1;
                if (approach === 'aggressive') modifier -= 0.4;
                break;
            case 'pragmatic':
                modifier += 0.2;
                break;
            default:
                break;
        }
        const baseChance = Math.min(Math.max(rel.trust / 100, 0), 1);
        const successThreshold = Math.min(Math.max(baseChance + modifier, 0), 1);
        const success = this.rand() < successThreshold;
        if (success) {
            return {
                result: 'success',
                trustChange: 5 + Math.floor(this.rand() * 10),
                respectChange: 5 + Math.floor(this.rand() * 10),
                fearChange: -5 + Math.floor(this.rand() * 5)
            };
        }
        return {
            result: 'failure',
            trustChange: -(10 + Math.floor(this.rand() * 10)),
            respectChange: -(5 + Math.floor(this.rand() * 10)),
            fearChange: 5 + Math.floor(this.rand() * 10)
        };
    }

    async showCallResult(rel, approach, outcome, issue) {
        let dialogue = 'Standard response.';
        try {
            const ai = await this.fetchAINarrative({
                generationType: 'callDialogue',
                headline: issue,
                playerContext: {
                    relationship: {
                        name: rel.name,
                        personality: rel.personality,
                        role: rel.role,
                        trust: rel.trust,
                        respect: rel.respect,
                        fear: rel.fear
                    },
                    approach,
                    outcome,
                    issue
                }
            });
            if (ai?.narrative && typeof ai.narrative === 'string') {
                dialogue = ai.narrative;
            }
        } catch (e) {
            console.warn('AI dialogue failed', e);
        }
        const existing = document.querySelector('.call-result-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'call-result-modal';

        const content = document.createElement('div');
        content.className = 'call-result-content';

        const heading = document.createElement('h3');
        heading.textContent = 'Call Result';
        content.appendChild(heading);

        const summary = document.createElement('p');
        summary.innerHTML = `You took a <strong>${this.sanitizeText(approach)}</strong> approach with ${this.sanitizeText(rel.name)} regarding <strong>${this.sanitizeText(issue)}</strong>.`;
        content.appendChild(summary);

        const response = document.createElement('p');
        response.innerHTML = `<strong>Response:</strong> ${this.sanitizeText(dialogue)}`;
        content.appendChild(response);

        const outcomeLine = document.createElement('p');
        outcomeLine.innerHTML = `<strong>Outcome:</strong> ${outcome.result === 'success' ? 'Successful negotiation!' : 'They rejected your proposal.'}`;
        content.appendChild(outcomeLine);

        const trustLine = document.createElement('p');
        trustLine.innerHTML = `Trust: <span style="color: ${outcome.trustChange > 0 ? 'green' : 'red'}">${outcome.trustChange > 0 ? '+' : ''}${outcome.trustChange}%</span>`;
        content.appendChild(trustLine);

        const respectLine = document.createElement('p');
        respectLine.innerHTML = `Respect: <span style="color: ${outcome.respectChange > 0 ? 'green' : 'red'}">${outcome.respectChange > 0 ? '+' : ''}${outcome.respectChange}%</span>`;
        content.appendChild(respectLine);

        const fearLine = document.createElement('p');
        fearLine.innerHTML = `Fear: <span style="color: ${outcome.fearChange > 0 ? 'green' : 'red'}">${outcome.fearChange > 0 ? '+' : ''}${outcome.fearChange}%</span>`;
        content.appendChild(fearLine);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-result';
        closeBtn.textContent = 'OK';
        closeBtn.addEventListener('click', () => modal.remove());
        content.appendChild(closeBtn);

        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    get day() {
        return this.state.snapshot.day;
    }

    set day(value) {
        this.state.setDay(value);
    }

    get energy() {
        return this.state.snapshot.energy;
    }

    set energy(value) {
        this.state.setEnergy(value);
    }

    get chaos() {
        return this.state.snapshot.chaos;
    }

    set chaos(value) {
        this.state.setChaos(value);
    }

    get score() {
        return this.state.snapshot.score;
    }

    set score(value) {
        this.state.setScore(value);
    }

    /**
     * Sanitize user-provided or external text to prevent XSS.
     * @param {string} input
     * @returns {string}
     */
    sanitizeText(input) {
        if (typeof input !== 'string') return '';

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<!doctype html><body>${input}`, 'text/html');
            return doc?.body?.textContent ?? '';
        } catch {
            return String(input)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
        const temp = document.createElement('div');
        temp.textContent = input;
        const decoded = temp.innerHTML;

        return decoded.replace(/<[^>]*>/g, '');
    }

    /**
     * Safely set text content on an element resolved by selector or id.
     * @param {string} selector
     * @param {string|number} text
     */
    safeSetText(selector, text) {
        const el = document.getElementById(selector) || document.querySelector(selector);
        if (el) {
            el.textContent = typeof text === 'string' ? text : String(text ?? '');
        }
    }

    // ============= ANALYTICS TRACKING =============

    trackEvent(eventType, data = {}) {
        const snapshot = this.state.snapshot;
        const event = {
            type: eventType,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            gameState: snapshot,
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
            const snapshot = this.state.snapshot;
            session.finalState = {
                day: snapshot.day,
                energy: snapshot.energy,
                chaos: snapshot.chaos,
                score: snapshot.score,
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
        return this.state.knownPowerCenters;
    }

    handleStateChange(diff, prev, next, meta = {}) {
        if (!diff || Object.keys(diff).length === 0) return;
        if (this.debug && typeof this.debugTrace === 'function') {
            this.debugTrace('state-change', diff);
        }

        if (diff.power) {
            const detailSource = Array.isArray(meta?.powerChanges) && meta.powerChanges.length
                ? meta.powerChanges
                : Object.entries(diff.power).map(([id, [oldValue, newValue]]) => ({
                    id,
                    oldValue,
                    newValue,
                    change: newValue - oldValue,
                    reason: meta?.powerReasons?.[id] ?? meta?.reason ?? ''
                }));

            detailSource.forEach(change => {
                if (!change || typeof change.id !== 'string') return;
                const resolvedReason = change.reason ?? meta?.powerReasons?.[change.id] ?? meta?.reason ?? '';
                this.applyPowerChangeUI({
                    id: change.id,
                    oldValue: change.oldValue,
                    newValue: change.newValue,
                    change: change.change,
                    reason: resolvedReason
                });
            });
        }

        if (diff.day || diff.energy || diff.chaos || diff.score) {
            this.updateDisplay();
        }
    }

    applyPowerChangeUI({ id, oldValue = 0, newValue = 0, change = 0, reason = '' }) {
        const center = this.powerCenters.find(p => p.id === id);
        if (!center) return;

        if (Number.isFinite(newValue)) {
            center.value = newValue;
        }

        const fillEl = document.getElementById(`power-${id}`);
        let card = null;
        if (fillEl) {
            fillEl.style.width = `${center.value}%`;
            card = fillEl.closest('.power-center-card');
            if (card && change) {
                card.classList.add(change > 0 ? 'power-increase' : 'power-decrease');
                setTimeout(() => card.classList.remove('power-increase', 'power-decrease'), 500);
            }
        }

        const valueEl = (card || document).querySelector(card ? '.power-value' : `#power-${id} ~ .power-value`);
        if (valueEl) {
            valueEl.textContent = `${Math.round(center.value)}%`;
        }

        if (change && Math.abs(change) >= 5) {
            this.showPowerChangeNotification(center, change, reason);
        }

        if (change) {
            this.history.powerChanges.push({
                center: id,
                oldValue,
                newValue: center.value,
                change,
                reason,
                timestamp: Date.now()
            });
            this.triggerCascadeEffects(id, change);
        }

        this.checkCoalitions();
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
        return this.state.snapshot;
    }

    diffStates(a, b) {
        return GameState.diff(a, b);
    }

    explainDisabled(btn, reason) {
        if (!btn) return;
        btn.setAttribute('title', reason);
        btn.dataset.disabledReason = reason;
    }

    async fetchJson(url, init) {
        if (this.debug && url.includes('/api/ai-narrative')) {
            let payload = {};
            try {
                payload = JSON.parse(init?.body || '{}');
            } catch {
                payload = {};
            }

            if (payload.generationType === 'crisis_options') {
                return {
                    narrative: {
                        options: [
                            {
                                text: '🚢 Deploy naval drill',
                                effects: {
                                    relationships: [
                                        { center: 'military', change: 12 },
                                        { center: 'wallstreet', change: -8 }
                                    ]
                                },
                                chaos: 18,
                                energy: 20
                            },
                            {
                                text: '🤝 Urgent summit with allies',
                                effects: {
                                    relationships: [
                                        { center: 'congress', change: 10 },
                                        { center: 'media', change: 8 }
                                    ]
                                },
                                chaos: -4,
                                energy: 18
                            },
                            {
                                text: '🐦 Tweet reassurance to public',
                                effects: {
                                    relationships: [
                                        { center: 'public', change: 9 },
                                        { center: 'media', change: -6 }
                                    ]
                                },
                                chaos: 12,
                                energy: 6
                            },
                            {
                                text: '⚙️ Mobilize industry task force',
                                effects: {
                                    relationships: [
                                        { center: 'industry', change: 11 }
                                    ]
                                },
                                chaos: 6,
                                energy: 15
                            }
                        ]
                    }
                };
            }

            if (payload.generationType === 'backstory') {
                return {
                    success: true,
                    backstory: [
                        { event: 'Met during a tense budget negotiation', trustChange: 10, respectChange: 8, fearChange: -3, timestamp: Date.now() - 90 * 24 * 60 * 60 * 1000 },
                        { event: 'Clashed over committee assignments', trustChange: -6, respectChange: -4, fearChange: 5, timestamp: Date.now() - 45 * 24 * 60 * 60 * 1000 },
                        { event: 'Brokered a last-minute vote trade', trustChange: 8, respectChange: 6, fearChange: -2, timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 }
                    ]
                };
            }

            if (payload.generationType === 'callDialogue') {
                return { success: true, narrative: 'We will consider your proposal, but expect concessions soon.' };
            }

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

    async fetchAINarrative({ headline = '', generationType, playerContext } = {}) {
        if (!generationType) throw new Error('generationType required');
        const baseContext = this.getPlayerContextForAI();
        const context = playerContext ? { ...baseContext, ...playerContext } : baseContext;

        const body = {
            playerContext: context,
            newsHeadline: headline || '',
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
            resp = await attempt();
        }

        if (!resp) throw new Error('Bad AI payload');

        if (generationType === 'crisis_options') {
            if (!resp.narrative || !Array.isArray(resp.narrative.options)) {
                throw new Error('Bad AI payload');
            }
            return resp;
        }

        if (generationType === 'backstory') {
            const backstory = Array.isArray(resp.backstory)
                ? resp.backstory
                : Array.isArray(resp.narrative?.backstory)
                    ? resp.narrative.backstory
                    : [];
            return { success: resp.success ?? true, backstory };
        }

        if (generationType === 'callDialogue') {
            const narrative = typeof resp.narrative === 'string'
                ? resp.narrative
                : typeof resp.narrative?.dialogue === 'string'
                    ? resp.narrative.dialogue
                    : typeof resp.dialogue === 'string'
                        ? resp.dialogue
                        : '';
            return { success: resp.success ?? true, narrative };
        }

        if (!resp.narrative) throw new Error('Bad AI payload');

        if (generationType === 'crisis_options') {
            return resp;
        }

        const n = resp.narrative;
        const impacts = n?.impacts || n?.impact || {};
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

        resp.narrative = {
            headline: n.headline || n.title || 'Policy Response',
            description: n.description || n.body || '',
            impacts: { chaos, energy, relationships }
        };

        return resp;
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
        await this.generateAllBackstories();
        this.setupReporters();
        this.setupTwitterInput();
        
        // Wait for REAL news to load (no mock news)
        await this.fetchRealPoliticalNews();
        
        // If we have news, hide loading and prompt interaction
        if (this.currentNewsStories.length > 0) {
            this.hideLoadingScreen();
            const crisisPanel = document.getElementById('crisisPanel');
            if (crisisPanel) {
                crisisPanel.style.display = 'none';
            }
            this.showNotification(
                '📰 Click any news headline to respond to breaking events!',
                'info',
                15000
            );
        } else {
            // If news failed, show error
            this.showLoadingError();
        }

        this.gameInterval = setInterval(() => this.gameLoop(), 5000);
        this.newsInterval = setInterval(() => this.checkForNewsUpdate(), 600000);
        this.oppositionInterval = setInterval(() => this.oppositionAILoop(), 10000); // Check every 10 seconds

        // Track game start for analytics
        this.trackEvent('game_started');

        if (this.debug) this.installDebugOverlay();

        const origHandleDecision = this.handleDecision?.bind(this);
        if (origHandleDecision) {
            this.handleDecision = (option) => {
                const before = this.snapshotState ? this.snapshotState() : {
                    chaos: this.chaos,
                    energy: this.energy,
                    power: Object.fromEntries((this.powerCenters || []).map(p => [p.id, p.value]))
                };
                this.debugTrace && this.debugTrace('decision:before', { option });
                try { return origHandleDecision(option); }
                finally {
                    const after = this.snapshotState ? this.snapshotState() : {
                        chaos: this.chaos,
                        energy: this.energy,
                        power: Object.fromEntries((this.powerCenters || []).map(p => [p.id, p.value]))
                    };
                    const power = {};
                    const keys = new Set([
                        ...Object.keys(before.power || {}),
                        ...Object.keys(after.power || {})
                    ]);
                    for (const k of keys) {
                        if ((before.power || {})[k] !== (after.power || {})[k]) {
                            power[k] = [(before.power || {})[k], (after.power || {})[k]];
                        }
                    }
                    const delta = {};
                    if (before.chaos !== after.chaos) delta.chaos = [before.chaos, after.chaos];
                    if (before.energy !== after.energy) delta.energy = [before.energy, after.energy];
                    if (Object.keys(power).length) delta.power = power;

                    if (!Object.keys(delta).length) {
                        this.debugTrace && this.debugTrace('no effect detected', {
                            option,
                            chaos: after.chaos,
                            energy: after.energy,
                            centers: after.power
                        });
                    } else {
                        this.debugTrace && this.debugTrace('decision:after', delta);
                    }
                }
            };
        }
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
                <div class="loading-animation">
                    <div class="president-icon">🏛️</div>
                    <div class="loading-spinner"></div>
                </div>
                <h2 style="color: #ffd700; margin: 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Loading Your Presidency</h2>
                <div class="loading-steps">
                    <div class="loading-step active" id="step-1">
                        <span class="step-icon">🌐</span>
                        <span class="step-text">Fetching real-time political news...</span>
                    </div>
                    <div class="loading-step" id="step-2">
                        <span class="step-icon">⚡</span>
                        <span class="step-text">Initializing power centers...</span>
                    </div>
                    <div class="loading-step" id="step-3">
                        <span class="step-icon">🎯</span>
                        <span class="step-text">Setting up crisis systems...</span>
                    </div>
                    <div class="loading-step" id="step-4">
                        <span class="step-icon">🐦</span>
                        <span class="step-text">Connecting to Twitter...</span>
                    </div>
                </div>
                <div class="loading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="progress-text" id="progressText">0%</div>
                </div>
            </div>
        `;
        document.body.appendChild(loading);
        
        // Start the loading animation
        this.animateLoadingSteps();
    }

    animateLoadingSteps() {
        const steps = [
            { id: 'step-1', text: 'Fetching real-time political news...', progress: 25 },
            { id: 'step-2', text: 'Initializing power centers...', progress: 50 },
            { id: 'step-3', text: 'Setting up crisis systems...', progress: 75 },
            { id: 'step-4', text: 'Connecting to Twitter...', progress: 100 }
        ];

        let currentStep = 0;
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        const updateStep = () => {
            if (currentStep < steps.length) {
                const step = steps[currentStep];
                const stepEl = document.getElementById(step.id);
                
                if (stepEl) {
                    stepEl.classList.add('active');
                    if (progressFill) progressFill.style.width = `${step.progress}%`;
                    if (progressText) progressText.textContent = `${step.progress}%`;
                }
                
                currentStep++;
                setTimeout(updateStep, 800);
            }
        };

        updateStep();
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
        
        if (!input) {
            console.warn('Tweet input element not found');
            return;
        }
        
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
        if (!container) {
            console.warn('Power centers grid container not found');
            return;
        }
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
        try {
            this.state.updatePower(id, change, reason);
        } catch (err) {
            console.warn('Failed to update power center', id, err);
        }
    }

    showPowerChangeNotification(center, change, reason) {
        const notif = document.createElement('div');
        notif.className = 'power-notification';
        const main = document.createElement('span');
        main.textContent = `${center.icon} ${center.name}: ${change > 0 ? '+' : ''}${Math.round(change)}`;
        notif.appendChild(main);

        if (reason) {
            const detail = document.createElement('div');
            detail.style.fontSize = '11px';
            detail.style.opacity = '0.8';
            detail.textContent = this.sanitizeText(reason);
            notif.appendChild(detail);
        }
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
        if (!input) {
            console.warn('Tweet input element not found');
            return;
        }
        const content = input.value.trim();

        if (!content) {
            this.showNotification('❌ Tweet is empty!');
            return;
        }

        const sanitizedContent = this.sanitizeText(content);

        // Analyze the tweet
        const analysis = this.analyzeTweet(sanitizedContent);

        // Track tweet
        this.trackEvent('tweet_sent', {
            content: sanitizedContent,
            tone: analysis.tone,
            chaos: analysis.chaos,
            targets: analysis.targets,
            warnings: analysis.warnings
        });

        this.history.tweets.push({
            content: sanitizedContent,
            analysis,
            timestamp: Date.now()
        });

        const powerReasons = {};
        Object.entries(analysis.powerEffects).forEach(([centerId, change]) => {
            if (Math.abs(change) > 0) {
                powerReasons[centerId] = 'Your tweet';
            }
        });

        this.state.applyEffects({
            chaosDelta: analysis.chaos,
            energyDelta: -analysis.energyCost,
            power: analysis.powerEffects
        }, { source: 'tweet', powerReasons });


        input.value = '';

        // Show detailed feedback
        this.showTweetFeedback(analysis);

        // If responding to crisis or breaking news, dismiss it
        if (this.respondingToCrisis) {
            this.respondingToCrisis = false;
            
            // Dismiss breaking news modal if present
            const modal = document.querySelector('.breaking-news-modal');
            if (modal) modal.remove();
            
            this.showNotification(
                '📰 Crisis resolved. Select another headline when you are ready to respond again.',
                'info',
                10000
            );
            const crisisPanel = document.getElementById('crisisPanel');
            if (crisisPanel) {
                crisisPanel.style.display = 'none';
            }
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
            warnings: [],
            politicalContext: {},
            socialImplications: {},
            viralPotential: 0,
            controversyLevel: 0
        };

        // ENHANCED POLITICAL CONTEXT DETECTION
        const politicalContexts = this.detectPoliticalContext(lower);
        analysis.politicalContext = politicalContexts;

        // CURRENT US POLITICAL LANDSCAPE AWARENESS
        const currentIssues = this.analyzeCurrentPoliticalIssues(lower);
        analysis.socialImplications = currentIssues;

        // ENHANCED TONE DETECTION WITH POLITICAL NUANCE
        const toneAnalysis = this.analyzePoliticalTone(lower, politicalContexts, currentIssues);
        analysis.tone = toneAnalysis.tone;
        analysis.chaos += toneAnalysis.chaosDelta;
        analysis.controversyLevel = toneAnalysis.controversyLevel;
        analysis.viralPotential = toneAnalysis.viralPotential;

        // Apply tone-based power effects
        Object.assign(analysis.powerEffects, toneAnalysis.powerEffects);

        // PROFANITY CHECK
        const profanity = ['damn', 'hell', 'crap', 'shit', 'fuck', 'ass'];
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

    // ENHANCED POLITICAL CONTEXT DETECTION
    detectPoliticalContext(text) {
        const contexts = {
            domestic: false,
            foreign: false,
            economic: false,
            social: false,
            cultural: false,
            environmental: false,
            security: false,
            healthcare: false,
            education: false,
            immigration: false
        };

        // Current hot-button issues (2024-2025)
        const contextPatterns = {
            domestic: ['congress', 'senate', 'house', 'supreme court', 'federal', 'states', 'election', 'voting', 'gerrymandering', 'impeachment'],
            foreign: ['china', 'russia', 'ukraine', 'taiwan', 'israel', 'palestine', 'iran', 'north korea', 'nato', 'un', 'embassy', 'sanctions'],
            economic: ['inflation', 'recession', 'gdp', 'unemployment', 'jobs', 'wages', 'taxes', 'deficit', 'debt', 'fed', 'interest rates', 'market'],
            social: ['abortion', 'lgbtq', 'trans', 'race', 'police', 'protest', 'blm', 'civil rights', 'equality', 'discrimination', 'diversity'],
            cultural: ['woke', 'cancel culture', 'free speech', 'censorship', 'social media', 'big tech', 'disinformation', 'misinformation'],
            environmental: ['climate', 'global warming', 'carbon', 'renewable', 'fossil fuels', 'epa', 'green new deal', 'emissions'],
            security: ['border', 'immigration', 'refugees', 'terrorism', 'cybersecurity', 'defense', 'military', 'veterans'],
            healthcare: ['medicare', 'medicaid', 'obamacare', 'healthcare', 'insurance', 'pharmaceutical', 'drug prices', 'mental health'],
            education: ['schools', 'college', 'student debt', 'teachers', 'curriculum', 'critical race theory', 'book bans'],
            immigration: ['border', 'wall', 'asylum', 'daca', 'visa', 'deportation', 'ice', 'migrants', 'refugees']
        };

        for (const [context, keywords] of Object.entries(contextPatterns)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                contexts[context] = true;
            }
        }

        return contexts;
    }

    // CURRENT US POLITICAL ISSUES ANALYSIS
    analyzeCurrentPoliticalIssues(text) {
        const implications = {
            polarizing: false,
            bipartisan: false,
            generational: false,
            regional: false,
            classBased: false,
            identityPolitics: false,
            conspiracy: false,
            mainstream: false
        };

        // Highly polarizing current issues
        const polarizingTerms = ['abortion', 'trans', 'woke', 'critical race theory', 'defund police', 'border wall', 'election fraud', 'vaccine mandate'];
        if (polarizingTerms.some(term => text.includes(term))) {
            implications.polarizing = true;
            implications.controversyLevel = 'high';
        }

        // Bipartisan appeal terms
        const bipartisanTerms = ['infrastructure', 'jobs', 'economy', 'veterans', 'national security', 'healthcare costs'];
        if (bipartisanTerms.some(term => text.includes(term))) {
            implications.bipartisan = true;
        }

        // Generational divide issues
        const generationalTerms = ['student debt', 'social security', 'climate change', 'social media', 'crypto', 'ai'];
        if (generationalTerms.some(term => text.includes(term))) {
            implications.generational = true;
        }

        // Regional issues
        const regionalTerms = ['rural', 'urban', 'coastal', 'heartland', 'rust belt', 'sun belt'];
        if (regionalTerms.some(term => text.includes(term))) {
            implications.regional = true;
        }

        // Identity politics
        const identityTerms = ['white privilege', 'systemic racism', 'patriarchy', 'toxic masculinity', 'cisgender', 'heteronormative'];
        if (identityTerms.some(term => text.includes(term))) {
            implications.identityPolitics = true;
            implications.controversyLevel = 'high';
        }

        // Conspiracy-adjacent terms
        const conspiracyTerms = ['deep state', 'establishment', 'elites', 'globalists', 'mainstream media', 'fake news'];
        if (conspiracyTerms.some(term => text.includes(term))) {
            implications.conspiracy = true;
            implications.controversyLevel = 'medium';
        }

        return implications;
    }

    // ENHANCED POLITICAL TONE ANALYSIS
    analyzePoliticalTone(text, contexts, implications) {
        const result = {
            tone: 'neutral',
            chaosDelta: 0,
            controversyLevel: 0,
            viralPotential: 0,
            powerEffects: {}
        };

        // AGGRESSIVE/PROVOCATIVE TONE DETECTION
        const aggressivePatterns = [
            { pattern: /attack|destroy|crush|annihilate|obliterate/, weight: 3, tone: 'aggressive' },
            { pattern: /pathetic|loser|failure|disaster|nightmare/, weight: 2, tone: 'insulting' },
            { pattern: /war|battle|fight|combat/, weight: 2, tone: 'combative' },
            { pattern: /enemy|foe|adversary/, weight: 2, tone: 'hostile' }
        ];

        // DIPLOMATIC/STATESMAN TONE DETECTION
        const diplomaticPatterns = [
            { pattern: /cooperate|collaborate|partnership|alliance/, weight: 2, tone: 'diplomatic' },
            { pattern: /discuss|dialogue|negotiate|compromise/, weight: 2, tone: 'conciliatory' },
            { pattern: /unite|together|bipartisan|common ground/, weight: 2, tone: 'unifying' },
            { pattern: /respect|honor|dignity|integrity/, weight: 1, tone: 'respectful' }
        ];

        // POPULIST/OUTSIDER TONE DETECTION
        const populistPatterns = [
            { pattern: /drain the swamp|establishment|elites|corrupt/, weight: 2, tone: 'populist' },
            { pattern: /forgotten|left behind|working class|real americans/, weight: 2, tone: 'populist' },
            { pattern: /rigged|rigged system|broken system/, weight: 2, tone: 'anti-establishment' }
        ];

        // PROGRESSIVE/LIBERAL TONE DETECTION
        const progressivePatterns = [
            { pattern: /equity|inclusion|diversity|representation/, weight: 2, tone: 'progressive' },
            { pattern: /systemic|institutional|structural change/, weight: 2, tone: 'reformist' },
            { pattern: /climate justice|social justice|economic justice/, weight: 2, tone: 'activist' }
        ];

        // CONSERVATIVE/TRADITIONAL TONE DETECTION
        const conservativePatterns = [
            { pattern: /traditional values|family values|moral/, weight: 2, tone: 'traditional' },
            { pattern: /law and order|tough on crime|personal responsibility/, weight: 2, tone: 'authoritarian' },
            { pattern: /free market|small government|individual liberty/, weight: 2, tone: 'libertarian' }
        ];

        // Analyze tone patterns
        const allPatterns = [
            ...aggressivePatterns,
            ...diplomaticPatterns,
            ...populistPatterns,
            ...progressivePatterns,
            ...conservativePatterns
        ];

        let maxScore = 0;
        let dominantTone = 'neutral';

        allPatterns.forEach(({ pattern, weight, tone }) => {
            const matches = (text.match(pattern) || []).length;
            const score = matches * weight;
            if (score > maxScore) {
                maxScore = score;
                dominantTone = tone;
            }
        });

        result.tone = dominantTone;

        // Apply tone-specific effects
        switch (dominantTone) {
            case 'aggressive':
            case 'insulting':
            case 'combative':
                result.chaosDelta += 20;
                result.controversyLevel = 8;
                result.viralPotential = 7;
                result.powerEffects = { military: 10, media: -15, public: 15 };
                break;
            case 'diplomatic':
            case 'conciliatory':
            case 'unifying':
                result.chaosDelta -= 8;
                result.controversyLevel = 2;
                result.viralPotential = 3;
                result.powerEffects = { congress: 12, media: 10, public: 8 };
                break;
            case 'populist':
            case 'anti-establishment':
                result.chaosDelta += 15;
                result.controversyLevel = 6;
                result.viralPotential = 8;
                result.powerEffects = { public: 20, media: -10, congress: -8 };
                break;
            case 'progressive':
            case 'reformist':
            case 'activist':
                result.chaosDelta += 10;
                result.controversyLevel = 5;
                result.viralPotential = 6;
                result.powerEffects = { public: 12, media: 8, science: 10 };
                break;
            case 'traditional':
            case 'authoritarian':
            case 'libertarian':
                result.chaosDelta += 5;
                result.controversyLevel = 4;
                result.viralPotential = 4;
                result.powerEffects = { military: 8, industry: 6, public: 6 };
                break;
        }

        // Adjust based on political context
        if (implications.polarizing) {
            result.chaosDelta += 15;
            result.controversyLevel += 3;
            result.viralPotential += 4;
        }

        if (implications.bipartisan) {
            result.chaosDelta -= 5;
            result.controversyLevel = Math.max(0, result.controversyLevel - 2);
        }

        if (implications.conspiracy) {
            result.chaosDelta += 12;
            result.controversyLevel += 2;
            result.viralPotential += 3;
            result.powerEffects.media = (result.powerEffects.media || 0) - 10;
        }

        return result;
    }

    // OPPOSITION AI LOOP
    oppositionAILoop() {
        const now = Date.now();
        
        // Check if any opposition should respond to recent news or player tweets
        this.oppositionAI.forEach(opponent => {
            if (now - opponent.lastTweet > opponent.responseTime && this.rand() < 0.3) {
                this.generateOppositionResponse(opponent);
            }
        });

        // Check for influencer endorsements
        this.checkInfluencerEndorsements();

        // Update public opinion battles
        this.updatePublicOpinionBattles();

        // Check for Twitter war escalations
        this.updateTwitterWars();
    }

    // GENERATE OPPOSITION RESPONSES
    generateOppositionResponse(opponent) {
        const recentNews = this.currentNewsStories.slice(0, 3);
        const recentPlayerTweets = this.history.tweets.slice(-2);
        
        let responseTarget = null;
        let responseType = 'news';

        // 60% chance to respond to news, 40% to player tweets
        if (this.rand() < 0.6 && recentNews.length > 0) {
            responseTarget = recentNews[Math.floor(this.rand() * recentNews.length)];
        } else if (recentPlayerTweets.length > 0) {
            responseTarget = recentPlayerTweets[Math.floor(this.rand() * recentPlayerTweets.length)];
            responseType = 'tweet';
        }

        if (!responseTarget) return;

        const response = this.createOppositionTweet(opponent, responseTarget, responseType);
        this.processOppositionTweet(opponent, response);
    }

    // CREATE OPPOSITION TWEET
    createOppositionTweet(opponent, target, type) {
        const templates = this.getOppositionTemplates(opponent, type);
        const template = templates[Math.floor(this.rand() * templates.length)];
        
        let tweet = template;
        
        // Replace placeholders
        if (type === 'news') {
            tweet = tweet.replace('{news}', target.headline.substring(0, 50) + '...');
        } else {
            tweet = tweet.replace('{tweet}', target.content.substring(0, 30) + '...');
        }

        // Add opponent's signature style
        if (opponent.personality.direct > 80) {
            tweet = tweet.replace(/\./g, '!');
        }

        return {
            content: tweet,
            target: target,
            type: type,
            timestamp: Date.now(),
            opponent: opponent
        };
    }

    // OPPOSITION TWEET TEMPLATES
    getOppositionTemplates(opponent, type) {
        const baseTemplates = {
            progressive: {
                news: [
                    "This is exactly why we need {news} - the status quo isn't working!",
                    "While others dither, real leaders would address {news} head-on.",
                    "{news} shows the urgent need for systemic change.",
                    "This is what happens when we don't prioritize {news} - working families suffer."
                ],
                tweet: [
                    "That's a dangerous position on {tweet} - we need facts, not fear.",
                    "This kind of rhetoric about {tweet} is exactly what's wrong with politics.",
                    "Instead of attacking, let's focus on solutions for {tweet}.",
                    "The American people deserve better than this response to {tweet}."
                ]
            },
            conservative: {
                news: [
                    "This {news} is exactly what I've been warning about.",
                    "The left's policies have led to {news} - time for real leadership.",
                    "While the establishment ignores {news}, I'm fighting for solutions.",
                    "This is why we need strong leadership on {news} - not weak compromises."
                ],
                tweet: [
                    "This response to {tweet} shows a complete lack of understanding.",
                    "The American people see through this spin on {tweet}.",
                    "Instead of deflecting on {tweet}, let's address the real issues.",
                    "This is exactly the kind of response that got us into this mess with {tweet}."
                ]
            },
            populist: {
                news: [
                    "The elites don't care about {news} - but I do!",
                    "This {news} proves the system is rigged against working Americans.",
                    "While DC insiders ignore {news}, I'm fighting for you!",
                    "The establishment created this {news} - time for real change!"
                ],
                tweet: [
                    "This is exactly the kind of elite thinking that created {tweet}.",
                    "The swamp doesn't understand {tweet} - but the American people do!",
                    "This response to {tweet} shows how out of touch they are.",
                    "While they play games with {tweet}, I'm fighting for real solutions."
                ]
            }
        };

        return baseTemplates[opponent.ideology]?.[type] || baseTemplates.progressive[type];
    }

    // PROCESS OPPOSITION TWEET
    processOppositionTweet(opponent, response) {
        opponent.lastTweet = Date.now();
        
        // Analyze the opposition tweet for effects
        const analysis = this.analyzeTweet(response.content);
        
        // Create public opinion battle if this is a direct response to player
        if (response.type === 'tweet') {
            this.createPublicOpinionBattle(opponent, response, analysis);
        }

        // Show notification
        this.showOppositionTweet(opponent, response, analysis);

        // Apply effects to power centers
        const powerEffects = {};
        const powerReasons = {};
        Object.entries(analysis.powerEffects).forEach(([center, change]) => {
            if (Math.abs(change) > 0) {
                powerEffects[center] = -change * 0.5; // Opposition effects are negative for player
                powerReasons[center] = `${opponent.name}'s response`;
            }
        });

        this.state.applyEffects({
            chaosDelta: analysis.chaos * 0.3,
            power: powerEffects
        }, { source: 'opposition-tweet', powerReasons, opponent: opponent.name });

        // Track for analytics
        this.trackEvent('opposition_tweet', {
            opponent: opponent.name,
            content: response.content,
            analysis: analysis
        });
    }

    // SHOW OPPOSITION TWEET NOTIFICATION
    showOppositionTweet(opponent, response, analysis) {
        const notif = document.createElement('div');
        notif.className = 'opposition-tweet-notification';
        notif.innerHTML = `
            <div class="opposition-header">
                <strong>${opponent.name} ${opponent.twitterHandle}</strong>
                <span class="opposition-influence">${opponent.followers.toLocaleString()} followers</span>
            </div>
            <div class="opposition-content">${this.sanitizeText(response.content)}</div>
            <div class="opposition-effects">
                ${analysis.controversyLevel > 5 ? '🔥 High controversy' : ''}
                ${analysis.viralPotential > 6 ? '📈 Going viral' : ''}
            </div>
        `;
        
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 8000);
    }

    // PUBLIC OPINION BATTLES
    createPublicOpinionBattle(opponent, response, analysis) {
        const battle = new PublicOpinionBattleGame(
            this,
            opponent,
            this.extractTopic(response.content),
            {
                playerScore: 50,
                opponentScore: 50,
            }
        );

        this.activeBattles.push(battle);

        this.inbox.addNotification(
            `🗞️ New public opinion battle started with ${opponent.name} over ${battle.topic}!`,
            'info',
            { opponent: opponent.name, topic: battle.topic }
        );
    }

    // EXTRACT TOPIC FROM TWEET
    extractTopic(content) {
        const topics = {
            'economy': ['economy', 'jobs', 'inflation', 'market', 'recession'],
            'immigration': ['border', 'immigration', 'asylum', 'refugees'],
            'healthcare': ['healthcare', 'medicare', 'insurance', 'drugs'],
            'climate': ['climate', 'environment', 'carbon', 'renewable'],
            'foreign policy': ['china', 'russia', 'ukraine', 'nato', 'war'],
            'social issues': ['abortion', 'lgbtq', 'race', 'police', 'protest']
        };

        const lower = content.toLowerCase();
        for (const [topic, keywords] of Object.entries(topics)) {
            if (keywords.some(keyword => lower.includes(keyword))) {
                return topic;
            }
        }
        return 'general politics';
    }

    // SHOW PUBLIC OPINION BATTLE
    showPublicOpinionBattle(battle) {
        const battleEl = document.createElement('div');
        battleEl.className = 'public-opinion-battle';
        battleEl.innerHTML = `
            <div class="battle-header">
                <h4>🗳️ Public Opinion Battle: ${battle.topic}</h4>
                <div class="battle-timer">${Math.ceil(battle.duration / 1000)}s</div>
            </div>
            <div class="battle-scores">
                <div class="score player-score">
                    <span>You: ${battle.playerScore}%</span>
                    <div class="score-bar"><div class="score-fill" style="width: ${battle.playerScore}%"></div></div>
                </div>
                <div class="score opponent-score">
                    <span>${battle.opponent.name}: ${battle.opponentScore}%</span>
                    <div class="score-bar"><div class="score-fill" style="width: ${battle.opponentScore}%"></div></div>
                </div>
            </div>
            <div class="battle-actions">
                <button onclick="game.engageInBattle('${battle.id}', 'counter')">Counter Attack</button>
                <button onclick="game.engageInBattle('${battle.id}', 'deflect')">Deflect</button>
                <button onclick="game.engageInBattle('${battle.id}', 'ignore')">Ignore</button>
            </div>
        `;
        
        const crisisPanel = document.getElementById('crisisPanel');
        if (crisisPanel) {
            crisisPanel.appendChild(battleEl);
        }
        
        // Auto-remove after duration
        setTimeout(() => {
            if (battleEl.parentNode) {
                this.resolvePublicOpinionBattle(battle);
                battleEl.remove();
            }
        }, battle.duration);
    }

    // ENGAGE IN PUBLIC OPINION BATTLE
    engageInBattle(battleId, action) {
        const battle = this.publicOpinionBattles.find(b => b.id == battleId);
        if (!battle) return;

        const effects = {
            counter: { player: 15, opponent: -10, chaos: 10 },
            deflect: { player: 5, opponent: -5, chaos: 5 },
            ignore: { player: -5, opponent: 10, chaos: -5 }
        };

        const effect = effects[action];
        battle.playerScore = Math.max(0, Math.min(100, battle.playerScore + effect.player));
        battle.opponentScore = Math.max(0, Math.min(100, battle.opponentScore + effect.opponent));

        this.state.applyEffects({
            chaosDelta: effect.chaos
        }, { source: 'public-opinion-battle', action });

        this.showNotification(`🗳️ ${action} action in ${battle.topic} battle!`);
    }

    // RESOLVE PUBLIC OPINION BATTLE
    resolvePublicOpinionBattle(battle) {
        const winner = battle.playerScore > battle.opponentScore ? 'player' : 'opponent';
        const margin = Math.abs(battle.playerScore - battle.opponentScore);
        
        if (winner === 'player') {
            this.state.applyEffects({
                power: { public: margin * 0.5 },
                scoreDelta: margin * 10
            }, { source: 'public-opinion-victory', topic: battle.topic });
            this.showNotification(`🏆 Victory in ${battle.topic} opinion battle! +${margin * 0.5} public support`);
        } else {
            this.state.applyEffects({
                power: { public: -margin * 0.3 },
                chaosDelta: margin * 0.2
            }, { source: 'public-opinion-defeat', topic: battle.topic });
            this.showNotification(`💥 Lost ${battle.topic} opinion battle to ${battle.opponent.name}`);
        }

        // Remove from active battles
        this.publicOpinionBattles = this.publicOpinionBattles.filter(b => b.id !== battle.id);
    }

    // UPDATE PUBLIC OPINION BATTLES
    updatePublicOpinionBattles() {
        this.publicOpinionBattles.forEach(battle => {
            const elapsed = Date.now() - battle.startTime;
            if (elapsed >= battle.duration) {
                this.resolvePublicOpinionBattle(battle);
            }
        });
    }

    // CHECK INFLUENCER ENDORSEMENTS
    checkInfluencerEndorsements() {
        this.influencers.forEach(influencer => {
            if (Date.now() - influencer.last_endorsement > 300000 && this.rand() < 0.1) { // 10% chance every 5 minutes
                this.generateInfluencerEndorsement(influencer);
            }
        });
    }

    // GENERATE INFLUENCER ENDORSEMENT
    generateInfluencerEndorsement(influencer) {
        const endorsement = {
            influencer: influencer,
            type: this.rand() < 0.5 ? 'positive' : 'negative',
            topic: this.getRandomTopic(),
            timestamp: Date.now()
        };

        influencer.last_endorsement = Date.now();

        const effect = endorsement.type === 'positive' ? 
            influencer.endorsement_value : -influencer.endorsement_value;

        this.state.applyEffects({
            power: { public: effect },
            chaosDelta: endorsement.type === 'negative' ? 5 : -2
        }, { source: 'influencer-endorsement', influencer: influencer.name });

        this.showInfluencerEndorsement(endorsement);
    }

    // SHOW INFLUENCER ENDORSEMENT
    showInfluencerEndorsement(endorsement) {
        const notif = document.createElement('div');
        notif.className = `influencer-endorsement ${endorsement.type}`;
        notif.innerHTML = `
            <div class="influencer-header">
                <strong>${endorsement.influencer.name}</strong>
                <span class="influencer-category">${endorsement.influencer.category}</span>
            </div>
            <div class="endorsement-content">
                ${endorsement.type === 'positive' ? '✅ Endorses' : '❌ Criticizes'} your stance on ${endorsement.topic}
            </div>
            <div class="endorsement-impact">
                ${endorsement.type === 'positive' ? '+' : ''}${endorsement.influencer.endorsement_value} public opinion
            </div>
        `;
        
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 6000);
    }

    // GET RANDOM TOPIC
    getRandomTopic() {
        const topics = ['economy', 'immigration', 'healthcare', 'climate', 'foreign policy', 'social issues'];
        return topics[Math.floor(this.rand() * topics.length)];
    }

    // UPDATE TWITTER WARS
    updateTwitterWars() {
        // Implementation for Twitter war escalations
        // This would track ongoing conflicts and escalate them
    }

    // OPPOSITION AI SYSTEM
    initializeOppositionAI() {
        return [
            {
                name: 'Sen. Elizabeth Warren',
                party: 'Democrat',
                ideology: 'progressive',
                twitterHandle: '@ewarren',
                followers: 2800000,
                influence: 85,
                aggression: 60,
                lastTweet: 0,
                personality: {
                    direct: 80,
                    policy_focused: 90,
                    populist: 70,
                    combative: 60
                },
                currentIssues: ['economic inequality', 'corporate power', 'climate change'],
                responseTime: 30000 // 30 seconds average
            },
            {
                name: 'Rep. Marjorie Taylor Greene',
                party: 'Republican',
                ideology: 'populist',
                twitterHandle: '@mtgreenee',
                followers: 1200000,
                influence: 75,
                aggression: 95,
                lastTweet: 0,
                personality: {
                    direct: 95,
                    policy_focused: 40,
                    populist: 95,
                    combative: 95
                },
                currentIssues: ['border security', 'election integrity', 'cultural issues'],
                responseTime: 15000 // 15 seconds average
            },
            {
                name: 'Gov. Ron DeSantis',
                party: 'Republican',
                ideology: 'conservative',
                twitterHandle: '@rondesantis',
                followers: 1800000,
                influence: 80,
                aggression: 70,
                lastTweet: 0,
                personality: {
                    direct: 70,
                    policy_focused: 80,
                    populist: 60,
                    combative: 70
                },
                currentIssues: ['education', 'law enforcement', 'economic policy'],
                responseTime: 45000 // 45 seconds average
            },
            {
                name: 'Rep. Alexandria Ocasio-Cortez',
                party: 'Democrat',
                ideology: 'progressive',
                twitterHandle: '@aoc',
                followers: 3500000,
                influence: 90,
                aggression: 75,
                lastTweet: 0,
                personality: {
                    direct: 85,
                    policy_focused: 85,
                    populist: 80,
                    combative: 75
                },
                currentIssues: ['climate justice', 'healthcare', 'economic reform'],
                responseTime: 20000 // 20 seconds average
            }
        ];
    }

    // INFLUENCER SYSTEM
    initializeInfluencers() {
        return [
            {
                name: 'Elon Musk',
                category: 'tech_ceo',
                followers: 150000000,
                influence: 95,
                political_leaning: 'libertarian',
                endorsement_value: 25,
                controversy_level: 8,
                last_endorsement: 0
            },
            {
                name: 'Taylor Swift',
                category: 'entertainment',
                followers: 95000000,
                influence: 90,
                political_leaning: 'progressive',
                endorsement_value: 30,
                controversy_level: 2,
                last_endorsement: 0
            },
            {
                name: 'Joe Rogan',
                category: 'podcast',
                followers: 14000000,
                influence: 80,
                political_leaning: 'independent',
                endorsement_value: 20,
                controversy_level: 6,
                last_endorsement: 0
            },
            {
                name: 'Ben Shapiro',
                category: 'media',
                followers: 5000000,
                influence: 75,
                political_leaning: 'conservative',
                endorsement_value: 15,
                controversy_level: 7,
                last_endorsement: 0
            },
            {
                name: 'Rachel Maddow',
                category: 'media',
                followers: 3000000,
                influence: 70,
                political_leaning: 'progressive',
                endorsement_value: 18,
                controversy_level: 4,
                last_endorsement: 0
            }
        ];
    }

    showTweetFeedback(analysis) {
        const feedback = document.createElement('div');
        feedback.className = 'tweet-feedback';
        
        const header = document.createElement('strong');
        header.textContent = 'Enhanced Tweet Analysis:';
        feedback.appendChild(header);
        feedback.appendChild(document.createElement('br'));

        // Enhanced tone analysis
        const toneLine = document.createTextNode(`Tone: ${analysis.tone.toUpperCase()} | Chaos: +${analysis.chaos}`);
        feedback.appendChild(toneLine);
        feedback.appendChild(document.createElement('br'));

        // Political context
        if (analysis.politicalContext) {
            const activeContexts = Object.entries(analysis.politicalContext)
                .filter(([_, active]) => active)
                .map(([context, _]) => context);
            
            if (activeContexts.length > 0) {
                const contextDiv = document.createElement('div');
                contextDiv.className = 'political-context';
                contextDiv.textContent = `Political Context: ${activeContexts.join(', ')}`;
                feedback.appendChild(contextDiv);
            }
        }

        // Social implications
        if (analysis.socialImplications) {
            const implications = Object.entries(analysis.socialImplications)
                .filter(([_, active]) => active)
                .map(([implication, _]) => implication);
            
            if (implications.length > 0) {
                const implicationsDiv = document.createElement('div');
                implicationsDiv.className = 'political-context';
                implicationsDiv.textContent = `Social Impact: ${implications.join(', ')}`;
                feedback.appendChild(implicationsDiv);
            }
        }

        // Viral potential and controversy
        if (analysis.viralPotential > 5) {
            const viralDiv = document.createElement('div');
            viralDiv.className = 'viral-potential';
            viralDiv.textContent = `📈 High viral potential (${analysis.viralPotential}/10)`;
            feedback.appendChild(viralDiv);
        }

        if (analysis.controversyLevel > 5) {
            const controversyDiv = document.createElement('div');
            controversyDiv.className = 'controversy-level';
            controversyDiv.textContent = `🔥 High controversy level (${analysis.controversyLevel}/10)`;
            feedback.appendChild(controversyDiv);
        }

        if (analysis.warnings.length > 0) {
            const warnLine = document.createTextNode(`⚠️ ${analysis.warnings.join(' ')}`);
            feedback.appendChild(warnLine);
            feedback.appendChild(document.createElement('br'));
        }

        const significantEffects = Object.entries(analysis.powerEffects)
            .filter(([_, val]) => Math.abs(val) >= 5)
            .map(([center, val]) => {
                const c = this.powerCenters.find(p => p.id === center);
                return c ? `${c.icon} ${val > 0 ? '+' : ''}${val}` : '';
            })
            .filter(s => s);

        if (significantEffects.length > 0) {
            const impactLine = document.createTextNode(`Impact: ${significantEffects.join(', ')}`);
            feedback.appendChild(impactLine);
        }

        const feedbackContainer = document.getElementById('tweetFeedback');
        if (feedbackContainer) {
            feedbackContainer.appendChild(feedback);
            setTimeout(() => feedback.remove(), 8000); // Longer display time for enhanced analysis
        }
    }

    focusTwitter() {
        this.respondingToCrisis = true; // Mark that we're responding via tweet
        const input = document.getElementById('tweetInput');
        if (!input) {
            console.warn('Tweet input element not found');
            return;
        }
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
            // Use Guardian API instead of NewsAPI
            const response = await fetch(
                '/api/guardian?' +
                'q=politics OR congress OR president OR senate OR china OR russia OR economy OR scandal OR military OR healthcare&' +
                'section=politics,us-news,world&' +
                'pageSize=15&' +
                'orderBy=newest'
            );

            if (!response.ok) throw new Error('Guardian API failed');

            const data = await response.json();
            
            if (!data.response || !data.response.results || data.response.results.length === 0) {
                throw new Error('No articles');
            }

            // Transform Guardian API format to internal format
            const newsStories = data.response.results.map(article => {
                const summary = article.fields?.standfirst
                    || article.fields?.trailText
                    || (article.fields?.bodyText ? article.fields.bodyText.substring(0, 300) : null)
                    || 'Click to read more about this developing story.';

                const fullText = article.fields?.bodyText || summary;

                return {
                    headline: article.webTitle,
                    source: article.sectionName || 'The Guardian',
                    description: summary,
                    fullText,
                    relevance: this.calculateRelevance(
                        article.webTitle,
                        summary
                    ),
                    category: this.categorizeNews(
                        article.webTitle,
                        summary
                    ),
                    affectedCenters: this.identifyAffectedCenters(
                        article.webTitle,
                        summary
                    ),
                    timestamp: new Date(article.webPublicationDate).getTime()
                };
            });

            // Merge with existing stories and deduplicate
            const allStories = [...this.currentNewsStories, ...newsStories];
            this.currentNewsStories = this.deduplicateNews(allStories);
            
            this.cacheNews(this.currentNewsStories);
            this.displayNewsTicker();
            this.lastNewsFetch = Date.now();

            const breakingNews = this.currentNewsStories.filter(s => s.relevance >= 0.85);
            if (breakingNews.length > 0 && this.rand() < 0.2) {
                console.log('🚨 BREAKING NEWS triggered for:', breakingNews[0].headline, `(relevance: ${breakingNews[0].relevance.toFixed(2)})`);
                setTimeout(() => this.triggerBreakingNews(breakingNews[0]), 2000);
            }

            console.log('✅ Fetched', newsStories.length, 'new stories from Guardian API');
            
        } catch (error) {
            console.error('Guardian API fetch failed:', error);
            // Fall back to RSS
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
        let score = 0;

        const criticalKeywords = ['breaking', 'urgent', 'crisis', 'emergency', 'threatens', 'war', 'nuclear', 'attack', 'impeach', 'resign'];
        let criticalMatches = 0;
        criticalKeywords.forEach(keyword => {
            if (text.includes(keyword)) criticalMatches++;
        });

        if (criticalMatches >= 2) {
            score = 0.8;
        } else if (criticalMatches === 1) {
            score = 0.5;
        } else {
            score = 0.2;
        }

        const highKeywords = ['president', 'congress', 'senate', 'white house', 'scandal', 'trump', 'biden', 'government', 'federal', 'supreme court'];
        let highMatches = 0;
        highKeywords.forEach(keyword => {
            if (text.includes(keyword)) highMatches++;
        });

        if (highMatches >= 2) score += 0.15;
        else if (highMatches === 1) score += 0.05;

        const medKeywords = ['election', 'bill', 'policy', 'democrat', 'republican', 'nato', 'china', 'russia', 'military', 'economy'];
        let medMatches = 0;
        medKeywords.forEach(keyword => {
            if (text.includes(keyword)) medMatches++;
        });

        if (medMatches >= 2) score += 0.08;

        console.log(`📊 Relevance for "${(title || '').substring(0, 50)}...": ${score.toFixed(2)} (critical: ${criticalMatches}, high: ${highMatches}, med: ${medMatches})`);

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
        if (!ticker) {
            console.warn('News ticker container not found');
            return;
        }
        
        ticker.innerHTML = '';

        // Deduplicate before displaying
        const uniqueStories = this.deduplicateNews(this.currentNewsStories);

        uniqueStories.forEach((story, index) => {
            const item = document.createElement('div');
            item.className = 'news-item';
            
            // Add relevance-based styling
            if (story.relevance > 0.8) {
                item.classList.add('breaking-news');
            } else if (story.relevance > 0.6) {
                item.classList.add('important-news');
            }

            // Add emoji badge based on relevance and category
            let badge = '📰';
            if (story.relevance > 0.8) badge = '🔥';
            else if (story.relevance > 0.6) badge = '⚡';
            else if (story.relevance > 0.4) badge = '📊';
            
            // Add category-specific badges
            if (story.category === 'foreign') badge = '🌍';
            else if (story.category === 'economy') badge = '💰';
            else if (story.category === 'military') badge = '🛡️';
            else if (story.category === 'domestic') badge = '🏛️';

            const safeSource = this.sanitizeText(story.source);
            const safeHeadline = this.sanitizeText(story.headline);
            
            item.innerHTML = `
                <div class="news-badge">${badge}</div>
                <div class="news-content">
                    <div class="news-source">${safeSource}</div>
                    <div class="news-headline">${safeHeadline}</div>
                    <div class="news-relevance">Relevance: ${Math.round(story.relevance * 100)}%</div>
                </div>
            `;
            
            item.onclick = () => this.respondToNews(story);
            
            // Add staggered animation
            item.style.animationDelay = `${index * 0.1}s`;
            item.classList.add('news-item-enter');
            
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

        const safeHeadline = this.sanitizeText(story.headline);
        this.showNotification(
            `📰 Responding to: ${safeHeadline.substring(0, 50)}...`,
            'info'
        );
    }

    // ============= ADAPTIVE CRISIS GENERATION =============

    async generateAdaptiveCrisis(story) {
        try {
            const headline = story?.headline || 'Developing situation';
            const category = story?.category || 'domestic';
            const description = story?.description || '';
            const fullText = story?.fullText || description;

            const identified = Array.isArray(story?.affectedCenters) && story.affectedCenters.length > 0
                ? story.affectedCenters
                : this.identifyAffectedCenters(headline, description) || [];
            const affectedCenters = identified.length > 0
                ? identified
                : this.guessAffectedCenters(category);

            let usedAI = false;
            let options = await this.generateAICrisisOptions(headline);
            if (Array.isArray(options) && options.length >= 3) {
                usedAI = true;
                this.aiUsed = true;
            } else {
                console.log('⚠️ Using handcrafted options');
                options = this.generateHandcraftedOptions(story, affectedCenters);
            }

            this.currentCrisis = {
                newsStory: story,
                title: `RESPOND: ${headline}`,
                description,
                fullText,
                affectedCenters,
                options
            };

            this.aiShadowMode = !usedAI;

            this.displayCrisis();

            this.trackEvent('crisis_generated', {
                headline,
                category,
                affectedCenters,
                source: story?.source || 'news',
                usedAI
            });
        } catch (err) {
            console.error('Crisis generation error:', err);
            this.currentCrisis = {
                newsStory: story,
                title: 'RESPOND: Crisis Requires Response',
                description: story?.description || 'Immediate action needed',
                fullText: story?.fullText || story?.description || 'Immediate action needed',
                affectedCenters: ['congress', 'public'],
                options: this.generateHandcraftedOptions(story, ['congress', 'public'])
            };
            this.displayCrisis();
        }
    }

    async generateAICrisisOptions(headline) {
        try {
            console.log('🤖 Requesting AI options for:', headline);

            const aiResponse = await this.fetchAINarrative({
                headline,
                generationType: 'crisis_options'
            });

            if (!aiResponse?.narrative?.options || !Array.isArray(aiResponse.narrative.options)) {
                throw new Error('Bad AI response structure');
            }

            const known = this.knownPowerCentersSet();
            const gameOptions = [];

            for (const aiOpt of aiResponse.narrative.options) {
                const effects = [];
                const rels = aiOpt.effects?.relationships || [];

                for (const rel of rels) {
                    if (!rel?.center) continue;
                    const centerId = String(rel.center).toLowerCase().trim();
                    const change = Number(rel.change);
                    if (!known.has(centerId) || !Number.isFinite(change) || change === 0) continue;
                    effects.push({ center: centerId, change });
                }

                const chaos = Number.isFinite(aiOpt.chaos) ? aiOpt.chaos : 10;
                const rawEnergy = Number(aiOpt.energy);
                const energy = Number.isFinite(rawEnergy) && rawEnergy !== 0 ? Math.abs(rawEnergy) : 15;
                const text = aiOpt.text?.trim() || 'AI Response';

                if (text && text !== 'AI Response') {
                    gameOptions.push({ text, effects, chaos, energy });
                }
            }

            console.log(`✅ Converted ${gameOptions.length} AI options`);
            return gameOptions;
        } catch (err) {
            console.warn('AI generation failed:', err);
            return null;
        }
        const safeSource = this.sanitizeText(story.source);
        return `${safeSource} reports this breaking development. Your response will impact: ${centerNames}`;
    }

    generateHandcraftedOptions(story, affectedCenters) {
        const centers = Array.isArray(affectedCenters) && affectedCenters.length
            ? affectedCenters
            : ['public', 'media'];
        const rawHeadline = this.sanitizeText(story?.headline || '');
        const headline = rawHeadline.toLowerCase();
        const options = [];

        // Determine category from story
        const category = story?.category || this.categorizeNews(story?.headline, story?.description);

        const hasChina = headline.includes('china') || headline.includes('xi');
        const hasRussia = headline.includes('russia') || headline.includes('putin');
        const hasMarkets = headline.includes('market') || headline.includes('stock');
        const hasScandal = headline.includes('scandal') || headline.includes('investigation');

        if (hasChina) {
            options.push({
                text: `🚢 Deploy carrier group to South China Sea`,
                effects: [
                    { center: 'military', change: 18 },
                    { center: 'wallstreet', change: -15 },
                    { center: 'intelligence', change: 10 }
                ],
                chaos: 25,
                energy: 25
            });
        } else if (hasRussia) {
            options.push({
                text: `💣 Authorize lethal aid shipment`,
                effects: [
                    { center: 'military', change: 15 },
                    { center: 'congress', change: -10 },
                    { center: 'intelligence', change: 12 }
                ],
                chaos: 22,
                energy: 25
            });
        }

        const extractKeyTopic = (text) => {
            const h = text.toLowerCase();
            if (h.includes('china') || h.includes('xi')) return 'China';
            if (h.includes('russia') || h.includes('putin')) return 'Russia';
            if (h.includes('iran')) return 'Iran';
            if (h.includes('north korea') || h.includes('kim')) return 'North Korea';
            if (h.includes('ukraine')) return 'Ukraine';
            if (h.includes('israel') || h.includes('palestine')) return 'Israel';
            if (h.includes('taiwan')) return 'Taiwan';
            if (h.includes('market') || h.includes('stock')) return 'markets';
            if (h.includes('inflation') || h.includes('economy')) return 'economy';
            if (h.includes('congress') || h.includes('senate')) return 'Congress';
            if (h.includes('scandal') || h.includes('investigation')) return 'scandal';
            return 'this situation';
        };

        const keyTopic = extractKeyTopic(headline);
        const shortHeadline = (story.headline || '').substring(0, 40);

        console.log(`🎮 Generating options for: "${story.headline}" (Category: ${category}, Topic: ${keyTopic})`);

        if (category === 'foreign') {
            const aggressiveText = keyTopic === 'China'
                ? `💪 Confront China directly on "${shortHeadline}..."`
                : keyTopic === 'Russia'
                    ? `⚔️ Impose harsh sanctions over "${shortHeadline}..."`
                    : keyTopic === 'Iran'
                        ? `🎯 Issue military ultimatum regarding "${shortHeadline}..."`
                        : `💪 Take aggressive stance on "${shortHeadline}..."`;

            options.push({
                text: aggressiveText,
                effects: affectedCenters.map(id => {
                    if (id === 'military') return { center: id, change: 15 };
                    if (id === 'wallstreet') return { center: id, change: -12 };
                    if (id === 'intelligence') return { center: id, change: 10 };
                    if (id === 'public') return { center: id, change: 8 };
                    return { center: id, change: 3 };
                }),
                chaos: 20,
                energy: 25
            });
        } else if (category === 'economy') {
            const economicText = headline.includes('inflation')
                ? `🏦 Emergency action on inflation: "${shortHeadline}..."`
                : headline.includes('market')
                    ? `💵 Stabilize markets after "${shortHeadline}..."`
                    : headline.includes('unemploy')
                        ? `💼 Launch jobs program responding to "${shortHeadline}..."`
                        : `📊 Strong economic intervention: "${shortHeadline}..."`;

            options.push({
                text: economicText,
                effects: affectedCenters.map(id => {
                    if (id === 'wallstreet') return { center: id, change: 12 };
                    if (id === 'industry') return { center: id, change: 10 };
                    if (id === 'public') return { center: id, change: 8 };
                    return { center: id, change: 5 };
                }),
                chaos: 12,
                energy: 20
            });
        } else if (hasScandal) {
            options.push({
                text: `⚔️ Attack accusers over "${shortHeadline}..."`,
                effects: affectedCenters.map(id => {
                    if (id === 'media') return { center: id, change: -20 };
                    if (id === 'public') return { center: id, change: 10 };
                    if (id === 'congress') return { center: id, change: -10 };
                    return { center: id, change: -5 };
                }),
                chaos: 25,
                energy: 15
            });
        } else {
            options.push({
                text: `💪 Take decisive action on "${shortHeadline}..."`,
                effects: affectedCenters.map(id => {
                    if (id === 'military' || id === 'intelligence') return { center: id, change: 10 };
                    if (id === 'media') return { center: id, change: -5 };
                    if (id === 'public') return { center: id, change: 12 };
                    return { center: id, change: 5 };
                }),
                chaos: 15,
                energy: 20
            });
        }

        if (hasChina) {
            options.push({
                text: `📞 Request emergency call with Xi Jinping`,
                effects: [
                    { center: 'congress', change: 10 },
                    { center: 'intelligence', change: 12 },
                    { center: 'military', change: -8 }
                ],
                chaos: 5,
                energy: 20
            });
        }

        if (category === 'foreign') {
            options.push({
                text: `🤝 Seek diplomatic solution with ${keyTopic}`,
                effects: affectedCenters.map(id => {
                    if (id === 'congress') return { center: id, change: 12 };
                    if (id === 'military') return { center: id, change: -8 };
                    if (id === 'media') return { center: id, change: 10 };
                    return { center: id, change: 5 };
                }),
                chaos: -5,
                energy: 15
            });
        } else if (hasMarkets) {
            options.push({
                text: `📊 Work with Fed on interest rate strategy`,
                effects: [
                    { center: 'wallstreet', change: 10 },
                    { center: 'industry', change: 8 }
                ],
                chaos: -5,
                energy: 15
            });
        } else if (category === 'scandal') {
            options.push({
                text: `🛡️ Lawyer up and stonewall on "${shortHeadline}..."`,
                effects: affectedCenters.map(id => {
                    if (id === 'media') return { center: id, change: -10 };
                    if (id === 'public') return { center: id, change: -5 };
                    if (id === 'congress') return { center: id, change: 5 };
                    return { center: id, change: 2 };
                }),
                chaos: 8,
                energy: 12
            });
        } else {
            options.push({
                text: `🏛️ Form bipartisan commission to investigate`,
                effects: [
                    { center: 'congress', change: 12 },
                    { center: 'media', change: 8 }
                ],
                chaos: -5,
                energy: 12
            });
        }

        options.push({
            text: `🐦 Tweet about it (focus Twitter)`,
            effects: [
                { center: 'public', change: 12 },
                { center: 'media', change: -10 }
            ],
            chaos: 10,
            energy: 8
        });

        if (hasMarkets) {
            options.push({
                text: `🏦 Propose emergency economic relief package`,
                effects: [
                    { center: 'wallstreet', change: 15 },
                    { center: 'public', change: 12 },
                    { center: 'congress', change: -10 }
                ],
                chaos: 12,
                energy: 25
            });
        } else if (hasScandal) {
            options.push({
                text: `🎤 Schedule prime-time press conference`,
                effects: [
                    { center: 'media', change: 12 },
                    { center: 'public', change: 8 }
                ],
                chaos: 10,
                energy: 20,
                action: 'pressConference'
            });
        } else {
            options.push({
                text: `⚡ Issue executive order addressing situation`,
                effects: centers.map(id => ({
                    center: id,
                    change: id === 'congress' ? -8 : 10
                })),
                chaos: 18,
                energy: 20
            });
        }

        if (category === 'scandal') {
            options.push({
                text: `🎤 Emergency press conference on "${shortHeadline}..."`,
                effects: affectedCenters.map(id => {
                    if (id === 'media') return { center: id, change: 10 };
                    if (id === 'public') return { center: id, change: 8 };
                    return { center: id, change: 3 };
                }),
                chaos: 5,
                energy: 15,
                action: 'pressConference'
            });
        } else if (category === 'foreign' && (keyTopic === 'China' || keyTopic === 'Russia')) {
            options.push({
                text: `📞 Call emergency meeting with ${keyTopic} leader`,
                effects: affectedCenters.map(id => {
                    if (id === 'intelligence') return { center: id, change: 15 };
                    if (id === 'congress') return { center: id, change: 10 };
                    if (id === 'military') return { center: id, change: 5 };
                    return { center: id, change: 5 };
                }),
                chaos: 10,
                energy: 20
            });
        } else {
            options.push({
                text: `🔥 Go on offensive about ${keyTopic}`,
                effects: affectedCenters.map(id => {
                    if (id === 'public') return { center: id, change: 10 };
                    if (id === 'media') return { center: id, change: -12 };
                    if (id === 'congress') return { center: id, change: -8 };
                    return { center: id, change: -5 };
                }),
                chaos: 22,
                energy: 15
            });
        }

        console.log(`✅ Generated ${options.length} SPECIFIC options for ${keyTopic}`);
        return options;
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

        const safeSource = this.sanitizeText(story?.source || 'News Source');
        return `${safeSource} reports this breaking development. Your response will impact: ${centerNames}`;
    }

    displayCrisis() {
        if (!this.currentCrisis) return;

        const crisisPanel = document.getElementById('crisisPanel');
        if (crisisPanel) {
            crisisPanel.style.display = 'block';
        }

        const crisis = this.currentCrisis;

        this.assert(Array.isArray(crisis.options) && crisis.options.length, 'crisis has no options');
        this.assert(Number.isFinite(this.chaos) && this.chaos >= 0 && this.chaos <= 100, 'chaos out of range');

        this.safeSetText('crisisTitle', this.sanitizeText(crisis.title));

        const descriptionEl = document.getElementById('crisisDescription');
        if (descriptionEl) {
            const safeDescription = this.sanitizeText(crisis.description || '');
            const safeFullText = this.sanitizeText(crisis.fullText || crisis.description || '');

            descriptionEl.innerHTML = `
                <div class="crisis-summary">
                    <p style="color: #ddd; line-height: 1.6; margin-bottom: 15px;">${safeDescription}</p>
                    ${crisis.fullText && crisis.fullText !== crisis.description ? `
                        <details style="margin-top: 10px;">
                            <summary style="cursor: pointer; color: var(--primary-gold); font-weight: 600; margin-bottom: 10px;">
                                📰 Read Full Story
                            </summary>
                            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; color: #ddd; line-height: 1.6; margin-top: 10px;">
                                ${safeFullText.substring(0, 800)}${safeFullText.length > 800 ? '...' : ''}
                            </div>
                        </details>
                    ` : ''}
                </div>
            `;
        }

        const affectedEl = document.getElementById('affectedCenters');
        if (affectedEl) {
            affectedEl.innerHTML = '';
            crisis.affectedCenters.forEach(id => {
                const center = this.powerCenters.find(p => p.id === id);
                if (!center) return;
                const badge = document.createElement('span');
                badge.className = 'affected-badge';
                badge.textContent = `${center.icon} ${center.name}`;
                affectedEl.appendChild(badge);
            });
        }

        const optionsDiv = document.getElementById('crisisOptions');
        if (optionsDiv) {
            optionsDiv.innerHTML = '';

            crisis.options.forEach(option => {
                const btn = document.createElement('button');
                btn.classList.add('decision-btn');
                btn.setAttribute('data-testid', 'decision-btn');
                const label = document.createElement('span');
                label.textContent = this.sanitizeText(option.text);
                btn.appendChild(label);

                const preview = document.createElement('div');
                preview.className = 'option-preview';
                preview.textContent = `Chaos: ${option.chaos > 0 ? '+' : ''}${option.chaos} | Energy: -${option.energy}`;
                btn.appendChild(preview);
                btn.onclick = () => this.handleDecision(option);
                optionsDiv.appendChild(btn);
            });
        }

        const panel = document.getElementById('crisisPanel');
        if (panel) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    handleDecision(option) {
        const crisisTitle = this.currentCrisis?.title ?? 'Unknown Crisis';
        const crisisCategory = this.currentCrisis?.newsStory?.category;
        this.trackEvent('decision_made', {
            crisis: crisisTitle,
            option: option.text,
            category: crisisCategory,
            chaos: option.chaos,
            energy: option.energy
        });

        if (option.action === 'focusTwitter') {
            this.focusTwitter();
            return;
        }
        if (option.action === 'pressConference') {
            this.startPressConference();
        }

        const crisisPanel = document.getElementById('crisisPanel');
        if (crisisPanel) {
            crisisPanel.style.opacity = '0.5';
        }
        this.safeSetText('crisisTitle', '⏳ Processing your decision...');
        this.safeSetText('crisisDescription', 'Calculating effects on power centers and relationships...');
        const optionsEl = document.getElementById('crisisOptions');
        if (optionsEl) optionsEl.innerHTML = '';

        const powerEffects = {};
        const powerReasons = {};
        (Array.isArray(option.effects) ? option.effects : []).forEach(effect => {
            if (!effect || !effect.center) return;
            powerEffects[effect.center] = (powerEffects[effect.center] || 0) + (effect.change || 0);
            powerReasons[effect.center] = 'Your decision';
        });

        const chaosDelta = option.chaos || 0;
        const energyCost = Math.max(0, Number(option.energy || 0));
        const scoreDelta = Math.abs(chaosDelta) * 5;

        this.state.applyEffects({
            chaosDelta,
            energyDelta: -energyCost,
            power: powerEffects,
            scoreDelta
        }, { source: 'decision', powerReasons, option: option.text });

        const decisionCategory =
            crisisCategory ??
            this.currentCrisis?.category ??
            'unknown';
        this.history.decisions.push({
            crisis: crisisTitle,
            option: option.text,
            category: decisionCategory,
            chaos: option.chaos ?? 0,
            energy: option.energy ?? 0,
            effects: option.effects,
            timestamp: Date.now()
        });

        const optionText = typeof option.text === 'string' ? option.text : String(option.text ?? 'Decision');
        const truncated = optionText.length > 40 ? `${optionText.substring(0, 40)}...` : optionText;
        this.showNotification(`✅ Decision made: ${truncated}`);

        setTimeout(() => {
            if (crisisPanel) {
                crisisPanel.style.opacity = '1';
                crisisPanel.style.display = 'none';
            }
            this.currentCrisis = null;
        }, 1000);
    }

    // ============= BREAKING NEWS ALERT =============

    triggerBreakingNews(story) {
        const existing = document.querySelector('.breaking-news-modal');
        if (existing) return;

        const modal = document.createElement('div');
        modal.className = 'breaking-news-modal';

        const content = document.createElement('div');
        content.className = 'breaking-news-content';

        const badge = document.createElement('div');
        badge.className = 'breaking-badge';
        badge.textContent = '🚨 BREAKING NEWS 🚨';
        content.appendChild(badge);

        const title = document.createElement('h2');
        title.textContent = this.sanitizeText(story.headline);
        content.appendChild(title);

        const summary = document.createElement('p');
        summary.style.color = '#ddd';
        summary.style.margin = '20px 0';
        summary.style.lineHeight = '1.6';
        summary.textContent = this.sanitizeText(story.description || 'This requires immediate presidential response!');
        content.appendChild(summary);

        const centers = document.createElement('div');
        centers.className = 'breaking-power-centers';
        story.affectedCenters.forEach(id => {
            const center = this.powerCenters.find(p => p.id === id);
            if (!center) return;
            const badgeEl = document.createElement('span');
            badgeEl.className = 'affected-badge';
            badgeEl.textContent = `${center.icon} ${center.name}`;
            centers.appendChild(badgeEl);
        });
        content.appendChild(centers);

        const buttons = document.createElement('div');
        buttons.style.display = 'flex';
        buttons.style.gap = '10px';
        buttons.style.marginTop = '20px';

        const respondBtn = document.createElement('button');
        respondBtn.className = 'breaking-btn primary';
        respondBtn.textContent = 'RESPOND NOW';
        respondBtn.addEventListener('click', () => this.respondToBreakingNews(story));
        buttons.appendChild(respondBtn);

        const ignoreBtn = document.createElement('button');
        ignoreBtn.className = 'breaking-btn secondary';
        ignoreBtn.textContent = 'Ignore (Chaos +10)';
        ignoreBtn.addEventListener('click', () => this.dismissBreakingNews());
        buttons.appendChild(ignoreBtn);

        content.appendChild(buttons);
        modal.appendChild(content);

        document.body.appendChild(modal);

        // Auto-dismiss after 15 seconds
        const modalId = `breaking-${Date.now()}`;
        modal.id = modalId;

        setTimeout(() => {
            const currentModal = document.getElementById(modalId);
            if (currentModal && currentModal.parentNode) {
                this.state.applyEffects({ chaosDelta: 10 }, { source: 'breaking-news-timeout' });
                currentModal.remove();
                this.showNotification('⚠️ Ignored breaking news - chaos increased!');
            }
        }, 15000);
    }

    respondToBreakingNews(story) {
        const modal = document.querySelector('.breaking-news-modal');
        if (modal) modal.remove();

        if (!story) return;

        const match = this.currentNewsStories.find(s => s.headline === story.headline && s.source === story.source);
        this.generateAdaptiveCrisis(match || story);
    }

    dismissBreakingNews() {
        const modal = document.querySelector('.breaking-news-modal');
        if (modal) modal.remove();
        this.state.applyEffects({
            chaosDelta: 10,
            power: { media: -10 }
        }, { source: 'breaking-news-ignore', powerReasons: { media: 'Ignored breaking news' } });
        this.showNotification('⚠️ Breaking news ignored - media trust drops');
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
            // No cached news available - show error
            this.showLoadingError();
        }
    }

    // Mock news system removed - using only real news now

    // ============= EXISTING SYSTEMS =============

    generateContextualCrisis() {
        // DISABLED: Crisis panel only shows when clicking a news headline
        console.log('⚠️ Crisis panel disabled - click news to respond');
    }

    gameLoop() {
        this.day = this.day + 1;
        this.state.applyEffects({ energyDelta: -2, scoreDelta: 10 }, { source: 'game-loop' });

        // Small random power center drift
        if (this.rand() < 0.3) {
            const randomCenter = this.powerCenters[Math.floor(this.rand() * this.powerCenters.length)];
            const drift = (this.rand() - 0.5) * 4;
            this.updatePowerCenter(randomCenter.id, drift, 'Daily drift');
        }
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
            this.state.applyEffects({
                chaosDelta: -10,
                energyDelta: -10,
                scoreDelta: 50
            }, { source: 'phone-call-success', caller: caller.name });
            this.updateRelationshipValues(caller.name, 10, 5, 0);
            this.showNotification(`✅ Successful negotiation with ${caller.name}!`);
        } else {
            // Failure
            this.state.applyEffects({
                chaosDelta: 10,
                energyDelta: -10
            }, { source: 'phone-call-failure', caller: caller.name });
            this.updateRelationshipValues(caller.name, -10, -5, 10);
            this.showNotification(`❌ ${caller.name} rejects your proposal!`);
        }

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
        const pressConference = document.getElementById('pressConference');
        if (pressConference) {
            pressConference.classList.add('active');
        }
        this.setupReporters();
    }

    endPressConference() {
        const pressConference = document.getElementById('pressConference');
        if (pressConference) {
            pressConference.classList.remove('active');
        }
    }

    setupReporters() {
        const row = document.getElementById('reportersRow');
        if (!row) {
            console.warn('Reporters row container not found');
            return;
        }
        row.innerHTML = '';

        this.reporters.forEach(reporter => {
            const reporterEl = document.createElement('div');
            reporterEl.className = `reporter ${reporter.mood}`;
            const nameDiv = document.createElement('div');
            nameDiv.style.fontWeight = 'bold';
            nameDiv.textContent = reporter.name;
            reporterEl.appendChild(nameDiv);

            const outletDiv = document.createElement('div');
            outletDiv.style.fontSize = '12px';
            outletDiv.textContent = reporter.outlet;
            reporterEl.appendChild(outletDiv);
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
        const powerEffects = {};
        const powerReasons = {};
        if (effect.media) {
            powerEffects.media = effect.media;
            powerReasons.media = 'Press conference';
        }
        if (effect.public) {
            powerEffects.public = effect.public;
            powerReasons.public = 'Press conference';
        }

        this.state.applyEffects({
            chaosDelta: effect.chaos || 0,
            energyDelta: -5,
            scoreDelta: 20,
            power: powerEffects
        }, { source: 'press-response', powerReasons, style });

        this.showNotification(`You ${style} the question!`);
        this.currentReporter = null;
        document.getElementById('currentQuestion').textContent = '';
    }

    displayRelationships() {
        const grid = document.getElementById('relationshipsGrid');
        if (!grid) {
            console.warn('Relationships grid container not found');
            return;
        }
        grid.innerHTML = '';

        this.relationships.forEach(rel => {
            if (!Array.isArray(rel.history)) rel.history = [];
            const card = document.createElement('div');
            card.className = 'relationship-card';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'relationship-name';
            nameDiv.textContent = rel.name;
            card.appendChild(nameDiv);

            const roleDiv = document.createElement('div');
            roleDiv.style.fontSize = '12px';
            roleDiv.style.color = '#aaa';
            roleDiv.textContent = rel.role;
            card.appendChild(roleDiv);

            const meter = document.createElement('div');
            meter.className = 'meter';
            const fill = document.createElement('div');
            fill.className = 'meter-fill trust-fill';
            fill.style.width = `${rel.trust}%`;
            meter.appendChild(fill);
            card.appendChild(meter);

            const trustLabel = document.createElement('div');
            trustLabel.style.fontSize = '10px';
            trustLabel.textContent = `Trust: ${rel.trust}%`;
            card.appendChild(trustLabel);

            card.addEventListener('click', () => this.showCallModal(rel));

            const historyBtn = document.createElement('button');
            historyBtn.className = 'history-toggle';
            historyBtn.textContent = 'Show History';
            historyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const historyDiv = card.querySelector('.relationship-history');
                if (!historyDiv) return;
                const isHidden = historyDiv.style.display === 'none';
                historyDiv.style.display = isHidden ? 'block' : 'none';
                historyBtn.textContent = isHidden ? 'Hide History' : 'Show History';
            });
            card.appendChild(historyBtn);

            const historyDiv = document.createElement('div');
            historyDiv.className = 'relationship-history';
            historyDiv.style.display = 'none';

            if (rel.history.length === 0) {
                const empty = document.createElement('div');
                empty.textContent = 'No history recorded yet.';
                historyDiv.appendChild(empty);
            } else {
                rel.history.forEach(entry => {
                    const entryDiv = document.createElement('div');
                    const date = new Date(entry.timestamp || Date.now()).toLocaleDateString();
                    const eventText = typeof entry.event === 'string' && entry.event.length
                        ? entry.event
                        : 'Event';
                    const trustChange = Number(entry.trustChange || 0);
                    const respectChange = Number(entry.respectChange || 0);
                    const fearChange = Number(entry.fearChange || 0);
                    entryDiv.textContent = `${date}: ${eventText} (T:${trustChange}, R:${respectChange}, F:${fearChange})`;
                    historyDiv.appendChild(entryDiv);
                });
            }

            card.appendChild(historyDiv);
            card.onclick = () => this.initiatePhoneCall(rel);
            grid.appendChild(card);
        });
    }

    updateDisplay() {
        const dayEl = document.getElementById('day');
        const energyEl = document.getElementById('energy');
        const chaosEl = document.getElementById('chaos');
        const scoreEl = document.getElementById('score');
        
        if (dayEl) dayEl.textContent = this.day;
        if (energyEl) energyEl.textContent = this.energy;
        if (chaosEl) chaosEl.textContent = this.chaos;
        if (scoreEl) scoreEl.textContent = this.score;
    }

    setupNotificationsContainer() {
        let container = document.getElementById('notificationsContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationsContainer';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'info', duration = 10000, dismissible = true, metadata = {}) {
        const id = this.notificationId++;

        // Add to inbox
        const inboxNotificationId = this.inbox.addNotification(message, type, metadata);

        const notification = {
            id,
            message: this.sanitizeText(message),
            type,
            timestamp: Date.now(),
            duration,
            metadata,
        };

        this.notifications.push(notification);

        const notifEl = document.createElement('div');
        notifEl.className = 'notification';
        notifEl.dataset.notificationId = id;

        const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };

        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        icon.textContent = icons[type] || '';

        const content = document.createElement('div');
        content.className = 'notification-content';
        content.textContent = notification.message;

        notifEl.appendChild(icon);
        notifEl.appendChild(content);

        if (inboxNotificationId) {
            notifEl.dataset.inboxNotificationId = inboxNotificationId;
        }

        // Click to expand
        notifEl.onclick = () => {
            this.inbox.openNotificationDetail(inboxNotificationId ?? this.inbox.notifications.find(n => n.message === message)?.id);
        };

        if (dismissible) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'notification-close';
            closeBtn.type = 'button';
            closeBtn.textContent = '×';
            closeBtn.ariaLabel = 'Close notification';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.dismissNotification(id);
            };
            notifEl.appendChild(closeBtn);
        }

        const container = document.getElementById('notificationsContainer');
        container.appendChild(notifEl);

        if (duration > 0) {
            setTimeout(() => this.dismissNotification(id), duration);
        }

        this.enforceNotificationLimit();
    }

    dismissNotification(id) {
        const notifEl = document.querySelector(`[data-notification-id="${id}"]`);
        if (notifEl) {
            notifEl.style.animation = 'slideOutRight 0.4s ease-in forwards';
            setTimeout(() => notifEl.remove(), 400);
        }
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    enforceNotificationLimit() {
        const container = document.getElementById('notificationsContainer');
        const notifs = Array.from(container.children);

        if (notifs.length > this.maxVisibleNotifications) {
            const toRemove = notifs.length - this.maxVisibleNotifications;
            for (let i = 0; i < toRemove; i++) {
                const oldestId = parseInt(notifs[i].dataset.notificationId);
                this.dismissNotification(oldestId);
            }
        }
    }

    clearAllNotifications() {
        this.notifications.forEach(n => this.dismissNotification(n.id));
    }
}

window.addEventListener('unhandledrejection', e => window.game?.debugTrace('unhandled rejection', { reason: String(e.reason) }));
window.addEventListener('error', e => window.game?.debugTrace('error', { msg: e.message, src: e.filename, line: e.lineno }));

console.log('President Simulator - Smart Twitter Edition loaded');
window.startPresidency = startPresidency;
