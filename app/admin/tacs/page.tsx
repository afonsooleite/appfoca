import { supabase } from "@/lib/supabase";
import AdminTacsClient from "./components/AdminTacsClient";

export const dynamic = "force-dynamic";

export default async function AdminTacsPage() {
  const { data: tacs, error } = await supabase
    .from("tacs")
    .select("*")
    .order("epoca", { ascending: false })
    .order("escalao", { ascending: true });

  return (
    <main>
      {error ? (
        <div className="bg-red-500/10 text-red-400 p-6 rounded-xl border border-red-500/20 shadow-sm">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
            Erro ao carregar TACs
          </h2>
          <p>{error.message}</p>
        </div>
      ) : (
        <AdminTacsClient initialTacs={tacs || []} />
      )}
    </main>
  );
}
