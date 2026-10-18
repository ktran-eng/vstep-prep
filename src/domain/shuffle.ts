import type { Mcq } from "./content-schema";

/** FNV-1a hash → mulberry32 PRNG: deterministic per question id, so keys are stable across seeds. */
function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KEYS = ["A", "B", "C", "D"] as const;

/**
 * Re-orders options so correct answers are spread evenly across A–D, remapping the key and distractor notes.
 * Authors may therefore write the correct option in any position. Explanations must not refer to option letters.
 */
export function shuffleMcq<T extends Mcq>(q: T): T {
  const rnd = seeded(q.id);
  const order = [...KEYS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  // order[newIndex] = oldKey
  const options = Object.fromEntries(order.map((oldKey, i) => [KEYS[i], q.options[oldKey]])) as Mcq["options"];
  const newKeyOf = (oldKey: string) => KEYS[order.indexOf(oldKey as (typeof KEYS)[number])]!;
  const distractors = q.distractors ? Object.fromEntries(Object.entries(q.distractors).map(([k, v]) => [newKeyOf(k), v])) : undefined;
  return { ...q, options, answer: newKeyOf(q.answer), ...(distractors ? { distractors } : {}) };
}
