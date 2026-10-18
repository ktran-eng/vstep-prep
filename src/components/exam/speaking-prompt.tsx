import type { PublicSpeakingGroup } from "@/domain/snapshot";

export function SpeakingPromptView({ group }: { group: Pick<PublicSpeakingGroup, "part" | "title" | "instructions" | "content" | "preparationSeconds" | "responseSeconds"> }) {
  const c = group.content;
  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-5 text-sm">
      <p className="text-xs uppercase tracking-wide text-muted">
        Part {group.part} · {group.preparationSeconds ? `${group.preparationSeconds}s prep · ` : ""}
        {Math.round(group.responseSeconds / 60)} min
      </p>
      <h2 className="text-lg font-semibold">{group.title}</h2>
      <p className="text-muted">{group.instructions}</p>
      {c.part === 1 &&
        c.topics.map((tp) => (
          <div key={tp.name}>
            <h3 className="font-medium">{tp.name}</h3>
            <ul className="ml-5 list-disc">
              {tp.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        ))}
      {c.part === 2 && (
        <>
          <p className="rounded-md bg-surface-2 p-3">{c.situation}</p>
          <ol className="ml-5 list-[upper-alpha] space-y-1">
            {c.options.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ol>
        </>
      )}
      {c.part === 3 && (
        <>
          <p className="rounded-md bg-surface-2 p-3 font-medium">{c.topic}</p>
          <div className="flex flex-wrap gap-2">
            {c.ideas.map((i) => (
              <span key={i} className="rounded-full border border-border px-3 py-1">
                {i}
              </span>
            ))}
          </div>
          <div>
            <h3 className="font-medium">Follow-up questions</h3>
            <ul className="ml-5 list-disc">
              {c.followUps.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
