import { useSyncExternalStore } from "react";

/** Fired when the viewer presses Space to move the story to its next beat. */
export const STORY_ADVANCE = "story-advance";

let pending = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const hasPendingGate = () => pending > 0;

/** True while the story is waiting on the viewer (autoplay off). */
export function useStoryWaiting() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    () => pending > 0,
  );
}

/**
 * Runs `fn` once: after `delay` when autoplay is on, or when the viewer advances the story
 * (Space) when it is off. Space also skips the wait while autoplay is on. Returns a cleanup.
 */
export function gate(autoplay: boolean, delay: number, fn: () => void): () => void {
  let done = false;
  let counted = false;
  let timer: number | null = null;

  const release = () => {
    if (timer !== null) window.clearTimeout(timer);
    window.removeEventListener(STORY_ADVANCE, run);
    if (counted) {
      counted = false;
      pending -= 1;
      emit();
    }
  };
  function run() {
    if (done) return;
    done = true;
    release();
    fn();
  }

  if (autoplay) {
    timer = window.setTimeout(run, delay);
  } else {
    counted = true;
    pending += 1;
    emit();
  }
  window.addEventListener(STORY_ADVANCE, run);
  return release;
}
