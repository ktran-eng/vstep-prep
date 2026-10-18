"use client";
import { useRouter } from "next/navigation";
import { submitSpeakingAction } from "@/app/actions/practice";
import { Recorder } from "./exam/recorder";

export function SpeakingPractice({ promptId, preparationSeconds, responseSeconds }: { promptId: string; preparationSeconds: number; responseSeconds: number }) {
  const router = useRouter();
  return (
    <Recorder
      preparationSeconds={preparationSeconds}
      responseSeconds={responseSeconds}
      allowRetry
      alreadySubmitted={false}
      onSubmit={async (blob, durationSeconds, consent) => {
        const fd = new FormData();
        fd.set("audio", blob, "speech");
        fd.set("promptId", promptId);
        fd.set("consent", consent);
        fd.set("durationSeconds", String(durationSeconds));
        try {
          const r = await submitSpeakingAction(fd);
          if (r.ok) router.refresh();
          return r.ok ? { ok: true } : { ok: false, error: r.error };
        } catch {
          return { ok: false, error: "Network error during upload. Your recording is kept; try again." };
        }
      }}
    />
  );
}
