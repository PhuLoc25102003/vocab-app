import type { StudyMode, StudyModeStrategy } from './types';

const registry = new Map<StudyMode, StudyModeStrategy>();

export function registerMode(strategy: StudyModeStrategy): void {
  registry.set(strategy.mode, strategy);
}

export function isModeAvailable(mode: StudyMode): boolean {
  return registry.has(mode);
}

export function getMode(mode: StudyMode): StudyModeStrategy {
  const strategy = registry.get(mode);
  if (!strategy) {
    throw new Error(`Unknown study mode: ${mode}`);
  }
  return strategy;
}
