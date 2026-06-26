import type { Transition } from 'framer-motion';

export const ease = [0.22, 1, 0.36, 1] as Transition['ease'];

export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease, delay } as Transition,
  };
}
