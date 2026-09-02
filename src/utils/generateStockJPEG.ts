import { toPng } from 'html-to-image';
import { format } from 'date-fns';

/**
 * Captures the off-screen stock snapshot as a PNG and downloads it. The file
 * name carries the capture date and time so successive snapshots never
 * overwrite each other.
 */
export async function generateStockPhoto(
  elementId: string,
  categoryKey: string,
  capturedAt: Date = new Date()
): Promise<void> {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error('Stock photo element not found');
  }

  const dataUrl = await toPng(element, {
    quality: 1.0,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const link = document.createElement('a');
  link.download = `stock_${categoryKey}_${format(capturedAt, 'yyyy-MM-dd_HH-mm-ss')}.png`;
  link.href = dataUrl;
  link.click();
}
