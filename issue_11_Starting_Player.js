// Issue #11: İlk oyuncu belirlemek
this.state = {
    // ...
    activePlayer: Math.random() < 0.5 ? 'player' : 'ai',
    phase: 'LEAD',
    round: 1
};
