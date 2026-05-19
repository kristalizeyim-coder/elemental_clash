// Issue #16: Kart karıştırma ve dağıtım
// Karıştırma
for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
}
// Dağıtım (7 kart)
const playerHand = deck.splice(0, 7);
const aiHand = deck.splice(0, 7);
