// Issue #13: Puan kazanma sistem
if (winnerPlayer === 'player') {
    this.state.playerScore += points;
} else if (winnerPlayer === 'ai') {
    this.state.aiScore += points;
}
this.log(`${winnerPlayer} ${points} puan kazandı!`);
