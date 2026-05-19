// Issue #14: Kart veri modeli (52 kart + 4 joker)
createDeck() {
    const deck = [];
    // 52 Standart Kart
    for (const el of ['AIR', 'FIRE', 'WATER', 'EARTH']) {
        for (let v = 1; v <= 13; v++) deck.push(new Card(id++, el, v));
    }
    // 4 Joker Kart
    for (let i = 0; i < 4; i++) deck.push(new Card(id++, 'JOKER', 15));
    return deck;
}
