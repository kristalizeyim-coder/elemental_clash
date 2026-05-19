/**
 * Echo: Elemental Chains — Core Game Engine
 * Card model, deck, interaction resolution, scoring with Echo Sinergy.
 */

// ============= CONSTANTS =============
const ELEMENTS = { AIR: 'AIR', FIRE: 'FIRE', WATER: 'WATER', EARTH: 'EARTH', JOKER: 'JOKER' };

const JOKER_POINTS = 15;

const ELEMENT_META = {
    AIR:   { name: 'Hava',   emoji: '🌪️', color: '#00e5ff', dark: '#004d5a', glow: 'rgba(0,229,255,0.4)' },
    FIRE:  { name: 'Ateş',   emoji: '🔥', color: '#ff6d00', dark: '#5a2600', glow: 'rgba(255,109,0,0.4)' },
    WATER: { name: 'Su',     emoji: '💧', color: '#448aff', dark: '#0d2f6b', glow: 'rgba(68,138,255,0.4)' },
    EARTH: { name: 'Toprak', emoji: '⛰️', color: '#76ff03', dark: '#2a5a00', glow: 'rgba(118,255,3,0.4)' },
    JOKER: { name: 'Joker',  emoji: '🃏', color: '#e040fb', dark: '#4a0072', glow: 'rgba(224,64,251,0.4)' }
};

const VALUE_NAMES = {
    1:'As', 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7',
    8:'8', 9:'9', 10:'10', 11:'Vale', 12:'Kız', 13:'Şah',
    15:'Joker'
};

// ============= INTERACTION TABLE =============
const INTERACTIONS = {
    AIR_EARTH:   { type:'PREDATOR', winner:'attacker', title:'🌪️ Hava Toprağı Aşındırdı!',   desc:'Hava, Toprağı aşındırarak ele geçirdi.',                     pts:(a,t)=>a+t, capture:true,  waterStays:false },
    AIR_FIRE:    { type:'PREY',     winner:'target',   title:'🔥 Ateş Havayı Yuttu!',         desc:'Hava, Ateşi besledi! Ateş kazandı.',
                     pts:(a,t)=>a+t, capture:true,  waterStays:false },
    AIR_WATER:   { type:'NEUTRAL',  winner:null,       title:'💧 Su Dayanıyor!',               desc:'Hava, Suyun üzerinden geçiyor. Su sahada kalıyor.',
                     pts:()=>0,     capture:false, waterStays:true },

    FIRE_AIR:    { type:'PREDATOR', winner:'attacker', title:'🔥 Ateş Havayı Tüketti!',        desc:'Ateş, Havayı yutarak kazandı.',
                     pts:(a,t)=>a+t, capture:true,  waterStays:false },
    FIRE_WATER:  { type:'PREY',     winner:null,       title:'💧 Su Ateşi Söndürdü!',          desc:'Ateş söndürüldü! Su sahada kalmaya devam ediyor.',
                     pts:()=>0,     capture:false, waterStays:true },
    FIRE_EARTH:  { type:'NEUTRAL',  winner:null,       title:'⚡ Etkisiz Çarpışma!',            desc:'Ateş, Toprağı yakamaz. Kartlar etkisizleşti.',
                     pts:()=>0,     capture:false, waterStays:false },

    WATER_FIRE:  { type:'PREDATOR', winner:'attacker', title:'💧 Su Ateşi Söndürdü!',          desc:'Su, Ateşi söndürerek zaferi kazandı!',
                     pts:(a,t)=>a+t,   capture:true,  waterStays:false },
    WATER_EARTH: { type:'PREY',     winner:'target',   title:'⛰️ Toprak Suyu Emdi!',           desc:'Su, Toprak tarafından emildi. Puanlar Toprağa gidiyor.',
                     pts:(a,t)=>a+t, capture:true,  waterStays:false },
    WATER_AIR:   { type:'NEUTRAL',  winner:null,       title:'⚡ Etkisiz Çarpışma!',            desc:'Su ve Hava birbirini etkileyemedi.',
                     pts:()=>0,     capture:false, waterStays:false },

    EARTH_WATER: { type:'PREDATOR', winner:'attacker', title:'⛰️ Toprak Suyu Emdi!',           desc:'Toprak, Suyu emerek puanlarını ele geçirdi.',
                     pts:(a,t)=>a+t, capture:true,  waterStays:false },
    EARTH_AIR:   { type:'PREY',     winner:'target',   title:'🌪️ Hava Toprağı Aşındırdı!',    desc:'Toprak, Hava tarafından aşındırılarak ele geçirildi.',
                     pts:(a,t)=>a+t, capture:true,  waterStays:false },
    EARTH_FIRE:  { type:'NEUTRAL',  winner:null,       title:'⚡ Etkisiz Çarpışma!',            desc:'Toprak, Ateşe karşı dayanıyor. Kartlar etkisizleşti.',
                     pts:()=>0,     capture:false, waterStays:false }
};

// ============= CARD CLASS =============
class Card {
    constructor(id, element, value) {
        this.id = id;
        this.element = element;
        this.value = value;
    }
    get meta()        { return ELEMENT_META[this.element]; }
    get emoji()       { return this.meta.emoji; }
    get elemName()    { return this.meta.name; }
    get valueName()   { return VALUE_NAMES[this.value]; }
    get displayName() { return `${this.emoji} ${this.elemName} ${this.valueName}`; }
}

// ============= GAME ENGINE =============
class GameEngine {
    constructor() {
        this.state = null;
        this.listeners = { stateChange: [], interaction: [], gameOver: [], log: [] };
    }

    on(event, fn) { this.listeners[event].push(fn); }
    emit(event, data) { this.listeners[event].forEach(fn => fn(data)); }
    log(msg) { if (this.state) this.state.gameLog.push(msg); this.emit('log', msg); }

    // Create and shuffle deck (52 element cards + 2 Jokers = 54 cards)
    createDeck() {
        const deck = [];
        let id = 0;
        for (const el of Object.values(ELEMENTS)) {
            if (el === 'JOKER') continue; // Jokers added separately
            for (let v = 1; v <= 13; v++) deck.push(new Card(id++, el, v));
        }
        // Add 2 Joker cards with fixed value of 15
        deck.push(new Card(id++, 'JOKER', JOKER_POINTS));
        deck.push(new Card(id++, 'JOKER', JOKER_POINTS));
        // Fisher-Yates shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    // Initialize a new game
    initGame() {
        const deck = this.createDeck();
        const SPECIAL_VALUES = [1, 11, 12, 13]; // As, Vale, Kız, Şah
        const MAX_SPECIALS = 3;

        // Deal 7 cards per player with max 3 special cards each
        const playerHand = [];
        const aiHand = [];
        let pSpecials = 0;
        let aSpecials = 0;

        // Separate deck into specials and normals (Jokers count as normal for this rule)
        const specials = deck.filter(c => SPECIAL_VALUES.includes(c.value));
        const normals = deck.filter(c => !SPECIAL_VALUES.includes(c.value));

        // Shuffle both pools
        const shuffle = (arr) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        };
        shuffle(specials);
        shuffle(normals);

        // Deal specials first (up to MAX_SPECIALS per player)
        while (specials.length > 0 && (pSpecials < MAX_SPECIALS || aSpecials < MAX_SPECIALS)) {
            if (playerHand.length >= 7 && aiHand.length >= 7) break;

            const card = specials.shift();

            // Alternate giving to player/ai, respecting caps and hand size
            if (pSpecials < MAX_SPECIALS && playerHand.length < 7 &&
                (aSpecials >= MAX_SPECIALS || aiHand.length >= 7 || Math.random() < 0.5)) {
                playerHand.push(card);
                pSpecials++;
            } else if (aSpecials < MAX_SPECIALS && aiHand.length < 7) {
                aiHand.push(card);
                aSpecials++;
            } else if (pSpecials < MAX_SPECIALS && playerHand.length < 7) {
                playerHand.push(card);
                pSpecials++;
            } else {
                // Both capped, push back to normals pool
                normals.push(card);
            }
        }
        // Push unused specials into normals pool
        normals.push(...specials);
        shuffle(normals);

        // Fill remaining hand slots with normal cards
        while (playerHand.length < 7 && normals.length > 0) {
            playerHand.push(normals.shift());
        }
        while (aiHand.length < 7 && normals.length > 0) {
            aiHand.push(normals.shift());
        }

        // Shuffle hands so specials aren't always first
        shuffle(playerHand);
        shuffle(aiHand);

        this.state = {
            playerHand,
            aiHand,
            playerEcho: [],
            aiEcho: [],
            playerScore: 0,
            aiScore: 0,
            battlefield: null,       // { card: Card, owner: 'player'|'ai' }
            activePlayer: Math.random() < 0.5 ? 'player' : 'ai',
            phase: 'LEAD',           // LEAD | ATTACK | RESOLVING | GAME_OVER
            round: 1,
            lastResult: null,
            discardPile: [],
            gameLog: []
        };
        const who = this.state.activePlayer === 'player' ? 'Sen' : 'Rakip';
        this.log(`Oyun başladı! ${who} ilk oynuyor.`);
        this.emit('stateChange', this.state);
        return this.state;
    }

    // Get a player's hand
    getHand(player) {
        return player === 'player' ? this.state.playerHand : this.state.aiHand;
    }
    getEcho(player) {
        return player === 'player' ? this.state.playerEcho : this.state.aiEcho;
    }

    // Check if a player has Echo Sinergy for an element
    hasSinergy(player, element) {
        return this.getEcho(player).some(c => c.element === element);
    }

    // Play a card: handles both LEAD and ATTACK phases
    playCard(cardId, player) {
        if (this.state.phase === 'GAME_OVER') return null;
        if (this.state.activePlayer !== player) return null;

        const hand = this.getHand(player);
        const idx = hand.findIndex(c => c.id === cardId);
        if (idx === -1) return null;
        const card = hand.splice(idx, 1)[0];
        const pName = player === 'player' ? 'Sen' : 'Rakip';

        // LEAD: place card on empty battlefield
        if (this.state.phase === 'LEAD' && !this.state.battlefield) {
            this.state.battlefield = { card, owner: player };
            this.state.phase = 'ATTACK';
            this.state.activePlayer = player === 'player' ? 'ai' : 'player';
            this.log(`${pName} ${card.displayName} kartını sahaya koydu.`);
            // Check if opponent has cards to respond
            if (this.checkGameOver()) {
                this.emit('stateChange', this.state);
                return { action: 'lead', card, gameOver: true };
            }
            this.emit('stateChange', this.state);
            return { action: 'lead', card };
        }

        // ATTACK: resolve interaction with battlefield card
        if (this.state.phase === 'ATTACK' && this.state.battlefield) {
            this.log(`${pName} ${card.displayName} ile saldırıyor!`);
            const result = this.resolve(card, player);
            this.state.lastResult = result;
            this.applyResult(result);
            this.checkGameOver();
            this.emit('interaction', result);
            this.emit('stateChange', this.state);
            return { action: 'attack', card, result };
        }
        // If we get here, put card back
        hand.push(card);
        return null;
    }

    // Core interaction resolution
    resolve(attackerCard, attackerOwner) {
        const targetCard = this.state.battlefield.card;
        const targetOwner = this.state.battlefield.owner;

        // Use base card values (no multipliers)
        const atkSinergy = false;
        const tgtSinergy = false;
        const atkVal = attackerCard.value;
        const tgtVal = targetCard.value;

        // ── Joker resolution ──
        const atkIsJoker = attackerCard.element === 'JOKER';
        const tgtIsJoker = targetCard.element === 'JOKER';

        if (atkIsJoker && tgtIsJoker) {
            // Joker vs Joker → draw, both discarded
            return {
                type: 'JOKER_DRAW',
                title: '🃏 Joker Çarpışması!',
                description: 'İki Joker birbirini yok etti! Puan yok.',
                attackerCard, targetCard,
                attackerOwner, targetOwner,
                atkVal: JOKER_POINTS, tgtVal: JOKER_POINTS,
                atkSinergy: false, tgtSinergy: false,
                points: 0,
                winnerPlayer: null,
                capture: false,
                waterStays: false
            };
        }

        if (atkIsJoker) {
            // Attacker's Joker beats any card → sum of both values
            const totalPts = JOKER_POINTS + tgtVal;
            return {
                type: 'JOKER_WIN',
                title: '🃏 Joker Her Şeyi Yener!',
                description: `Joker, ${targetCard.displayName} kartını yok etti! +${totalPts} puan.`,
                attackerCard, targetCard,
                attackerOwner, targetOwner,
                atkVal: JOKER_POINTS, tgtVal,
                atkSinergy: false, tgtSinergy: false,
                points: totalPts,
                winnerPlayer: attackerOwner,
                capture: true,
                waterStays: false
            };
        }

        if (tgtIsJoker) {
            // Target's Joker beats the attacker → sum of both values
            const totalPts = atkVal + JOKER_POINTS;
            return {
                type: 'JOKER_WIN',
                title: '🃏 Joker Her Şeyi Yener!',
                description: `Joker, ${attackerCard.displayName} kartını yok etti! +${totalPts} puan.`,
                attackerCard, targetCard,
                attackerOwner, targetOwner,
                atkVal, tgtVal: JOKER_POINTS,
                atkSinergy: false, tgtSinergy: false,
                points: totalPts,
                winnerPlayer: targetOwner,
                capture: true,
                waterStays: false
            };
        }

        // ── Same element — mirror match ──
        if (attackerCard.element === targetCard.element) {
            return this.resolveMirror(attackerCard, targetCard, attackerOwner, targetOwner, atkVal, tgtVal, atkSinergy, tgtSinergy);
        }

        const key = `${attackerCard.element}_${targetCard.element}`;
        const inter = INTERACTIONS[key];
        const points = inter.pts(atkVal, tgtVal);

        let winnerPlayer = null;
        if (inter.winner === 'attacker') winnerPlayer = attackerOwner;
        else if (inter.winner === 'target') winnerPlayer = targetOwner;

        return {
            type: inter.type,
            title: inter.title,
            description: inter.desc,
            attackerCard, targetCard,
            attackerOwner, targetOwner,
            atkVal, tgtVal,
            atkSinergy, tgtSinergy,
            points,
            winnerPlayer,
            capture: inter.capture,
            waterStays: inter.waterStays
        };
    }

    resolveMirror(atk, tgt, atkOwner, tgtOwner, atkVal, tgtVal, atkSin, tgtSin) {
        let winnerPlayer = null, points = 0;
        let title, desc;

        if (atkVal > tgtVal) {
            winnerPlayer = atkOwner;
            points = atkVal + tgtVal;
            title = `⚔️ ${atk.meta.emoji} Ayna Düellosu!`;
            desc = `Aynı element! Daha güçlü kart kazandı. (${atk.value} > ${tgt.value})`;
        } else if (tgtVal > atkVal) {
            winnerPlayer = tgtOwner;
            points = atkVal + tgtVal;
            title = `⚔️ ${atk.meta.emoji} Ayna Düellosu!`;
            desc = `Aynı element! Daha güçlü kart kazandı. (${tgt.value} > ${atk.value})`;
        } else {
            title = `💫 Mükemmel Denge!`;
            desc = `Aynı element, aynı güç! İki kart da etkisizleşti.`;
        }

        return {
            type: 'MIRROR',
            title, description: desc,
            attackerCard: atk, targetCard: tgt,
            attackerOwner: atkOwner, targetOwner: tgtOwner,
            atkVal, tgtVal,
            atkSinergy: atkSin, tgtSinergy: tgtSin,
            points, winnerPlayer,
            capture: winnerPlayer !== null,
            waterStays: false
        };
    }

    // Apply the result of an interaction to the game state
    applyResult(result) {
        const { attackerCard, targetCard, winnerPlayer, points, capture, waterStays } = result;

        if (capture && winnerPlayer) {
            // Winner captures both cards into their Echo Collection
            const echo = this.getEcho(winnerPlayer);
            echo.push(attackerCard, targetCard);
            if (winnerPlayer === 'player') this.state.playerScore += points;
            else this.state.aiScore += points;
            this.state.battlefield = null;
            this.state.activePlayer = winnerPlayer;
            this.state.phase = 'LEAD';
            const w = winnerPlayer === 'player' ? 'Sen' : 'Rakip';
            this.log(`${w} ${points} puan kazandı!`);
        } else if (waterStays) {
            // Water card persists on battlefield
            const waterCard = targetCard.element === 'WATER' ? targetCard : attackerCard;
            const waterOwner = targetCard.element === 'WATER' ? result.targetOwner : result.attackerOwner;
            const otherCard = waterCard === targetCard ? attackerCard : targetCard;
            this.state.discardPile.push(otherCard);
            this.state.battlefield = { card: waterCard, owner: waterOwner };
            // The player who doesn't own the water attacks next
            this.state.activePlayer = waterOwner === 'player' ? 'ai' : 'player';
            this.state.phase = 'ATTACK';
            this.log(`${waterCard.displayName} sahada kalmaya devam ediyor!`);
        } else {
            // Neutral — both discarded
            this.state.discardPile.push(attackerCard, targetCard);
            this.state.battlefield = null;
            // Attacker leads next
            this.state.activePlayer = result.attackerOwner === 'player' ? 'ai' : 'player';
            this.state.phase = 'LEAD';
            this.log('Kartlar etkisizleşti ve atıldı.');
        }
        this.state.round++;
    }

    checkGameOver() {
        const playerEmpty = this.state.playerHand.length === 0;
        const aiEmpty = this.state.aiHand.length === 0;

        // If either player has no cards left, end the game immediately
        if (playerEmpty || aiEmpty) {
            // Discard any card left on the battlefield
            if (this.state.battlefield) {
                this.state.discardPile.push(this.state.battlefield.card);
                this.state.battlefield = null;
            }

            // Penalize remaining cards — subtract their values from the holder's score
            if (this.state.playerHand.length > 0) {
                const penalty = this.state.playerHand.reduce((sum, c) => sum + c.value, 0);
                this.state.playerScore = Math.max(0, this.state.playerScore - penalty);
                this.log(`Sende ${this.state.playerHand.length} kart kaldı. -${penalty} puan.`);
                this.state.discardPile.push(...this.state.playerHand);
                this.state.playerHand = [];
            }

            if (this.state.aiHand.length > 0) {
                const penalty = this.state.aiHand.reduce((sum, c) => sum + c.value, 0);
                this.state.aiScore = Math.max(0, this.state.aiScore - penalty);
                this.log(`Rakipte ${this.state.aiHand.length} kart kaldı. -${penalty} puan.`);
                this.state.discardPile.push(...this.state.aiHand);
                this.state.aiHand = [];
            }

            this.state.phase = 'GAME_OVER';
            this.determineWinner();
            return true;
        }

        return false;
    }

    determineWinner() {
        let msg;
        if (this.state.playerScore > this.state.aiScore) {
            msg = `🏆 Kazandın! ${this.state.playerScore} - ${this.state.aiScore}`;
        } else if (this.state.aiScore > this.state.playerScore) {
            msg = `😞 Kaybettin! ${this.state.aiScore} - ${this.state.playerScore}`;
        } else {
            msg = `🤝 Berabere! ${this.state.playerScore} - ${this.state.aiScore}`;
        }
        this.log(msg);
        this.emit('gameOver', { playerScore: this.state.playerScore, aiScore: this.state.aiScore, msg });
    }
}
