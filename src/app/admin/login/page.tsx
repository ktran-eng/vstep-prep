import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/server/admin-auth";
import { AdminLoginForm } from "./form";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (!adminConfigured()) notFound();
  if (await isAdmin()) redirect("/admin");
  return (
    <main id="main" className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="mb-4 text-xl font-semibold">Quản trị / Admin</h1>
      <AdminLoginForm />
    </main>
  );
}
