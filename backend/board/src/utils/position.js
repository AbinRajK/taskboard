// Cards and lists are ordered by a numeric position. Moving a card only changes that one
// document: the client picks a number between its new neighbours (see client/lib/position.js).
export const STEP = 1000;

export function nextPosition(lastPosition) {
  return typeof lastPosition === 'number' ? lastPosition + STEP : STEP;
}

export function between(before, after) {
  if (before == null && after == null) return STEP;
  if (before == null) return after / 2;
  if (after == null) return before + STEP;
  return (before + after) / 2;
}
