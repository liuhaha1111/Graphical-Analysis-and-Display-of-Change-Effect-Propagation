import {
  displayEntityCount,
  displayEntityCountLabel,
  displayRelationCount,
  displayRelationCountPair,
} from './graphDisplayMetrics';

describe('graphDisplayMetrics', () => {
  test('adds the configured display offsets to entity and relation counts', () => {
    expect(displayEntityCount(3012)).toBe(3512);
    expect(displayEntityCountLabel(3012)).toBe('3512');
    expect(displayRelationCount(5573)).toBe(12573);
  });

  test('formats visible and total relation counts with the display offset on both values', () => {
    expect(displayRelationCountPair(0, 5573)).toBe('7000 / 12573');
    expect(displayRelationCountPair(5573, 5573)).toBe('12573 / 12573');
  });
});
