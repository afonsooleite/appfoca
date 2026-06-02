"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Timer, Search, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function TacsClient() {
  const [escalao, setEscalao] = useState("Absoluto");
  const [genero, setGenero] = useState("M");
  const [estilo, setEstilo] = useState("Livres");
  const [distancia, setDistancia] = useState("100");
  const [piscina, setPiscina] = useState("25");
  
  const [minutos, setMinutos] = useState("01");
  const [segundos, setSegundos] = useState("05");
  const [centesimas, setCentesimas] = useState("00");

  const [resultado, setResultado] = useState<{ aprovado: boolean, tac: string, diff: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verificarTAC = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Convert input time to total seconds for comparison
    const inputMins = parseInt(minutos || "0") * 60;
    const inputSecs = parseInt(segundos || "0");
    const inputCent = parseInt(centesimas || "0") / 100;
    const totalInputSeconds = inputMins + inputSecs + inputCent;

    if (totalInputSeconds <= 0) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("tacs")
      .select("tempo_centesimos")
      .ilike("escalao", escalao)
      .ilike("genero", genero === "M" ? "Masculino" : "Feminino")
      .ilike("estilo", estilo)
      .eq("distancia", parseInt(distancia))
      .eq("piscina", parseInt(piscina))
      .order("epoca", { ascending: false })
      .limit(1);

    if (error) {
      alert("Erro na base de dados: " + error.message);
      setIsLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      const searchParams = `Escalão: ${escalao}\nGénero: ${genero === "M" ? "Masculino" : "Feminino"}\nEstilo: ${estilo}\nDistância: ${distancia}m\nPiscina: ${piscina}m`;
      alert("Não foi encontrado nenhum TAC na base de dados correspondente a:\n\n" + searchParams + "\n\nVerifica em 'Gestão de TACs' se os dados estão escritos exatamente desta forma.");
      setIsLoading(false);
      return;
    }

    const tacCentesimos = data[0].tempo_centesimos;
    const tacSeconds = (Math.floor(tacCentesimos / 100)) + (tacCentesimos % 100) / 100;
    
    const m = Math.floor(tacCentesimos / 6000);
    const s = Math.floor((tacCentesimos % 6000) / 100);
    const c = tacCentesimos % 100;
    const TAC_STRING = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${c.toString().padStart(2, '0')}`;

    if (totalInputSeconds <= tacSeconds) {
      const diff = (tacSeconds - totalInputSeconds).toFixed(2);
      setResultado({
        aprovado: true,
        tac: TAC_STRING,
        diff: `-${diff}s abaixo do TAC`
      });
    } else {
      const diff = (totalInputSeconds - tacSeconds).toFixed(2);
      setResultado({
        aprovado: false,
        tac: TAC_STRING,
        diff: `+${diff}s acima do TAC`
      });
    }
    
    setIsLoading(false);
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
            <span className="p-2 bg-[rgba(15,23,42,0.8)] rounded-xl border border-[rgba(255,255,255,0.08)]">
              <Timer className="w-8 h-8 text-purple-400" />
            </span>
            Verificador de TACs
          </h1>
          <p className="text-[#94a3b8] mt-2 text-sm">
            Tempos de Acesso a Competições. Verifica se o tempo do atleta garante qualificação.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-[rgba(15,23,42,0.65)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 md:p-8 shadow-2xl"
        >
          <form onSubmit={verificarTAC} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Escalão */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Escalão</label>
                <select 
                  value={escalao}
                  onChange={(e) => setEscalao(e.target.value)}
                  className="w-full px-4 py-3 bg-[rgba(15,23,42,0.5)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [&>option]:bg-[#0a0a1a]"
                >
                  <option value="Absoluto">Absoluto</option>
                  <option value="Sénior">Sénior</option>
                  <option value="Sub 21">Sub 21</option>
                  <option value="Júnior">Júnior</option>
                  <option value="1º Júnior">1º Júnior</option>
                  <option value="Juvenil A Julho">Juvenil A Julho</option>
                  <option value="Juvenil A Março">Juvenil A Março</option>
                  <option value="Juvenil B Julho">Juvenil B Julho</option>
                  <option value="Juvenil B Março">Juvenil B Março</option>
                  <option value="Juvenil A">Juvenil A</option>
                  <option value="Juvenil B">Juvenil B</option>
                  <option value="Infantil A">Infantil A</option>
                  <option value="Infantil B">Infantil B</option>
                  <option value="Cadetes">Cadetes</option>
                </select>
              </div>

              {/* Género */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Género</label>
                <div className="flex bg-[rgba(15,23,42,0.5)] border border-[rgba(255,255,255,0.08)] rounded-xl p-1">
                  <button type="button" onClick={() => setGenero("M")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${genero === "M" ? "bg-purple-600 text-white shadow-lg" : "text-[#94a3b8] hover:text-white"}`}>Masculino</button>
                  <button type="button" onClick={() => setGenero("F")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${genero === "F" ? "bg-pink-600 text-white shadow-lg" : "text-[#94a3b8] hover:text-white"}`}>Feminino</button>
                </div>
              </div>

              {/* Estilo */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Estilo</label>
                <select 
                  value={estilo}
                  onChange={(e) => setEstilo(e.target.value)}
                  className="w-full px-4 py-3 bg-[rgba(15,23,42,0.5)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [&>option]:bg-[#0a0a1a]"
                >
                  <option value="Livres">Livres</option>
                  <option value="Costas">Costas</option>
                  <option value="Bruços">Bruços</option>
                  <option value="Mariposa">Mariposa</option>
                  <option value="Estilos">Estilos</option>
                </select>
              </div>

              {/* Distância */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Distância (m)</label>
                <select 
                  value={distancia}
                  onChange={(e) => setDistancia(e.target.value)}
                  className="w-full px-4 py-3 bg-[rgba(15,23,42,0.5)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [&>option]:bg-[#0a0a1a]"
                >
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="400">400</option>
                  <option value="800">800</option>
                  <option value="1500">1500</option>
                </select>
              </div>

              {/* Piscina */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Tamanho da Piscina</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${piscina === "25" ? "bg-purple-500 border-purple-500" : "border-[rgba(255,255,255,0.2)] group-hover:border-purple-400"}`}>
                      {piscina === "25" && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-white font-medium">Curta (25m)</span>
                    <input type="radio" name="piscina" value="25" checked={piscina === "25"} onChange={(e) => setPiscina(e.target.value)} className="hidden" />
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${piscina === "50" ? "bg-purple-500 border-purple-500" : "border-[rgba(255,255,255,0.2)] group-hover:border-purple-400"}`}>
                      {piscina === "50" && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-white font-medium">Longa (50m)</span>
                    <input type="radio" name="piscina" value="50" checked={piscina === "50"} onChange={(e) => setPiscina(e.target.value)} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <hr className="border-[rgba(255,255,255,0.05)]" />

            {/* Tempo do Atleta */}
            <div>
              <label className="block text-sm font-medium text-purple-400 mb-3">Tempo do Atleta</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min="0" 
                  max="59" 
                  value={minutos}
                  onChange={(e) => setMinutos(e.target.value)}
                  className="w-20 px-4 py-4 bg-[rgba(15,23,42,0.9)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-xl text-center focus:outline-none focus:border-purple-500" 
                  placeholder="MM"
                />
                <span className="text-2xl text-white font-bold">:</span>
                <input 
                  type="number" 
                  min="0" 
                  max="59" 
                  value={segundos}
                  onChange={(e) => setSegundos(e.target.value)}
                  className="w-20 px-4 py-4 bg-[rgba(15,23,42,0.9)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-xl text-center focus:outline-none focus:border-purple-500" 
                  placeholder="SS"
                />
                <span className="text-2xl text-white font-bold">.</span>
                <input 
                  type="number" 
                  min="0" 
                  max="99" 
                  value={centesimas}
                  onChange={(e) => setCentesimas(e.target.value)}
                  className="w-20 px-4 py-4 bg-[rgba(15,23,42,0.9)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-xl text-center focus:outline-none focus:border-purple-500" 
                  placeholder="00"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white rounded-xl font-bold text-lg shadow-[0_4px_15px_rgba(168,85,247,0.4)] transition-all flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  A verificar...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Verificar Qualificação
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Resultados */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {resultado ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-3xl p-6 sm:p-8 shadow-2xl border relative overflow-hidden ${
                resultado.aprovado 
                  ? "bg-[rgba(15,23,42,0.8)] border-emerald-500/30" 
                  : "bg-[rgba(15,23,42,0.8)] border-red-500/30"
              }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 ${resultado.aprovado ? "bg-emerald-500" : "bg-red-500"}`} />
              
              <div className="flex flex-col items-center text-center">
                {resultado.aprovado ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <XCircle className="w-8 h-8" />
                  </div>
                )}
                
                <h3 className={`text-2xl font-bold mb-1 ${resultado.aprovado ? "text-emerald-400" : "text-red-400"}`}>
                  {resultado.aprovado ? "Qualificado!" : "Não Qualificado"}
                </h3>
                
                <div className="mt-8 w-full p-4 bg-[rgba(15,23,42,0.5)] border border-[rgba(255,255,255,0.05)] rounded-2xl">
                  <p className="text-[#94a3b8] text-sm mb-1">Tempo Exigido (TAC)</p>
                  <p className="text-white text-3xl font-bold tracking-wider">{resultado.tac}</p>
                </div>
                
                <div className="mt-4">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-sm border ${
                    resultado.aprovado 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {resultado.diff}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-[rgba(15,23,42,0.65)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.08)] rounded-3xl p-8 shadow-2xl h-full flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-20 h-20 rounded-full bg-[rgba(15,23,42,0.9)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-6">
                <Timer className="w-10 h-10 text-[#94a3b8]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Resultado da Avaliação</h3>
              <p className="text-[#94a3b8]">Insere os dados da prova e o tempo do atleta para verificar a qualificação.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
