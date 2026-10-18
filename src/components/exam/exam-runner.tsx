"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AttemptView } from "@/server/exam-engine";
import type { PublicGroup, PublicListeningGroup, PublicQuestion, PublicReadingGroup, PublicSpeakingGroup, PublicWritingGroup, TranscriptSegment } from "@/domain/snapshot";
import { countWords } from "@/domain/text";
import { useT } from "@/i18n/client";
import { fmt } from "@/i18n/dict";
import {
  advanceSectionAction,
  getAttemptViewAction,
  registerPlayAction,
  saveAnswerAction,
  saveWritingAction,
  toggleMarkAction,
  transcriptAction,
} from "@/app/actions/exam";
import { submitSpeakingAction } from "@/app/actions/practice";
import { Badge, Button, Notice, cx, formatDuration } from "../ui";
import { ConfirmDialog } from "../confirm-dialog";
import { useCountdown, useElapsed } from "../use-clock";
import { AudioPlayer } from "./audio-player";
import { Recorder } from "./recorder";
import { SpeakingPromptView } from "./speaking-prompt";

type SaveState = "idle" | "saving" | "saved" | "error" | "offline";
type Answer = { response: string | null; marked: boolean };

const SKILL_LABEL: Record<string, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };

export function ExamRunner({ initial, maxPlays }: { initial: AttemptView; maxPlays: number }) {
  const { t } = useT();
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [answers, setAnswers] = useState<Record<string, Answer>>(() =>
    Object.fromEntries(Object.entries(initial.answers).map(([k, v]) => [k, { response: v.response, marked: v.marked }])),
  );
  const [groupIdx, setGroupIdx] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | "section" | "submit">(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(new Map<string, { response: string | null }>());
  const flushing = useRef(false);
  const lastSaveAt = useRef(0);
  const writingFlush = useRef<(() => Promise<void>) | null>(null);
  const registerWritingFlush = useCallback((fn: () => Promise<void>) => {
    writingFlush.current = fn;
  }, []);
  useEffect(() => {
    lastSaveAt.current = Date.now();
  }, []);

  const strict = view.attempt.mode === "exam";
  const section = view.snapshot.sections.find((s) => s.order === view.attempt.currentSection)!;
  const isLast = section.order === view.snapshot.sections[view.snapshot.sections.length - 1]!.order;
  const group = section.groups[Math.min(groupIdx, section.groups.length - 1)]!;

  /* ------------------------------ timing ------------------------------ */
  const [clockKey, setClockKey] = useState(0);
  const remaining = useCountdown(view.remainingSeconds, clockKey);
  const elapsed = useElapsed(view.sections.find((s) => s.order === section.order)?.startedAt);

  const applyView = useCallback(
    (v: AttemptView) => {
      if (v.attempt.status !== "in_progress") {
        router.replace(`/attempt/${v.attempt.id}/result`);
        return;
      }
      setView((prev) => {
        if (prev.attempt.currentSection !== v.attempt.currentSection) setGroupIdx(0);
        return v;
      });
      setClockKey((k) => k + 1);
      setAnswers((prev) => {
        const next = { ...prev };
        for (const [k, a] of Object.entries(v.answers)) if (!pending.current.has(k)) next[k] = { response: a.response, marked: a.marked };
        return next;
      });
    },
    [router],
  );

  const refresh = useCallback(async () => {
    const r = await getAttemptViewAction(view.attempt.id);
    if (r.ok) applyView(r.data);
  }, [view.attempt.id, applyView]);

  /* ------------------------------ saving ------------------------------ */
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      while (pending.current.size) {
        const [qid, p] = pending.current.entries().next().value as [string, { response: string | null }];
        setSaveState("saving");
        const delta = Math.round((Date.now() - lastSaveAt.current) / 1000);
        let r;
        try {
          r = await saveAnswerAction({ attemptId: view.attempt.id, questionId: qid, response: p.response, timeSpentDelta: Math.min(delta, 600) });
        } catch {
          setSaveState(navigator.onLine ? "error" : "offline");
          return; // keep pending; retried by interval/online event
        }
        if (r.ok) {
          lastSaveAt.current = Date.now();
          if (pending.current.get(qid) === p) pending.current.delete(qid);
        } else {
          pending.current.delete(qid);
          if (r.code === "expired" || r.code === "closed" || r.code === "wrong_section") {
            setNotice(r.error);
            await refresh();
            return;
          }
          setSaveState("error");
          setNotice(r.error);
          return;
        }
      }
      setSaveState("saved");
    } finally {
      flushing.current = false;
    }
  }, [view.attempt.id, refresh]);

  // Server-authoritative expiry: when the local countdown reaches zero, ask the server what happened.
  const expiredHandled = useRef(false);
  useEffect(() => {
    if (remaining !== 0 || expiredHandled.current) {
      if (remaining && remaining > 0) expiredHandled.current = false;
      return;
    }
    expiredHandled.current = true;
    void flush()
      .then(refresh)
      .then(() => setNotice(t.exam.timeUp));
  }, [remaining, flush, refresh, t.exam.timeUp]);

  useEffect(() => {
    const retry = () => pending.current.size && void flush();
    const id = window.setInterval(retry, 5000);
    window.addEventListener("online", retry);
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current.size) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", retry);
      window.removeEventListener("beforeunload", warn);
    };
  }, [flush]);

  function choose(q: PublicQuestion, key: string) {
    const current = answers[q.id]?.response ?? null;
    const response = current === key && !strict ? null : key; // practice: click again to clear
    setAnswers((a) => ({ ...a, [q.id]: { response, marked: a[q.id]?.marked ?? false } }));
    pending.current.set(q.id, { response });
    void flush();
  }

  async function mark(q: PublicQuestion) {
    const marked = !(answers[q.id]?.marked ?? false);
    setAnswers((a) => ({ ...a, [q.id]: { response: a[q.id]?.response ?? null, marked } }));
    const r = await toggleMarkAction({ attemptId: view.attempt.id, questionId: q.id, marked });
    if (!r.ok) setNotice(r.error);
  }

  /* --------------------------- section control --------------------------- */
  const sectionQuestions = useMemo(
    () => section.groups.flatMap((g) => (g.kind === "reading" || g.kind === "listening" ? g.questions.map((q) => ({ q, groupIndex: section.groups.indexOf(g) })) : [])),
    [section],
  );
  const unanswered = sectionQuestions.filter(({ q }) => !answers[q.id]?.response).length;

  async function finishSection() {
    setBusy(true);
    await flush();
    await writingFlush.current?.();
    const r = await advanceSectionAction({ attemptId: view.attempt.id, expectedSection: section.order });
    setBusy(false);
    setConfirm(null);
    if (!r.ok) {
      setNotice(r.error);
      return;
    }
    if (r.data.status !== "in_progress") router.replace(`/attempt/${view.attempt.id}/result`);
    else {
      setNotice(null);
      await refresh();
      window.scrollTo({ top: 0 });
    }
  }


  /* -------------------------------- render -------------------------------- */
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{view.snapshot.blueprint.name}</p>
            <ol className="mt-1 flex flex-wrap gap-1 text-xs" aria-label="Sections">
              {view.snapshot.sections.map((s) => (
                <li key={s.order}>
                  <span
                    aria-current={s.order === section.order ? "step" : undefined}
                    className={cx(
                      "rounded-full px-2 py-0.5",
                      s.order === section.order ? "bg-primary text-primary-fg" : s.order < section.order ? "bg-success-soft text-success" : "bg-surface-2 text-muted",
                    )}
                  >
                    {s.order + 1}. {SKILL_LABEL[s.skill]}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <Badge tone={strict ? "warning" : "primary"}>{strict ? t.exam.examMode : t.exam.practiceMode}</Badge>
          <div className="text-right" aria-live="off">
            <p className="text-xs text-muted">{remaining != null ? t.exam.timeLeft : t.exam.elapsed}</p>
            <p className={cx("font-mono text-lg font-semibold tabular-nums", remaining != null && remaining < 300 && "text-danger")} role="timer" aria-label={remaining != null ? t.exam.timeLeft : t.exam.elapsed}>
              {formatDuration(remaining ?? elapsed)}
            </p>
          </div>
          <p className="w-28 text-xs text-muted" aria-live="polite">
            {saveState === "saving" && t.common.saving}
            {saveState === "saved" && `✓ ${t.common.saved}`}
            {saveState === "error" && <span className="text-danger">{t.common.saveFailed}</span>}
            {saveState === "offline" && <span className="text-warning">{t.exam.offline}</span>}
          </p>
        </div>
        {remaining != null && remaining <= 300 && remaining > 0 && (
          <p className="sr-only" aria-live="assertive">
            {remaining === 300 ? "5 minutes remaining" : remaining === 60 ? "1 minute remaining" : ""}
          </p>
        )}
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-4">
        {notice && (
          <Notice tone="warning" className="mb-4">
            {notice}
          </Notice>
        )}

        {section.groups.length > 1 && (
          <nav aria-label="Parts" className="mb-4 flex flex-wrap gap-2">
            {section.groups.map((g, i) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroupIdx(i)}
                aria-current={i === groupIdx ? "true" : undefined}
                className={cx("rounded-lg border px-3 py-1.5 text-sm", i === groupIdx ? "border-primary bg-primary-soft font-medium text-primary" : "border-border bg-surface hover:bg-surface-2")}
              >
                {groupLabel(g, i)}
              </button>
            ))}
          </nav>
        )}

        <GroupView
          key={group.id}
          group={group}
          view={view}
          strict={strict}
          answers={answers}
          maxPlays={maxPlays}
          onChoose={choose}
          onMark={mark}
          registerWritingFlush={registerWritingFlush}
          onError={setNotice}
        />

        {sectionQuestions.length > 0 && (
          <section aria-label={t.exam.navigator} className="mt-6 rounded-lg border border-border bg-surface p-3">
            <h2 className="mb-2 text-sm font-medium">
              {t.exam.navigator} · {sectionQuestions.length - unanswered}/{sectionQuestions.length} {t.exam.answered.toLowerCase()}
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {sectionQuestions.map(({ q, groupIndex }) => {
                const a = answers[q.id];
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setGroupIdx(groupIndex);
                        window.setTimeout(() => document.getElementById(`q-${q.id}`)?.scrollIntoView({ block: "center" }), 50);
                      }}
                      aria-label={`${t.exam.question} ${q.number}: ${a?.response ? t.exam.answered : t.exam.unanswered}${a?.marked ? `, ${t.exam.marked}` : ""}`}
                      className={cx(
                        "relative h-9 w-9 rounded-md border text-sm tabular-nums",
                        a?.response ? "border-primary bg-primary text-primary-fg" : "border-border-strong bg-surface",
                        groupIndex === groupIdx && "ring-2 ring-offset-1 ring-[var(--focus)]",
                      )}
                    >
                      {q.number}
                      {a?.marked && <span aria-hidden className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-surface bg-warning" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted">
              <span className="inline-block h-3 w-3 rounded-sm bg-primary align-middle" /> {t.exam.answered} ·{" "}
              <span className="inline-block h-3 w-3 rounded-sm border border-border-strong align-middle" /> {t.exam.unanswered} ·{" "}
              <span className="inline-block h-3 w-3 rounded-full bg-warning align-middle" /> {t.exam.marked}
            </p>
          </section>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex gap-2">
            <Button variant="secondary" disabled={groupIdx === 0} onClick={() => setGroupIdx((i) => i - 1)}>
              ← {t.common.previous}
            </Button>
            <Button variant="secondary" disabled={groupIdx >= section.groups.length - 1} onClick={() => setGroupIdx((i) => i + 1)}>
              {t.common.next} →
            </Button>
          </div>
          <Button onClick={() => setConfirm(isLast ? "submit" : "section")} variant={isLast ? "primary" : "secondary"}>
            {isLast ? t.exam.submitAll : t.exam.finishSection}
          </Button>
        </div>
      </main>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "submit" ? t.exam.submitAll : t.exam.finishSection}
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={finishSection}
      >
        <p>{confirm === "submit" ? t.exam.submitConfirm : t.exam.finishSectionConfirm}</p>
        {unanswered > 0 && <p className="mt-2 font-medium text-warning">{fmt(t.exam.unansweredWarn, { n: unanswered })}</p>}
      </ConfirmDialog>
    </div>
  );
}

function groupLabel(g: PublicGroup, i: number) {
  if (g.kind === "reading") return `Passage ${i + 1}`;
  if (g.kind === "listening") return g.part === 1 ? `P1 · ${i + 1}` : `Part ${g.part} · ${g.title.includes(":") ? g.title.split(":")[1]!.trim() : g.title}`;
  if (g.kind === "writing") return g.task === "letter" ? "Task 1 · Letter" : "Task 2 · Essay";
  return `Part ${g.part}`;
}

/* ============================== group views ============================== */

function GroupView(props: {
  group: PublicGroup;
  view: AttemptView;
  strict: boolean;
  answers: Record<string, Answer>;
  maxPlays: number;
  onChoose: (q: PublicQuestion, key: string) => void;
  onMark: (q: PublicQuestion) => void;
  registerWritingFlush: (fn: () => Promise<void>) => void;
  onError: (m: string) => void;
}) {
  const g = props.group;
  if (g.kind === "reading") return <ReadingView {...props} group={g} />;
  if (g.kind === "listening") return <ListeningView {...props} group={g} />;
  if (g.kind === "writing") return <WritingView {...props} group={g} />;
  return <SpeakingView {...props} group={g} />;
}

function QuestionList({ questions, answers, strict, onChoose, onMark }: { questions: PublicQuestion[]; answers: Record<string, Answer>; strict: boolean; onChoose: (q: PublicQuestion, k: string) => void; onMark: (q: PublicQuestion) => void }) {
  const { t } = useT();
  return (
    <ol className="space-y-5">
      {questions.map((q) => {
        const a = answers[q.id];
        return (
          <li key={q.id} id={`q-${q.id}`} className="scroll-mt-28">
            <fieldset>
              <legend className="mb-2 font-medium">
                <span className="mr-1 tabular-nums">{q.number}.</span> {q.prompt}
              </legend>
              <div className="space-y-1.5">
                {q.options.map((o) => {
                  const checked = a?.response === o.key;
                  return (
                    <label
                      key={o.key}
                      className={cx(
                        "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm",
                        checked ? "border-primary bg-primary-soft" : "border-border bg-surface hover:bg-surface-2",
                      )}
                    >
                      <input type="radio" name={q.id} value={o.key} checked={checked} onChange={() => onChoose(q, o.key)} onClick={() => !strict && checked && onChoose(q, o.key)} className="mt-1 accent-[var(--primary)]" />
                      <span>
                        <span className="font-semibold">{o.key}.</span> {o.text}
                      </span>
                    </label>
                  );
                })}
              </div>
              <button type="button" onClick={() => onMark(q)} aria-pressed={a?.marked ?? false} className={cx("mt-2 text-xs underline-offset-2 hover:underline", a?.marked ? "font-medium text-warning" : "text-muted")}>
                {a?.marked ? `★ ${t.exam.marked}` : `☆ ${t.exam.markForReview}`}
              </button>
            </fieldset>
          </li>
        );
      })}
    </ol>
  );
}

function ReadingView({ group, answers, strict, onChoose, onMark }: { group: PublicReadingGroup; answers: Record<string, Answer>; strict: boolean; onChoose: (q: PublicQuestion, k: string) => void; onMark: (q: PublicQuestion) => void }) {
  const { t } = useT();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article aria-labelledby={`title-${group.id}`} className="rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
        <p className="text-xs uppercase tracking-wide text-muted">{t.exam.passage}</p>
        <h2 id={`title-${group.id}`} className="mb-3 text-xl font-semibold">
          {group.title}
        </h2>
        <div className="reading-text prose-passage">
          {group.paragraphs.map((p, i) => (
            <p key={i}>
              <span className="mr-2 select-none text-xs text-muted" aria-hidden>
                [{i + 1}]
              </span>
              {p}
            </p>
          ))}
        </div>
      </article>
      <div className="rounded-lg border border-border bg-surface p-5">
        <QuestionList questions={group.questions} answers={answers} strict={strict} onChoose={onChoose} onMark={onMark} />
      </div>
    </div>
  );
}

function ListeningView({
  group,
  view,
  answers,
  strict,
  maxPlays,
  onChoose,
  onMark,
  onError,
}: {
  group: PublicListeningGroup;
  view: AttemptView;
  answers: Record<string, Answer>;
  strict: boolean;
  maxPlays: number;
  onChoose: (q: PublicQuestion, k: string) => void;
  onMark: (q: PublicQuestion) => void;
  onError: (m: string) => void;
}) {
  const { t } = useT();
  const [played, setPlayed] = useState((view.plays[group.id] ?? 0) > 0);
  const [transcript, setTranscript] = useState<TranscriptSegment[] | null>(null);
  const attemptId = view.attempt.id;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Part {group.part}</p>
          <h2 className="mb-3 font-semibold">{group.title}</h2>
          {group.audioUrl ? (
            <AudioPlayer
              src={group.audioUrl}
              title={group.title}
              strict={strict}
              playsUsed={view.plays[group.id] ?? 0}
              maxPlays={maxPlays}
              onBeforePlay={async () => {
                const r = await registerPlayAction({ attemptId, audioId: group.id });
                if (!r.ok) {
                  onError(r.error);
                  return { allowed: false, plays: maxPlays };
                }
                setPlayed(true);
                return r.data;
              }}
            />
          ) : (
            <Notice tone="warning">{t.exam.noAudio}</Notice>
          )}
          {group.generationMethod === "windows_sapi_dev" && <p className="mt-2 text-xs text-muted">{t.exam.devAudio}</p>}
        </div>
        {!strict && (
          <div className="rounded-lg border border-border bg-surface p-4">
            <Button
              variant="secondary"
              disabled={!played}
              onClick={async () => {
                const r = await transcriptAction({ attemptId, audioId: group.id });
                if (r.ok) setTranscript(r.data);
                else onError(r.error);
              }}
            >
              {t.exam.showTranscript}
            </Button>
            {!played && <p className="mt-1 text-xs text-muted">Nghe ít nhất một lần để mở transcript. / Listen once to unlock the transcript.</p>}
            {transcript && (
              <div className="mt-3 space-y-2 text-sm">
                {transcript.map((s) => (
                  <p key={s.id}>
                    <span className="font-semibold">{s.speaker}:</span> {s.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="rounded-lg border border-border bg-surface p-5">
        <QuestionList questions={group.questions} answers={answers} strict={strict} onChoose={onChoose} onMark={onMark} />
      </div>
    </div>
  );
}

function WritingView({ group, view, registerWritingFlush, onError }: { group: PublicWritingGroup; view: AttemptView; registerWritingFlush: (fn: () => Promise<void>) => void; onError: (m: string) => void }) {
  const { t } = useT();
  const [text, setText] = useState(view.writing[group.id]?.text ?? "");
  const [state, setState] = useState<SaveState>("idle");
  const dirty = useRef(false);
  const textRef = useRef(text);
  const lastAt = useRef(0);
  const words = countWords(text);

  const save = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setState("saving");
    try {
      const delta = lastAt.current ? Math.min(600, Math.round((Date.now() - lastAt.current) / 1000)) : 0;
      const r = await saveWritingAction({ attemptId: view.attempt.id, promptId: group.id, text: textRef.current, timeSpentDelta: delta });
      lastAt.current = Date.now();
      if (r.ok) setState("saved");
      else {
        setState("error");
        onError(r.error);
      }
    } catch {
      dirty.current = true;
      setState("offline");
    }
  }, [view.attempt.id, group.id, onError]);

  useEffect(() => {
    lastAt.current = Date.now();
    registerWritingFlush(save);
    const id = window.setInterval(() => void save(), 4000);
    return () => {
      window.clearInterval(id);
      void save();
    };
  }, [save, registerWritingFlush]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-3 rounded-lg border border-border bg-surface p-5 text-sm">
        <p className="text-xs uppercase tracking-wide text-muted">{group.task === "letter" ? "Task 1" : "Task 2"} · ~{group.suggestedMinutes} min</p>
        <h2 className="text-lg font-semibold">{group.title}</h2>
        <p>{group.instructions}</p>
        {group.stimulus && <blockquote className="whitespace-pre-line rounded-md border-l-4 border-border-strong bg-surface-2 p-3 italic">{group.stimulus}</blockquote>}
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <label htmlFor={`w-${group.id}`} className="sr-only">
          Your response
        </label>
        <textarea
          id={`w-${group.id}`}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            textRef.current = e.target.value;
            dirty.current = true;
          }}
          onBlur={() => void save()}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="sentences"
          className="h-[55vh] w-full resize-y rounded-md border border-border bg-bg p-3 font-serif text-base leading-relaxed"
          aria-describedby={`wc-${group.id}`}
        />
        <div className="mt-2 flex items-center justify-between text-sm">
          <p id={`wc-${group.id}`} className={cx("tabular-nums", words < group.minWords ? "text-warning" : "text-success")}>
            {words} {t.common.words} · min {group.minWords}
          </p>
          <p className="text-xs text-muted" aria-live="polite">
            {state === "saving" ? t.common.saving : state === "saved" ? `✓ ${t.common.saved}` : state === "error" ? t.common.saveFailed : state === "offline" ? t.exam.offline : ""}
          </p>
        </div>
        <p className="mt-1 text-xs text-muted">Spell-check is turned off to match exam conditions.</p>
      </div>
    </div>
  );
}

function SpeakingView({ group, view, strict, onError }: { group: PublicSpeakingGroup; view: AttemptView; strict: boolean; onError: (m: string) => void }) {
  const submitted = Boolean(view.speaking[group.id]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SpeakingPromptView group={group} />
      <Recorder
        preparationSeconds={group.preparationSeconds}
        responseSeconds={group.responseSeconds}
        allowRetry={!strict}
        alreadySubmitted={submitted}
        onSubmit={async (blob, durationSeconds, consent) => {
          const fd = new FormData();
          fd.set("audio", blob, "speech");
          fd.set("promptId", group.id);
          fd.set("attemptId", view.attempt.id);
          fd.set("consent", consent);
          fd.set("durationSeconds", String(durationSeconds));
          try {
            const r = await submitSpeakingAction(fd);
            if (!r.ok) onError(r.error);
            return r.ok ? { ok: true } : { ok: false, error: r.error };
          } catch {
            return { ok: false, error: "Network error during upload. Your recording is kept; try again." };
          }
        }}
      />
    </div>
  );
}
