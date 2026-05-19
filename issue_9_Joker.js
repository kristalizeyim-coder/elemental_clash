// Issue #9: Joker kart mekanik
if (attackerCard.element === 'JOKER' || targetCard.element === 'JOKER') {
    if (atkIsJoker && tgtIsJoker) {
        return { type: 'JOKER_DRAW', points: 0, capture: false };
    }
    const winner = atkIsJoker ? attackerOwner : targetOwner;
    const totalPts = JOKER_POINTS + (atkIsJoker ? tgtVal : atkVal);
    return {
        type: 'JOKER_WIN',
        points: totalPts,
        winnerPlayer: winner,
        capture: true
    };
}
