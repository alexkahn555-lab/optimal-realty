/**
 * First-touch UTM capture. The layout inlines UTM_SNIPPET (byte-budgeted:
 * <= 0.3 KB, enforced by tests/leadform-budget.test.ts); the LeadForm island
 * reads the stored value back at submit via readStoredUtm(). First touch wins —
 * the snippet never overwrites an existing capture within the session.
 */

export const UTM_STORAGE_KEY = 'utm';

export const UTM_SNIPPET =
  'try{if(!sessionStorage.utm){var p=new URLSearchParams(location.search),o={},n=0,v;' +
  '"source medium campaign term content".split(" ").forEach(function(k){' +
  'k="utm_"+k;(v=p.get(k))&&(o[k]=v.slice(0,200),n++)});' +
  'n&&(sessionStorage.utm=JSON.stringify(o))}}catch(e){}';

/** Parse the captured params back out; undefined when nothing was captured. */
export function readStoredUtm(): Record<string, string> | undefined {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') out[key] = value;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}
