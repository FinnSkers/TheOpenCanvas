import type { CanvasItem, PathItem, StickerItem, TextItem, ChatBubbleItem } from '../types/canvas';
import { renderStroke } from './drawing';

/**
 * Exports all active canvas items into a downloadable high-res PNG
 */
export async function exportCanvasToPng(items: CanvasItem[]): Promise<void> {
  if (items.length === 0) {
    alert('Canvas is empty! Draw or drop some memes first.');
    return;
  }

  // 1. Calculate bounding box of all items
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  items.forEach((item) => {
    if (item.type === 'path') {
      const path = item as PathItem;
      path.points.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });
    } else {
      const right = item.x + (item.width || 150);
      const bottom = item.y + (item.height || 150);
      if (item.x < minX) minX = item.x;
      if (item.y < minY) minY = item.y;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }
  });

  const padding = 80;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const width = Math.max(800, Math.min(4000, maxX - minX));
  const height = Math.max(600, Math.min(4000, maxY - minY));

  // 2. Setup high-res offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#0f1117';
  ctx.fillRect(0, 0, width, height);

  // Grid pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let x = 0; x < width; x += 32) {
    for (let y = 0; y < height; y += 32) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Preload all sticker images safely
  const imageMap = new Map<string, HTMLImageElement>();
  const imagePromises: Promise<void>[] = [];

  items.forEach((item) => {
    if (item.type === 'sticker') {
      const sticker = item as StickerItem;
      if (!imageMap.has(sticker.url)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const p = new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
        img.src = sticker.url;
        imageMap.set(sticker.url, img);
        imagePromises.push(p);
      }
    }
  });

  await Promise.all(imagePromises);

  // 4. Sort items by zIndex
  const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

  // 5. Draw elements
  for (const item of sortedItems) {
    if (item.type === 'path') {
      const path = item as PathItem;
      const svgPathD = renderStroke(path.points, path.size, path.brushType);
      if (svgPathD) {
        ctx.save();
        ctx.translate(-minX, -minY);
        const p2d = new Path2D(svgPathD);
        ctx.fillStyle = path.color;
        if (path.brushType === 'neon') {
          ctx.shadowColor = path.color;
          ctx.shadowBlur = 15;
        }
        ctx.fill(p2d);
        ctx.restore();
      }
    } else if (item.type === 'sticker') {
      const sticker = item as StickerItem;
      const img = imageMap.get(sticker.url);
      if (img && img.naturalWidth) {
        ctx.save();
        const drawX = sticker.x - minX;
        const drawY = sticker.y - minY;
        const centerX = drawX + sticker.width / 2;
        const centerY = drawY + sticker.height / 2;

        ctx.translate(centerX, centerY);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.drawImage(img, -sticker.width / 2, -sticker.height / 2, sticker.width, sticker.height);
        ctx.restore();
      }
    } else if (item.type === 'text') {
      const textItem = item as TextItem;
      ctx.save();
      const drawX = textItem.x - minX;
      const drawY = textItem.y - minY;

      ctx.translate(drawX, drawY);
      ctx.rotate((textItem.rotation * Math.PI) / 180);
      ctx.font = `900 ${textItem.fontSize}px Impact, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.strokeText(textItem.text, 0, 0);

      ctx.fillStyle = textItem.color;
      ctx.fillText(textItem.text, 0, 0);
      ctx.restore();
    } else if (item.type === 'chat') {
      const chatItem = item as ChatBubbleItem;
      ctx.save();
      const drawX = chatItem.x - minX;
      const drawY = chatItem.y - minY;

      ctx.translate(drawX, drawY);
      ctx.rotate((chatItem.rotation * Math.PI) / 180);

      // Bubble background
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, chatItem.width, chatItem.height, 16);
      } else {
        ctx.rect(0, 0, chatItem.width, chatItem.height);
      }
      ctx.fill();
      ctx.stroke();

      // Header (sender)
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#f472b6';
      ctx.fillText(`${chatItem.senderAvatar} ${chatItem.senderName}`, 12, 20);

      // Message text
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(chatItem.message, 12, 42);
      ctx.restore();
    }
  }

  // 6. Watermark stamp
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText('Made with The Open Canvas 🎨', 20, height - 20);

  // 7. Trigger download or native mobile share sheet
  try {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `open-canvas-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const file = new File([blob], `open-canvas-${Date.now()}.png`, { type: 'image/png' });

      // If mobile browser supports sharing files natively
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: 'The Open Canvas Snapshot',
            text: 'Check out this snapshot from The Open Canvas!'
          });
          return;
        } catch {
          // User cancelled or share failed, fallback to direct download
        }
      }

      // Direct file download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `open-canvas-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  } catch {
    alert('Note: Some external images with cross-origin restrictions could not be converted directly. Try taking a screenshot!');
  }
}
