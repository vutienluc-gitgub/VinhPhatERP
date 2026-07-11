/**
 * Auth Motion Design System
 *
 * Centralized animation tokens for the entire Auth module.
 * Login, Register, Forgot Password should all reference these values
 * to maintain visual consistency.
 */
export const AuthMotion = {
  duration: {
    fast: 150,
    normal: 220,
    slow: 350,
  },

  shake: {
    keyframes: { x: [-6, 6, -4, 4, -2, 2, 0] },
    durationMs: 350,
  },

  glow: {
    opacity: [0.04, 0.08],
    durationMs: 200,
  },

  button: {
    hoverScale: 1.015,
    tapScale: 0.985,
  },

  floatingLabel: {
    durationMs: 200,
  },
} as const;
