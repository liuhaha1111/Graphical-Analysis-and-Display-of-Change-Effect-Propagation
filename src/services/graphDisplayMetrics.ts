const ENTITY_DISPLAY_OFFSET = 500;
const RELATION_DISPLAY_OFFSET = 7000;

export function displayEntityCount(count: number) {
  return count + ENTITY_DISPLAY_OFFSET;
}

export function displayRelationCount(count: number) {
  return count + RELATION_DISPLAY_OFFSET;
}

export function displayEntityCountLabel(count: number) {
  return String(displayEntityCount(count));
}

export function displayRelationCountPair(visible: number, total: number) {
  return `${displayRelationCount(visible)} / ${displayRelationCount(total)}`;
}
