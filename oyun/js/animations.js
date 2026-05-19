/**
 * Echo: Elemental Chains — Visual Effects
 * Particle system and interaction animations.
 */
class VFX {
    static createParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5);
            const dist = 60 + Math.random() * 80;
            particle.style.cssText = `
                left: ${x}px; top: ${y}px;
                background: ${color};
                box-shadow: 0 0 6px ${color};
                --px: ${Math.cos(angle) * dist}px;
                --py: ${Math.sin(angle) * dist}px;
                --duration: ${0.6 + Math.random() * 0.6}s;
                width: ${4 + Math.random() * 4}px;
                height: ${4 + Math.random() * 4}px;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }
    }

    static clashFlash(element) {
        const flash = document.createElement('div');
        flash.className = `clash-flash ${element.toLowerCase()}`;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 700);
    }

    static sinergyBurst() {
        const burst = document.createElement('div');
        burst.className = 'sinergy-burst';
        document.body.appendChild(burst);
        setTimeout(() => burst.remove(), 900);
    }

    static scorePop(x, y, points, positive = true) {
        const pop = document.createElement('div');
        pop.className = 'score-pop';
        pop.textContent = positive ? `+${points}` : `${points}`;
        pop.style.cssText = `
            left: ${x}px; top: ${y}px;
            color: ${positive ? 'var(--accent-green)' : 'var(--accent-red)'};
        `;
        document.body.appendChild(pop);
        setTimeout(() => pop.remove(), 1300);
    }

    static playInteractionVFX(result) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;

        // Flash in winner's element color
        const winnerElement = result.winnerPlayer
            ? (result.winnerPlayer === result.attackerOwner ? result.attackerCard.element : result.targetCard.element)
            : result.attackerCard.element;
        VFX.clashFlash(winnerElement);

        // Particles
        const color = ELEMENT_META[winnerElement].color;
        setTimeout(() => VFX.createParticles(cx, cy, color, 16), 200);

        // Score pop
        if (result.points > 0 && result.winnerPlayer) {
            const popY = result.winnerPlayer === 'player' ? cy + 40 : cy - 40;
            setTimeout(() => VFX.scorePop(cx - 30, popY, result.points, true), 400);
        }

        // Sinergy burst
        if (result.atkSinergy || result.tgtSinergy) {
            setTimeout(() => VFX.sinergyBurst(), 100);
        }
    }
}
