// ---------------------------------------------------------------------------
// PLATFORM-OWNED image specifications.
//
// Client feedback 22 Sep 2026, row 2: "Kindly Mention Logo / images Size &
// Dimensions". One definition, used by every screen that accepts an upload —
// the two page editors state these, the help dialog lists them, and
// `validateImage` enforces them. A recommendation nobody checks is how a 9MB
// phone photo ends up as a banner, so the numbers here are the rule, not
// advice.
//
// Both editors read from this file, so the Platform Admin's institute editor
// and the Institute Console can never quote different numbers.
// ---------------------------------------------------------------------------

export const MEDIA_SPECS = {
  logo: {
    label: 'Logo',
    dimensions: '512 × 512 px',
    aspect: 'Square (1:1)',
    maxMB: 1,
    minPx: 200,
    formats: 'JPG, PNG, SVG or WebP',
    shownAs: 'Appears in the page header, search results, the feed and every enquiry.',
    tip: 'A transparent PNG looks best — the logo sits on a light card.',
  },
  banner: {
    label: 'Header Banner',
    dimensions: '1600 × 500 px',
    aspect: 'Wide (16:5)',
    maxMB: 2,
    minPx: 800,
    formats: 'JPG, PNG or WebP',
    shownAs: 'The strip across the top of your public page. Up to 3, shown side by side.',
    tip: 'Keep text away from the edges — the banner is cropped on narrow screens.',
  },
  gallery: {
    label: 'Gallery Photo',
    dimensions: '1200 × 800 px',
    aspect: 'Landscape (3:2)',
    maxMB: 2,
    minPx: 600,
    formats: 'JPG, PNG or WebP',
    shownAs: 'A grid of campus and classroom photos on your public page.',
    tip: 'Add a caption to each — they show underneath the photo.',
  },
};

/** One-line summary for a field label: "512 × 512 px (Square), max 1MB". */
export function specSummary(kind) {
  const s = MEDIA_SPECS[kind];
  if (!s) return '';
  return `${s.dimensions}, max ${s.maxMB}MB`;
}

/** Reads the real pixel size of a picked file before it is uploaded. */
export function readImageSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Returns an error string naming the actual numbers, or null when acceptable. */
export async function validateImage(file, kind) {
  const spec = MEDIA_SPECS[kind];
  if (!spec) return null;
  if (!file.type.startsWith('image/')) return 'That file is not an image.';

  const mb = file.size / (1024 * 1024);
  if (mb > spec.maxMB) {
    return `That image is ${mb.toFixed(1)}MB — the limit is ${spec.maxMB}MB. Recommended: ${spec.dimensions}.`;
  }

  const size = await readImageSize(file);
  if (size && Math.max(size.width, size.height) < spec.minPx) {
    return `That image is only ${size.width}×${size.height}px — too small to stay sharp. Recommended: ${spec.dimensions}.`;
  }
  return null;
}
