"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";

type Atleta = {
  id: string | number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  escalao?: string;
};

const ESCALOES_ORDER = [
  "Seniores",
  "Juniores",
  "Juvenis",
  "Infantis",
  "Cadetes",
  "Grupo Formação"
];

export default function EquipasClient({ initialAtletas }: { initialAtletas: Atleta[] }) {
  // Mocking missing escalao for visual testing if needed
  const atletas = initialAtletas.map(a => ({
    ...a,
    escalao: a.escalao || "Seniores" // Fallback
  }));

  // Group athletes by their escalao
  const groupedAtletas = ESCALOES_ORDER.map(escalao => {
    return {
      escalao,
      atletas: atletas.filter(a => a.escalao === escalao)
    };
  });

  // Catch any athletes with an unknown or empty escalao
  const unknownAtletas = atletas.filter(a => !ESCALOES_ORDER.includes(a.escalao || ""));
  if (unknownAtletas.length > 0) {
    groupedAtletas.push({
      escalao: "Outros / Sem Escalão Definido",
      atletas: unknownAtletas
    });
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <span className="p-2 bg-[rgba(15,23,42,0.8)] rounded-xl border border-[rgba(255,255,255,0.08)]">🛡️</span>
            Escalões
          </h1>
          <p className="text-[#94a3b8] mt-2 text-sm">
            Gestão dos atletas distribuídos pelos respetivos escalões de idade e formação.
          </p>
        </div>
      </motion.div>

      {/* Escalões List */}
      <div className="space-y-10">
        {groupedAtletas.map((grupo, idx) => {
          // If this is the "Outros" group and it's empty, we can still hide it.
          // But standard escalões must always show.
          if (grupo.escalao === "Outros / Sem Escalão Definido" && grupo.atletas.length === 0) return null;

          return (
            <motion.div 
              key={grupo.escalao}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[rgba(15,23,42,0.65)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.05)] pb-4">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                  {grupo.escalao}
                </h2>
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full text-xs font-bold">
                  {grupo.atletas.length} {grupo.atletas.length === 1 ? 'Atleta' : 'Atletas'}
                </span>
              </div>

              {grupo.atletas.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {grupo.atletas.map((atleta) => (
                    <motion.div 
                      whileHover={{ y: -4, scale: 1.02 }}
                      key={atleta.id}
                      className="bg-[rgba(15,23,42,0.9)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(168,85,247,0.08)] transition-all rounded-2xl p-4 flex items-center gap-4 group cursor-default"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold shadow-[0_4px_10px_rgba(168,85,247,0.4)] flex-shrink-0">
                        {getInitials(atleta.nome)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                          {atleta.nome}
                        </p>

                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 bg-[rgba(15,23,42,0.4)] border border-[rgba(255,255,255,0.05)] rounded-2xl border-dashed">
                  <Users className="w-8 h-8 text-[#94a3b8] mb-3 opacity-50" />
                  <p className="text-[#94a3b8] text-sm">Sem atletas inscritos neste escalão.</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
