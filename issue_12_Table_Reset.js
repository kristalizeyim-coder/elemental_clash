// Issue #12: Masa sıfırlama mekanik
applyResult(result) {
    // ...
    if (result.capture) {
        this.state.battlefield = null; // Masa temizlenir
        this.state.activePlayer = result.winnerPlayer;
    } else if (!result.waterStays) {
        this.state.battlefield = null; // Nötr durumda masa temizlenir
    }
}
