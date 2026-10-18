/** npm run content:validate — structural + provenance checks for all content. Exits non-zero on errors. */
import { loadBundle } from "../content/index";
import { validateBundle } from "../src/domain/content-validation";
import { DEFAULT_EXAM_SPEC } from "../src/domain/spec";
import { countWords } from "../src/domain/text";

const bundle = loadBundle();
const issues = validateBundle(bundle, DEFAULT_EXAM_SPEC);
const errors = issues.filter((i) => i.severity === "error");
const warnings = issues.filter((i) => i.severity === "warning");

for (const i of issues) console.log(`${i.severity === "error" ? "ERROR  " : "warning"} ${i.entity}: ${i.message}`);

const q = (sets: { questions: unknown[] }[]) => sets.reduce((n, s) => n + s.questions.length, 0);
const byLevel = <T extends { level: string }>(xs: T[]) => Object.fromEntries(["B1", "B2", "C1"].map((l) => [l, xs.filter((x) => x.level === l).length]));
const keyDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
for (const s of [...bundle.reading, ...bundle.listening]) for (const qq of s.questions) keyDist[qq.answer]!++;

console.log("\nContent inventory");
console.log(`  Reading passages: ${bundle.reading.length} ${JSON.stringify(byLevel(bundle.reading))}, questions: ${q(bundle.reading)}`);
for (const b of bundle.blueprints.filter((b) => b.kind === "mock")) {
  const ids = b.sections.find((s) => s.skill === "reading")?.items ?? [];
  const words = bundle.reading.filter((r) => ids.includes(r.id)).reduce((n, r) => n + countWords(r.passage), 0);
  console.log(`    ${b.id} reading words: ${words}`);
}
console.log(`  Listening recordings: ${bundle.listening.length} ${JSON.stringify(byLevel(bundle.listening))}, questions: ${q(bundle.listening)}`);
console.log(`  Writing prompts: ${bundle.writing.length} (letters ${bundle.writing.filter((w) => w.task === "letter").length}, essays ${bundle.writing.filter((w) => w.task === "essay").length}) ${JSON.stringify(byLevel(bundle.writing))}`);
console.log(`  Speaking prompts: ${bundle.speaking.length} (P1 ${bundle.speaking.filter((s) => s.content.part === 1).length}, P2 ${bundle.speaking.filter((s) => s.content.part === 2).length}, P3 ${bundle.speaking.filter((s) => s.content.part === 3).length}) ${JSON.stringify(byLevel(bundle.speaking))}`);
console.log(`  Blueprints: ${bundle.blueprints.length} (mocks ${bundle.blueprints.filter((b) => b.kind === "mock").length})`);
console.log(`  Answer key distribution: ${JSON.stringify(keyDist)}`);
console.log(`\n${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
