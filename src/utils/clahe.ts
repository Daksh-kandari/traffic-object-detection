/**
 * Contrast Limited Adaptive Histogram Equalization (CLAHE)
 * Implemented on the Luminance (Y / L) channel, matching OpenCV cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
 */
export function applyCLAHE(imageData: ImageData, clipLimit = 2.0, gridTiles = 8): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  const outData = output.data;

  // Extract luminance channel Y = 0.299R + 0.587G + 0.114B
  const numPixels = width * height;
  const luminance = new Uint8Array(numPixels);
  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    luminance[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }

  const tileW = Math.ceil(width / gridTiles);
  const tileH = Math.ceil(height / gridTiles);

  // Compute clipped CDF for each tile
  const cdfs: Float32Array[] = [];
  const actualClip = clipLimit * (tileW * tileH / 256);

  for (let ty = 0; ty < gridTiles; ty++) {
    for (let tx = 0; tx < gridTiles; tx++) {
      const hist = new Int32Array(256);
      const startX = tx * tileW;
      const endX = Math.min(startX + tileW, width);
      const startY = ty * tileH;
      const endY = Math.min(startY + tileH, height);
      let count = 0;

      for (let y = startY; y < endY; y++) {
        const rowOffset = y * width;
        for (let x = startX; x < endX; x++) {
          hist[luminance[rowOffset + x]]++;
          count++;
        }
      }

      // Clip histogram
      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > actualClip) {
          excess += hist[i] - actualClip;
          hist[i] = actualClip;
        }
      }

      // Redistribute excess
      const bonus = excess / 256;
      for (let i = 0; i < 256; i++) {
        hist[i] += bonus;
      }

      // Calculate CDF
      const cdf = new Float32Array(256);
      let sum = 0;
      for (let i = 0; i < 256; i++) {
        sum += hist[i];
        cdf[i] = Math.min(255, Math.max(0, (sum / count) * 255));
      }
      cdfs.push(cdf);
    }
  }

  // Bilinear interpolation across tiles
  for (let y = 0; y < height; y++) {
    const normY = (y / height) * gridTiles - 0.5;
    const ty1 = Math.max(0, Math.min(gridTiles - 1, Math.floor(normY)));
    const ty2 = Math.max(0, Math.min(gridTiles - 1, ty1 + 1));
    const dy = Math.max(0, Math.min(1, normY - ty1));

    for (let x = 0; x < width; x++) {
      const normX = (x / width) * gridTiles - 0.5;
      const tx1 = Math.max(0, Math.min(gridTiles - 1, Math.floor(normX)));
      const tx2 = Math.max(0, Math.min(gridTiles - 1, tx1 + 1));
      const dx = Math.max(0, Math.min(1, normX - tx1));

      const pixelIdx = y * width + x;
      const val = luminance[pixelIdx];

      const cdf00 = cdfs[ty1 * gridTiles + tx1][val];
      const cdf10 = cdfs[ty1 * gridTiles + tx2][val];
      const cdf01 = cdfs[ty2 * gridTiles + tx1][val];
      const cdf11 = cdfs[ty2 * gridTiles + tx2][val];

      const top = cdf00 * (1 - dx) + cdf10 * dx;
      const bottom = cdf01 * (1 - dx) + cdf11 * dx;
      const newL = top * (1 - dy) + bottom * dy;

      const oldL = val > 0 ? val : 1;
      const scale = newL / oldL;

      const p4 = pixelIdx * 4;
      outData[p4] = Math.min(255, Math.max(0, Math.round(data[p4] * scale)));
      outData[p4 + 1] = Math.min(255, Math.max(0, Math.round(data[p4 + 1] * scale)));
      outData[p4 + 2] = Math.min(255, Math.max(0, Math.round(data[p4 + 2] * scale)));
      outData[p4 + 3] = data[p4 + 3]; // Preserve alpha
    }
  }

  return output;
}
