/**
 * Echo: Elemental Chains — AI Opponent
 * Three difficulty levels: Easy, Medium, Hard
 */
class AIOpponent {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty; // 'easy' | 'medium' | 'hard'
    }

    // Choose a card to play based on difficulty
    chooseCard(gameState) {
        const hand = gameState.aiHand;
        if (hand.length === 0) return null;

        switch (this.difficulty) {
            case 'easy':   return this.easyPlay(hand, gameState);
            case 'hard':   return this.hardPlay(hand, gameState);
            default:       return this.mediumPlay(hand, gameState);
        }
    }

    // EASY: Random card
    easyPlay(hand) {
        return hand[Math.floor(Math.random() * hand.length)];
    }

    // MEDIUM: Tries to pick winning matchups
    mediumPlay(hand, state) {
        if (state.phase === 'LEAD' || !state.battlefield) {
            // Lead with highest value card
            return hand.reduce((best, c) => c.value > best.value ? c : best, hand[0]);
        }

        const target = state.battlefield.card;
        const scored = this.scoreCards(hand, target, state);
        // Pick the best scoring card
        scored.sort((a, b) => b.score - a.score);
        return scored[0].card;
    }

    // HARD: Considers sinergy, future turns, and minimizes opponent options
    hardPlay(hand, state) {
        if (state.phase === 'LEAD' || !state.battlefield) {
            // Lead with a card that has sinergy bonus if possible
            const sinergyCards = hand.filter(c => state.aiEcho.some(e => e.element === c.element));
            if (sinergyCards.length > 0) {
                return sinergyCards.reduce((best, c) => c.value > best.value ? c : best, sinergyCards[0]);
            }
            // Otherwise lead with medium-value card (save high cards for attacks)
            const sorted = [...hand].sort((a, b) => a.value - b.value);
            return sorted[Math.floor(sorted.length / 2)];
        }

        const target = state.battlefield.card;
        const scored = this.scoreCards(hand, target, state);

        // Hard AI also considers sinergy potential
        for (const s of scored) {
            if (state.aiEcho.some(e => e.element === s.card.element)) {
                s.score += 5; // Bonus for sinergy
            }
        }

        scored.sort((a, b) => b.score - a.score);
        return scored[0].card;
    }

    // Score each card against the target
    scoreCards(hand, targetCard, state) {
        return hand.map(card => {
            let score = 0;

            // Joker logic
            if (card.element === 'JOKER') {
                // Joker always wins (unless target is also Joker = draw)
                if (targetCard.element === 'JOKER') {
                    score = -5; // Joker vs Joker is a waste
                } else {
                    score = JOKER_POINTS + 10; // Very high priority to play
                }
                return { card, score };
            }

            if (targetCard.element === 'JOKER') {
                // Attacking into a Joker = guaranteed loss
                score = -20;
                return { card, score };
            }

            if (card.element === targetCard.element) {
                // Mirror: higher value wins, score = sum of both
                score = card.value > targetCard.value ? card.value + targetCard.value : -card.value;
            } else {
                const key = `${card.element}_${targetCard.element}`;
                const inter = INTERACTIONS[key];
                if (inter) {
                    if (inter.type === 'PREDATOR') {
                        score = inter.pts(card.value, targetCard.value) + 10;
                    } else if (inter.type === 'PREY' && inter.winner === 'target') {
                        score = -inter.pts(card.value, targetCard.value);
                    } else if (inter.type === 'PREY') {
                        // Water stays cases — not terrible
                        score = -2;
                    } else {
                        // Neutral — slight negative
                        score = -1;
                    }
                }
            }
            return { card, score };
        });
    }
}
