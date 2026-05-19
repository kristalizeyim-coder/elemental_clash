/**
 * Echo: Elemental Chains — UI Control
 * Renders game state, handles user input, manages AI turns and game flow.
 */
class UIController {
    constructor() {
        this.engine = new GameEngine();
        this.ai = new AIOpponent('medium');
        this.selectedCardId = null;
        this.isAnimating = false;
        this.hasStarted = false;

        // DOM refs
        this.dom = {
            playerHand:    document.getElementById('player-hand'),
            aiHand:        document.getElementById('ai-hand'),
            battlefieldSlot: document.getElementById('battlefield-slot'),
            playerScore:   document.getElementById('player-score'),
            aiScore:       document.getElementById('ai-score'),
            playerEchoCount: document.getElementById('player-echo-count'),
            aiEchoCount:   document.getElementById('ai-echo-count'),
            playerEchoCards: document.getElementById('player-echo-cards'),
            aiEchoCards:   document.getElementById('ai-echo-cards'),
            statusBar:     document.getElementById('status-bar'),
            logList:       document.getElementById('game-log-list'),
            interOverlay:  document.getElementById('interaction-overlay'),
            interTitle:    document.getElementById('inter-title'),
            interCards:    document.getElementById('inter-cards'),
            interDesc:     document.getElementById('inter-desc'),
            interSinergy:  document.getElementById('inter-sinergy'),
            interPoints:   document.getElementById('inter-points'),
            interContinue: document.getElementById('inter-continue-btn'),
            gameOverOverlay: document.getElementById('game-over-overlay'),
            goTitle:       document.getElementById('go-title'),
            goScore:       document.getElementById('go-score'),
            goMsg:         document.getElementById('go-msg'),
            restartBtn:    document.getElementById('restart-btn'),
            goCountdown:   document.getElementById('go-countdown'),
            roundDisplay:  document.getElementById('round-display'),
            playerAvatar:  document.getElementById('player-avatar'),
            aiAvatar:      document.getElementById('ai-avatar'),
            infoBtn:       document.getElementById('info-btn'),
            infoOverlay:   document.getElementById('info-overlay'),
            infoCloseBtn:  document.getElementById('info-close-btn'),
            landingOverlay: document.getElementById('landing-overlay'),
            landingPlayBtn: document.getElementById('landing-play-btn'),
            lobbyOverlay:  document.getElementById('lobby-overlay'),
            lobbyTest:     document.getElementById('lobby-test'),
            mainGameUi:    document.getElementById('main-game-ui'),
        };

        this.bindEvents();
        // Don't auto-start — wait for landing page OYNA click
    }

    bindEvents() {
        this.dom.interContinue.addEventListener('click', () => this.dismissInteraction());
        this.dom.restartBtn.addEventListener('click', () => this.startGame());

        // Landing page play button
        this.dom.landingPlayBtn.addEventListener('click', () => this.dismissLanding());

        // Lobby test button
        this.dom.lobbyTest.addEventListener('click', () => this.dismissLobby());

        // Info button
        this.dom.infoBtn.addEventListener('click', () => this.dom.infoOverlay.classList.add('active'));
        this.dom.infoCloseBtn.addEventListener('click', () => this.dom.infoOverlay.classList.remove('active'));
        this.dom.infoOverlay.addEventListener('click', (e) => {
            if (e.target === this.dom.infoOverlay) this.dom.infoOverlay.classList.remove('active');
        });

        // Difficulty buttons
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.ai.difficulty = btn.dataset.diff;
            });
        });

        // Engine events
        this.engine.on('log', msg => this.addLog(msg));
        this.engine.on('gameOver', data => this.showGameOver(data));
    }

    dismissLanding() {
        // Fade out the landing overlay
        this.dom.landingOverlay.classList.add('fade-out');
        this.dom.landingOverlay.classList.remove('active');

        // Show lobby after fade
        setTimeout(() => {
            this.dom.landingOverlay.style.display = 'none';
            this.dom.lobbyOverlay.classList.add('active');
        }, 1200);
    }

    dismissLobby() {
        // Fade out the lobby overlay
        this.dom.lobbyOverlay.style.opacity = '0';
        this.dom.lobbyOverlay.style.pointerEvents = 'none';

        // Start the game after fade
        setTimeout(() => {
            this.dom.lobbyOverlay.style.display = 'none';
            this.dom.lobbyOverlay.classList.remove('active');
            this.dom.mainGameUi.style.display = 'block'; // Reveal game UI
            this.startGame();
        }, 600);
    }

    startGame() {
        // Cancel any pending auto-restart timer
        if (this.autoRestartTimer) {
            clearInterval(this.autoRestartTimer);
            this.autoRestartTimer = null;
        }

        this.dom.gameOverOverlay.classList.remove('active');
        this.dom.interOverlay.classList.remove('active');
        this.selectedCardId = null;
        this.isAnimating = false;

        // Track round number across resets
        this.roundNumber = (this.roundNumber || 0) + 1;

        this.engine.initGame();
        this.engine.log(`── Tur ${this.roundNumber} ──`);
        this.render();
        this.updateRoundDisplay();

        // If AI leads first, trigger AI turn
        if (this.engine.state.activePlayer === 'ai') {
            this.scheduleAITurn(800);
        }
    }

    updateRoundDisplay() {
        if (this.dom.roundDisplay) {
            this.dom.roundDisplay.textContent = `Tur ${this.roundNumber}`;
        }
    }

    // ============= RENDERING =============

    render() {
        this.renderPlayerHand();
        this.renderAIHand();
        this.renderBattlefield();
        this.renderScores();
        this.renderEchoCollections();
        this.updateStatus();
        this.updateActiveIndicator();
    }

    createCardElement(card, faceUp = true, clickable = false) {
        const div = document.createElement('div');
        div.className = `card ${card.element.toLowerCase()} card-deal-in`;
        div.dataset.cardId = card.id;

        if (faceUp) {
            div.innerHTML = `
                <div class="card-face">
                    <span class="card-corner top-left">${card.value}</span>
                    <span class="card-emoji">${card.emoji}</span>
                    <span class="card-value">${card.value}</span>
                    <span class="card-element-name">${card.elemName}</span>
                    <span class="card-corner bottom-right">${card.value}</span>
                </div>
            `;

            if (clickable) {
                div.addEventListener('click', () => this.onPlayerCardClick(card));
            }
        } else {
            div.innerHTML = `<div class="card-back"><span class="card-back-icon">✦</span></div>`;
            div.style.cursor = 'default';
        }

        return div;
    }

    renderPlayerHand() {
        this.dom.playerHand.innerHTML = '';
        const state = this.engine.state;
        const canAct = state.activePlayer === 'player' && !this.isAnimating && state.phase !== 'GAME_OVER';

        state.playerHand.forEach(card => {
            const el = this.createCardElement(card, true, canAct);
            if (!canAct) el.classList.add('disabled');
            if (this.selectedCardId === card.id) el.classList.add('selected');
            this.dom.playerHand.appendChild(el);
        });
    }

    renderAIHand() {
        this.dom.aiHand.innerHTML = '';
        const state = this.engine.state;
        state.aiHand.forEach(() => {
            const div = document.createElement('div');
            div.className = 'card card-deal-in';
            div.innerHTML = `<div class="card-back"><span class="card-back-icon">✦</span></div>`;
            div.style.cursor = 'default';
            this.dom.aiHand.appendChild(div);
        });
    }

    renderBattlefield() {
        this.dom.battlefieldSlot.innerHTML = '';
        const bf = this.engine.state.battlefield;
        if (bf) {
            const wrapper = document.createElement('div');
            wrapper.className = 'battlefield-card card-to-field';
            const cardEl = this.createCardElement(bf.card, true, false);
            cardEl.classList.remove('card-deal-in');
            wrapper.appendChild(cardEl);
            this.dom.battlefieldSlot.appendChild(wrapper);
        }
    }

    renderScores() {
        this.dom.playerScore.textContent = this.engine.state.playerScore;
        this.dom.aiScore.textContent = this.engine.state.aiScore;
        this.dom.playerEchoCount.textContent = `Echo: ${this.engine.state.playerEcho.length}`;
        this.dom.aiEchoCount.textContent = `Echo: ${this.engine.state.aiEcho.length}`;
    }

    renderEchoCollections() {
        this.renderEchoCards(this.dom.playerEchoCards, this.engine.state.playerEcho);
        this.renderEchoCards(this.dom.aiEchoCards, this.engine.state.aiEcho);
    }

    renderEchoCards(container, cards) {
        container.innerHTML = '';
        // Show last 12 cards as mini icons
        const show = cards.slice(-12);
        show.forEach(card => {
            const mini = document.createElement('div');
            mini.className = `echo-mini-card`;
            mini.style.borderColor = ELEMENT_META[card.element].color + '40';
            mini.style.color = ELEMENT_META[card.element].color;
            mini.textContent = card.emoji;
            mini.title = card.displayName;
            container.appendChild(mini);
        });
    }

    updateStatus() {
        const s = this.engine.state;
        let text = '';
        if (s.phase === 'GAME_OVER') {
            text = 'Oyun Bitti!';
        } else if (s.activePlayer === 'player') {
            if (s.phase === 'LEAD') text = 'Sahaya bir kart koy';
            else text = 'Saldırmak için bir kart seç';
        } else {
            text = 'Rakip düşünüyor...';
        }
        this.dom.statusBar.textContent = text;
    }

    updateActiveIndicator() {
        this.dom.playerAvatar.classList.remove('active-indicator');
        this.dom.aiAvatar.classList.remove('active-indicator');
        if (this.engine.state.activePlayer === 'player') {
            this.dom.playerAvatar.classList.add('active-indicator');
        } else {
            this.dom.aiAvatar.classList.add('active-indicator');
        }
    }

    addLog(msg) {
        const li = document.createElement('li');
        li.textContent = msg;
        li.classList.add('fade-in');
        this.dom.logList.appendChild(li);
        // Keep last 20 entries
        while (this.dom.logList.children.length > 20) {
            this.dom.logList.removeChild(this.dom.logList.firstChild);
        }
        this.dom.logList.parentElement.scrollTop = this.dom.logList.parentElement.scrollHeight;
    }

    // ============= PLAYER INTERACTION =============

    onPlayerCardClick(card) {
        if (this.isAnimating) return;
        if (this.engine.state.activePlayer !== 'player') return;
        if (this.engine.state.phase === 'GAME_OVER') return;

        // If same card clicked, deselect
        if (this.selectedCardId === card.id) {
            this.selectedCardId = null;
            this.renderPlayerHand();
            return;
        }

        // Select and play
        this.selectedCardId = card.id;
        this.renderPlayerHand();

        // Play after brief delay for visual feedback
        setTimeout(() => {
            this.selectedCardId = null;
            const result = this.engine.playCard(card.id, 'player');
            if (!result) return;

            if (result.action === 'lead') {
                this.render();
                // If game ended on lead (opponent had no cards), don't schedule AI
                if (!result.gameOver && this.engine.state.phase !== 'GAME_OVER') {
                    this.scheduleAITurn(1000);
                }
            } else if (result.action === 'attack') {
                // Show interaction
                this.showInteraction(result.result);
            }
        }, 250);
    }

    // ============= AI TURN =============

    scheduleAITurn(delay = 800) {
        this.isAnimating = true;
        this.render();

        setTimeout(() => {
            const state = this.engine.state;
            if (state.phase === 'GAME_OVER' || state.activePlayer !== 'ai') {
                this.isAnimating = false;
                this.render();
                return;
            }

            const chosenCard = this.ai.chooseCard(state);
            if (!chosenCard) {
                this.isAnimating = false;
                this.render();
                return;
            }

            const result = this.engine.playCard(chosenCard.id, 'ai');
            if (!result) {
                this.isAnimating = false;
                this.render();
                return;
            }

            if (result.action === 'lead') {
                this.isAnimating = false;
                this.render();
                // If game ended on lead (player had no cards), stop here
                if (result.gameOver || this.engine.state.phase === 'GAME_OVER') return;
                // Player's turn to attack — render will enable hand
            } else if (result.action === 'attack') {
                this.showInteraction(result.result);
            }
        }, delay);
    }

    // ============= INTERACTION DISPLAY =============

    showInteraction(result) {
        this.isAnimating = true;

        // Play VFX
        VFX.playInteractionVFX(result);

        // Populate overlay
        this.dom.interTitle.textContent = result.title;
        this.dom.interDesc.textContent = result.description;

        // Cards display
        this.dom.interCards.innerHTML = '';
        const atkMini = this.createMiniCard(result.attackerCard, result.attackerOwner);
        const vs = document.createElement('span');
        vs.className = 'interaction-vs';
        vs.textContent = 'VS';
        const tgtMini = this.createMiniCard(result.targetCard, result.targetOwner);
        this.dom.interCards.append(atkMini, vs, tgtMini);

        // Sinergy info (removed — no multipliers)
        this.dom.interSinergy.textContent = '';

        // Points
        if (result.points > 0 && result.winnerPlayer) {
            const who = result.winnerPlayer === 'player' ? 'Sen' : 'Rakip';
            this.dom.interPoints.textContent = `${who}: +${result.points} Puan`;
            this.dom.interPoints.className = `interaction-points ${result.winnerPlayer === 'player' ? 'positive' : 'negative'}`;
        } else {
            this.dom.interPoints.textContent = 'Puan yok';
            this.dom.interPoints.className = 'interaction-points neutral';
        }

        // Show overlay
        setTimeout(() => {
            this.dom.interOverlay.classList.add('active');
        }, 500);
    }

    createMiniCard(card, owner) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mini-card-wrapper';
        wrapper.style.textAlign = 'center';

        const cardEl = this.createCardElement(card, true, false);
        cardEl.classList.remove('card-deal-in');
        cardEl.classList.add('mini-card');
        cardEl.style.cursor = 'default';

        const label = document.createElement('div');
        label.style.cssText = 'font-size:10px; margin-top:6px; color: var(--text-muted);';
        label.textContent = owner === 'player' ? 'Sen' : 'Rakip';

        wrapper.append(cardEl, label);
        return wrapper;
    }

    dismissInteraction() {
        this.dom.interOverlay.classList.remove('active');
        this.isAnimating = false;
        this.render();

        const state = this.engine.state;
        if (state.phase === 'GAME_OVER') return;

        // If AI's turn next, schedule it
        if (state.activePlayer === 'ai') {
            this.scheduleAITurn(600);
        }
    }

    // ============= GAME OVER =============

    showGameOver(data) {
        setTimeout(() => {
            if (data.playerScore > data.aiScore) {
                this.dom.goTitle.textContent = '🏆 Zafer!';
            } else if (data.aiScore > data.playerScore) {
                this.dom.goTitle.textContent = '😞 Mağlubiyet';
            } else {
                this.dom.goTitle.textContent = '🤝 Berabere';
            }
            this.dom.goScore.textContent = `${data.playerScore} — ${data.aiScore}`;
            this.dom.goMsg.textContent = data.msg;
            this.dom.gameOverOverlay.classList.add('active');

            // Start auto-restart countdown
            this.startAutoRestartCountdown();
        }, 800);
    }

    startAutoRestartCountdown() {
        const AUTO_RESTART_SECONDS = 5;
        let remaining = AUTO_RESTART_SECONDS;

        // Update button text with countdown
        const updateCountdown = () => {
            if (this.dom.restartBtn) {
                this.dom.restartBtn.textContent = `Yeni Tur (${remaining}s)`;
            }
            if (this.dom.goCountdown) {
                this.dom.goCountdown.textContent = `Yeni tur ${remaining} saniye içinde başlıyor...`;
                this.dom.goCountdown.style.display = 'block';
            }
        };

        updateCountdown();

        // Clear any existing timer
        if (this.autoRestartTimer) {
            clearInterval(this.autoRestartTimer);
        }

        this.autoRestartTimer = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(this.autoRestartTimer);
                this.autoRestartTimer = null;
                this.startGame();
            } else {
                updateCountdown();
            }
        }, 1000);
    }
}

// ============= INIT =============
document.addEventListener('DOMContentLoaded', () => {
    window.game = new UIController();
});
