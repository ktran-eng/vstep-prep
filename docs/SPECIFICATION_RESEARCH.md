# VSTEP.3–5 Specification Research

Last verified: 2026-10-18. The machine-readable registry lives in `content/sources.json` and is seeded into the `sources` table.

## 1. Primary source (Tier 1)

**Quyết định 729/QĐ-BGDĐT (11/03/2015)** — "Ban hành Định dạng đề thi đánh giá năng lực sử dụng tiếng Anh từ bậc 3 đến bậc 5 theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam", Ministry of Education and Training (MOET), signed by Deputy Minister Nguyễn Vinh Hiển. In force from the date of signature.

Copy read in full: https://www.haui.edu.vn/media/25/uftai-ve-tai-day25445.pdf (Hanoi University of Industry mirror of the official text). Another scanned copy is on HCMUTE: https://sdh.hcmute.edu.vn/Resources/Docs/SubDomain/sdh/2016/5a-QD%20729%20DD%20bac%203-5%20(11.3.2015).pdf

### Verified directly from the decree

| Skill | Time | Items | Task description |
|---|---|---|---|
| Listening (Nghe) | about 40 min, including answer transfer | 3 parts, 35 MCQ | short exchanges, instructions, announcements, conversations, talks and lectures |
| Reading (Đọc) | 60 min, including answer transfer | 4 passages, 40 MCQ | 4 texts on different topics, B1–C1 difficulty, **1,900–2,050 words in total** |
| Writing (Viết) | 60 min | 2 tasks | Task 1: letter/email of **about 120 words**, worth **1/3** of the Writing score. Task 2: essay of **about 250 words** on a given topic, with reasons and examples, worth **2/3** |
| Speaking (Nói) | 12 min | 3 parts | Part 1: social interaction, 3–6 questions on 2 topics. Part 2: solution discussion (a situation with 3 options; choose the best one and argue against the others). Part 3: topic development with suggested ideas, then follow-up questions |

**Scoring (Section II of the decree):**
- Each skill is scored on a 0–10 scale, **rounded to 0.5**.
- The **average of the 4 skills, rounded to 0.5**, determines the level.
- Below 4.0: no level awarded under this format. 4.0–5.5: Bậc 3 (B1). 6.0–8.0: Bậc 4 (B2). 8.5–10: Bậc 5 (C1).

## 2. Secondary sources (Tier 1 institutional / Tier 2 commercial)

| Source | Claim | Status |
|---|---|---|
| VSTEP Testing Center, ULIS-VNU — https://vstep.vnu.edu.vn/test-format/ | Same structure as the decree; reading total given as **1,900–2,500 words**; Writing Task 1 "at least 120 words", Task 2 "at least 250 words" | Institutional, consistent with the decree, except for the discrepancies noted below |
| VNU International School — https://www.is.vnu.edu.vn/en/test-format-for-the-vstep-test/ (dated 03/04/2021) | Same as ULIS | Institutional mirror |
| ZIM Academy — https://zim.vn/de-thi-vstep | Listening split 8 / 12 / 15; Speaking parts 3′ / 4′ / 5′; listening includes 5 min for answer transfer | Commercial; **unverified** against a primary source |
| Wikipedia — VSTEP article | Listening split 8 / 12 / 15 | Marked "citation needed"; not authoritative |
| vstep.edu.vn (Anh Ngữ Vivian), aceofenglish.com | Prep resources (free downloads, mock tests) | Commercial; linked only, content not reused |

## 3. Discrepancies and unverified assumptions

1. **Reading word count.** The decree says 1,900–2,050 words; ULIS/VNU pages say 1,900–2,500. We follow the decree for the spec and record the range in the editable exam specification. Our passages are validated against a tolerant range (1,600–2,600) and flagged when outside the decree range.
2. **Listening part split (8/12/15).** Widely cited, but not in the decree. Used as the default and marked `verified: false` in the spec config.
3. **Speaking per-part timing (3/4/5 min) and 1-minute preparation for Parts 2–3.** Not in the decree. Used as configurable defaults and marked unverified.
4. **Reading/Listening raw-score → 0–10 conversion.** No public official conversion table was found. The platform's "estimated skill score" is a **linear practice estimate** (`10 × correct / total`, rounded to 0.5). It is labeled as unofficial everywhere and can be edited in admin scoring config.
5. **Official Writing/Speaking rating scales.** MOET Decision 2913/QĐ-BGDĐT (2016) concerns examiner training; the official rating scales and descriptors were not publicly retrievable. The platform's rubrics are labeled **"educational practice rubric"** (`is_official = false`), with criteria commonly used in VSTEP examiner practice (task fulfilment, organisation, vocabulary, grammar; plus pronunciation and fluency for speaking).
6. **Regulatory framework.** Thông tư 23/2017/TT-BGDĐT (Quy chế thi), amended by Thông tư 24/2021/TT-BGDĐT and consolidated in VBHN 01/VBHN-BGDĐT (23/05/2022). A replacement draft has been reported; its status was not confirmed.

## 4. Product consequences

- VSTEP.3–5 is **one multi-level test**: the same paper spans B1–C1, and the level comes from the averaged score. There are no separate "B1 papers". Each full mock on this platform follows that single-paper format, with passages graded from easier to harder. Level-specific content is offered through focused practice sets (B1/B2/C1).
- Practice performance (raw, accuracy, time) and estimated proficiency (0–10 estimate, band) are shown separately. Every estimate carries a "not an official result" disclaimer.
- The exam specification and scoring policy are stored as versioned JSON in `exam_specifications` / `scoring_configs` and edited from `/admin/scoring`.
