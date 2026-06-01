export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold">
        Gestão de Treinos FOCA
      </h1>

      <div className="mt-8 space-y-4">
        <a href="/atletas">Atletas</a>
        <br />
        <a href="/equipas">Equipas</a>
        <br />
        <a href="/treinos">Treinos</a>
        <br />
        <a href="/planeamento">Planeamento</a>
      </div>
    </main>
  );
}