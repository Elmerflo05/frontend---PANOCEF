/**
 * Configuración optimizada de animaciones para Framer Motion
 */

import type { Transition } from 'framer-motion';

/**
 * Detecta si el dispositivo tiene capacidad reducida
 */
const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return true;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) return true;

  const connection = (navigator as any).connection;
  if (connection && (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
    return true;
  }

  return false;
};

const lightTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut'
};

/**
 * Configuración global optimizada para MotionConfig
 */
export const optimizedMotionConfig = {
  reducedMotion: shouldReduceMotion() ? 'always' : 'user',
  transition: lightTransition,
  layout: false
};
