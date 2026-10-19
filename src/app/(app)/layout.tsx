import { AppShell } from "@/components/app-shell";
import { requireLearner, getLearnerProfile } from "@/server/identity";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  // Every workspace page needs a sign-in name; visitors without one are sent to /start.
  const { learner } = await getLearnerProfile(await requireLearner());
  return <AppShell username={learner?.username}>{children}</AppShell>;
}
