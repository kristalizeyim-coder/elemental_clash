// Issue #15: Element etkileşim algoritması
const INTERACTIONS = {
    AIR_EARTH:   { winner: 'attacker', title: 'Hava Toprağı Yener' },
    FIRE_AIR:    { winner: 'attacker', title: 'Ateş Havayı Yener' },
    WATER_FIRE:  { winner: 'attacker', title: 'Su Ateşi Yener' },
    EARTH_WATER: { winner: 'attacker', title: 'Toprak Suyu Yener' }
    // Diğer ters etkileşimler PREDATOR/PREY mantığıyla resolve edilir
};
