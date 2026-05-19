// Issue #19: Özel durum yönetim
if (waterStays) {
    const waterCard = targetCard.element === 'WATER' ? targetCard : attackerCard;
    this.state.battlefield = { card: waterCard, owner: waterOwner };
    this.state.phase = 'ATTACK';
}
