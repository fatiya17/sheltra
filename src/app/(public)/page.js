import AnonymousReport from "@/features/report/components/anonymous-report";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background md:py-10 flex flex-col items-center justify-start gap-8">
      <AnonymousReport />
    </main>
  );
}
