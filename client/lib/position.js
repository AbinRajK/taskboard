// Same rule as backend/board/src/utils/position.js. A moved card gets a number between its
// new neighbours, so only that one card has to be saved.
export const STEP = 1000;

export function between(before, after) {
  if (before == null && after == null) return STEP;
  if (before == null) return after / 2;
  if (after == null) return before + STEP;
  return (before + after) / 2;
}
