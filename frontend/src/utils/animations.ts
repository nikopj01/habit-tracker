import confetti from 'canvas-confetti';

// Black and pink color scheme for futuristic theme
const colors = {
  black: ['#000000', '#1a1a1a', '#0d0d0d'],
  pink: ['#ec4899', '#f472b6', '#f9a8d4', '#db2777'],
  neon: ['#ec4899', '#000000', '#1a1a1a', '#f472b6']
};

/**
 * Trigger confetti animation based on completion count
 * @param completionCount - Number of activities completed on this date (1, 2, or 3+)
 * @param buttonElement - The button element that was clicked (for positioning)
 */
export const triggerCompletionAnimation = (
  completionCount: number,
  buttonElement?: HTMLElement
) => {
  const rect = buttonElement?.getBoundingClientRect();
  const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
  const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.5;

  switch (completionCount) {
    case 1:
      // First completion: Gentle burst from button
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x, y },
        colors: colors.pink,
        disableForReducedMotion: true,
        gravity: 0.8,
        scalar: 0.8,
        drift: 0,
        ticks: 100
      });
      break;

    case 2:
      // Second completion: Double burst from corners
      const end = Date.now() + 300;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: colors.neon,
          disableForReducedMotion: true
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: colors.neon,
          disableForReducedMotion: true
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Additional burst from button
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { x, y },
          colors: colors.pink,
          disableForReducedMotion: true,
          gravity: 0.7,
          scalar: 1,
          drift: 0.2
        });
      }, 100);
      break;

    case 3:
    default:
      // Third completion: Full celebration with fireworks
      const duration = 1500;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 100,
        zIndex: 100,
        disableForReducedMotion: true
      };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        // Multiple bursts from different origins
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: colors.neon
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: colors.pink
        });
      }, 250);

      // Center celebration
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { x, y },
          colors: colors.neon,
          disableForReducedMotion: true,
          gravity: 0.6,
          scalar: 1.2,
          drift: 0.3,
          ticks: 150
        });
      }, 200);
      break;
  }
};

/**
 * Trigger a simple success animation
 */
export const triggerSuccessAnimation = (element?: HTMLElement) => {
  const rect = element?.getBoundingClientRect();
  const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
  const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.5;

  confetti({
    particleCount: 30,
    spread: 50,
    origin: { x, y },
    colors: colors.pink,
    disableForReducedMotion: true,
    gravity: 1,
    scalar: 0.7,
    ticks: 80
  });
};

/**
 * Trigger celebration animation for milestone (e.g., 7-day streak)
 */
export const triggerMilestoneAnimation = () => {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = {
    startVelocity: 45,
    spread: 360,
    ticks: 150,
    zIndex: 100,
    disableForReducedMotion: true
  };

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 80 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: 0.2, y: 0.6 },
      colors: colors.neon
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: 0.8, y: 0.6 },
      colors: colors.pink
    });
  }, 200);
};
