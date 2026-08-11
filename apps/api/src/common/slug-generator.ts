const CHARSET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Genera un slug corto aleatorio (charset lowercase+digits). */
export function generateSlug(length = 6): string {
  const rand = new Uint8Array(length);
  crypto.getRandomValues(rand);
  return Array.from(rand, (b) => CHARSET[b % CHARSET.length]).join('');
}

/** Valida slug custom: 4–12 chars [a-z0-9]. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]{4,12}$/.test(slug);
}

/** Valida color hex #RRGGBB. */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

/** Calcula contraste WCAG entre dos colores hex. */
export function contrastRatio(fg: string, bg: string): number {
  const lum = (hex: string): number => {
    const c = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => {
      const v = parseInt(c.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(fg);
  const l2 = lum(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
