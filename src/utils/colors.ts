// CRC32 implementation matching Python's zlib.crc32(label.encode())
function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c >>> 0;
  }
  return table;
}

const crcTable = makeCrcTable();

export function crc32(str: string): number {
  let crc = 0 ^ (-1);
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

export function getClassColorRGB(label: string): [number, number, number] {
  // Pre-tuned high-contrast palette for traffic classes with crc32 fallback
  const curatedPalette: Record<string, [number, number, number]> = {
    car: [59, 130, 246], // Bright Blue
    motorcycle: [234, 88, 12], // Amber/Orange
    bus: [234, 179, 8], // Yellow
    truck: [168, 85, 247], // Purple
    person: [34, 197, 94], // Green
    bicycle: [20, 184, 166], // Teal
    'stop sign': [239, 68, 68], // Red
    'traffic light': [245, 158, 11], // Light Orange
    'traffic sign': [244, 63, 94], // Rose
  };

  if (curatedPalette[label]) {
    return curatedPalette[label];
  }

  const h = crc32(label);
  return [h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff];
}

export function getClassColorHex(label: string): string {
  const [r, g, b] = getClassColorRGB(label);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getClassColorRGBA(label: string, alpha: number): string {
  const [r, g, b] = getClassColorRGB(label);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
