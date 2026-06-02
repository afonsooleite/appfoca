export default function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold">
            Atletas
          </h2>
          <p className="text-3xl mt-2">1</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold">
            Equipas
          </h2>
          <p className="text-3xl mt-2">0</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold">
            Treinos
          </h2>
          <p className="text-3xl mt-2">0</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold">
            Competições
          </h2>
          <p className="text-3xl mt-2">0</p>
        </div>
      </div>
    </div>
  );
}