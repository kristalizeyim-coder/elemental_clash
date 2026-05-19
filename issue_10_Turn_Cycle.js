// Issue #10: Tur döngüsü ve sıra yönetim
if (this.state.phase === 'LEAD') {
    this.state.battlefield = { card, owner: player };
    this.state.phase = 'ATTACK';
    this.state.activePlayer = player === 'player' ? 'ai' : 'player';
} else if (this.state.phase === 'ATTACK') {
    const result = this.resolve(card, player);
    this.applyResult(result);
    this.state.phase = 'LEAD';
}
