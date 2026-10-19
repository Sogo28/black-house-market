import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Connexion · Back-office Black House", robots: { index: false } };

export default function SignInPage(props: PageProps<"/admin/connexion">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <div className="mb-6 flex flex-col items-center gap-2 rounded-xl bg-ink py-4">
          <Logo width={200} withTagline />
        </div>
        <h1 className="mb-4 text-xl font-semibold">Back-office</h1>
        <Suspense fallback={null}>
          <Form {...props} />
        </Suspense>
      </div>
    </main>
  );
}

async function Form({ searchParams }: PageProps<"/admin/connexion">) {
  const { refus } = await searchParams;
  return <SignInForm refused={refus === "1"} />;
}
