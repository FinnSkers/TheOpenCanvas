import { getStroke } from 'perfect-freehand';
import type { BrushType } from '../types/canvas';

/**
 * Converts stroke outline points from `perfect-freehand` into an SVG path `d` string
 */
export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
}

/**
 * Calculates SVG stroke points given raw input points and brush configuration
 */
export function renderStroke(
  points: [number, number, number][],
  size: number = 8,
  brushType: BrushType = 'pen'
): string {
  if (!points || points.length === 0) return '';

  const thinning = brushType === 'highlighter' ? 0 : 0.6;
  const smoothing = brushType === 'highlighter' ? 0.3 : 0.65;
  const streamline = 0.5;

  const stroke = getStroke(
    points.map(([x, y, pressure]) => [x, y, pressure ?? 0.5]),
    {
      size,
      thinning,
      smoothing,
      streamline,
      simulatePressure: true,
      last: true,
    }
  );

  return getSvgPathFromStroke(stroke);
}

/**
 * Generates an animated/dynamic rainbow gradient or HSL color for the rainbow brush
 */
export function getRainbowColor(step: number): string {
  const hue = (step * 8) % 360;
  return `hsl(${hue}, 95%, 60%)`;
}
