// Issue #18: Win condition.
determineWinner() {
    if (this.state.playerScore > this.state.aiScore) {
        return "🏆 Oyuncu Kazandı!";
    } else if (this.state.aiScore > this.state.playerScore) {
        return "😞 Rakip Kazandı!";
    }
    return "🤝 Berabere!";
}
