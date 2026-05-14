import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-300">Business CMD</p>
        <h1 className="mt-3 text-4xl font-black text-white">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">This route is not part of the command center.</p>
        <ButtonLink href="/" className="mt-6">Back to dashboard</ButtonLink>
        <p className="mt-4 text-xs text-slate-600">
          Or go to <Link href="/today" className="text-sky-300">Today Mode</Link>.
        </p>
      </div>
    </main>
  );
}
