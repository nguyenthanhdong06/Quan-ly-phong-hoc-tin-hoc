import confetti from 'canvas-confetti';

/**
 * Standard colorful confetti burst from the center/mouse or screen bottom
 */
export const triggerConfetti = () => {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    });
  } catch (e) {
    console.error('Confetti error:', e);
  }
};

/**
 * Fireworks style side cannons burst (Left & Right dual launch)
 */
export const triggerFireworksConfetti = () => {
  try {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Launch from left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ff0055', '#00e5ff', '#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'],
      });

      // Launch from right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ff0055', '#00e5ff', '#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'],
      });
    }, 250);
  } catch (e) {
    console.error('Fireworks confetti error:', e);
  }
};

/**
 * Enhanced Ultra-Sparkling Gold Stars and Glowing Confetti Explosion for Student Rewards!
 * Dual-wave burst + side cannons + star shapes + glowing palette
 */
export const triggerStarsConfetti = () => {
  try {
    const goldPalette = ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#ffffff', '#34d399', '#38bdf8', '#f472b6'];

    // Wave 1: Immediate Explosive Center & High-Angle Burst
    confetti({
      particleCount: 100,
      spread: 90,
      startVelocity: 50,
      origin: { y: 0.65 },
      shapes: ['star', 'circle'],
      colors: goldPalette,
      zIndex: 9999,
      scalar: 1.25,
    });

    // Side Cannon Left
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      shapes: ['star'],
      colors: goldPalette,
      zIndex: 9999,
      scalar: 1.1,
    });

    // Side Cannon Right
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      shapes: ['star'],
      colors: goldPalette,
      zIndex: 9999,
      scalar: 1.1,
    });

    // Wave 2: Delayed Shower Follower (140ms delay) for max sparkling feeling
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 120,
        startVelocity: 35,
        decay: 0.92,
        origin: { y: 0.5 },
        shapes: ['star', 'circle'],
        colors: goldPalette,
        zIndex: 9999,
        scalar: 0.9,
      });
    }, 140);
  } catch (e) {
    console.error('Stars confetti error:', e);
  }
};

/**
 * Winning burst for game victory / test completion
 */
export const triggerVictoryConfetti = () => {
  triggerFireworksConfetti();
  setTimeout(() => {
    triggerStarsConfetti();
  }, 400);
};
