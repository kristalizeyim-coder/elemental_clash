// Issue #17: Zorunlu atım kuralı.
checkGameOver() {
    if (playerHand.length === 0 || aiHand.length === 0) {
        // Elde kalan kartlar ceza puanı olarak düşülür
        const pPenalty = playerHand.reduce((s, c) => s + c.value, 0);
        this.state.playerScore -= pPenalty;
        // ...
    }
}
