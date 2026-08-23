// Duel Arena v6.9.0 canonical bootstrap.
// The gameplay module is stored as ordered source fragments solely to keep repository updates atomic/reliable.
const PARTS = ['./core/part-000.jsfrag', './core/part-001.jsfrag', './core/part-002.jsfrag', './core/part-003.jsfrag', './core/part-004.jsfrag', './core/part-005.jsfrag', './core/part-006.jsfrag', './core/part-007.jsfrag', './core/part-008.jsfrag', './core/part-009.jsfrag', './core/part-010.jsfrag', './core/part-011.jsfrag', './core/part-012.jsfrag', './core/part-013.jsfrag'];
const sources = await Promise.all(PARTS.map(async url => {
  const response = await fetch(new URL(url, import.meta.url), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.text();
}));
const moduleUrl = URL.createObjectURL(new Blob([sources.join('') + '\n//# sourceURL=duel-arena-v6.9.0-core.js'], { type: 'text/javascript' }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
