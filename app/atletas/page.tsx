import { supabase } from "@/lib/supabase";
import AtletasClient from "./components/AtletasClient";

// Opt in to dynamic rendering to always fetch the latest data
export const dynamic = "force-dynamic";

export default async function AtletasPage() {
  const { data: atletas, error } = await supabase
    .from("atletas")
    .select("*")
    .order("nome");

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      {error ? (
        <div className="max-w-6xl mx-auto bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 shadow-sm">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Erro ao carregar atletas
          </h2>
          <p className="text-red-500">{error.message}</p>
        </div>
      ) : (
        <AtletasClient initialAtletas={atletas || []} />
      )}
    </main>
  );
}