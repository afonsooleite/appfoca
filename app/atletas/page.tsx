import { supabase } from "@/lib/supabase";

export default async function AtletasPage() {
  const { data: atletas, error } = await supabase
    .from("atletas")
    .select("*")
    .order("nome");

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">
        Atletas
      </h1>

      {error && (
        <p className="text-red-500">
          Erro: {error.message}
        </p>
      )}

      {atletas?.length === 0 && (
        <p>Nenhum atleta encontrado.</p>
      )}

      <div className="space-y-4">
        {atletas?.map((atleta) => (
          <div
            key={atleta.id}
            className="border rounded-lg p-4 shadow-sm"
          >
            <h2 className="font-semibold text-lg">
              {atleta.nome}
            </h2>

            <p>Email: {atleta.email ?? "-"}</p>
            <p>Telefone: {atleta.telefone ?? "-"}</p>
          </div>
        ))}
      </div>
    </main>
  );
}