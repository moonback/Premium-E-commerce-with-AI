/**
 * src/store.ts — Compatibility re-export.
 *
 * The store has been refactored into focused slices under src/stores/.
 * This file re-exports `useStore`, `AppState`, and the root store so that all
 * existing imports (`import { useStore } from '../store'`) continue to work
 * without touching every consumer.
 *
 * Prefer importing directly from 'src/stores' in new code.
 */
export { useStore } from './stores/index';
export type { RootState as AppState } from './stores/index';
