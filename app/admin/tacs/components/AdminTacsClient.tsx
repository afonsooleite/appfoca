"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Timer, Search, Filter, Plus, Edit2, Trash2, 
  UploadCloud, Clock, Layers, Calendar, ChevronDown, Check, X
} from "lucide-react";

export interface Tac {
  id: number;
  epoca: string;
  escalao: string;
  genero: string;
  estilo: string;
  distancia: number;
  piscina: number;
  tempo_centesimos: number;
}

export const formatTempo = (centesimos: number) => {
  const mins = Math.floor(centesimos / 6000);
  const secs = Math.floor((centesimos % 6000) / 100);
  const cents = centesimos % 100;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cents.toString().padStart(2, '0')}`;
};

const toCentesimos = (m: string, s: string, c: string) => {
  return (parseInt(m || "0") * 6000) + (parseInt(s || "0") * 100) + parseInt(c || "0");
};

export default function AdminTacsClient({ initialTacs }: { initialTacs: Tac[] }) {
  const [tacs, setTacs] = useState<Tac[]>(initialTacs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEpoca, setFilterEpoca] = useState("all");
  const [filterEscalao, setFilterEscalao] = useState("all");
  const [filterGenero, setFilterGenero] = useState("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [epoca, setEpoca] = useState("2025/2026");
  const [escalao, setEscalao] = useState("Absoluto");
  const [genero, setGenero] = useState("Masculino");
  const [estilo, setEstilo] = useState("Livres");
  const [distancia, setDistancia] = useState("100");
  const [piscina, setPiscina] = useState("25");
  const [minutos, setMinutos] = useState("01");
  const [segundos, setSegundos] = useState("10");
  const [centesimas, setCentesimas] = useState("50");

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const epocasUnicas = useMemo(() => Array.from(new Set(tacs.map(t => t.epoca))), [tacs]);
  const escaloesUnicos = useMemo(() => Array.from(new Set(tacs.map(t => t.escalao))), [tacs]);

  const displayedTacs = tacs.filter(t => {
    const searchMatch = `${t.estilo} ${t.distancia}`.toLowerCase().includes(searchTerm.toLowerCase());
    const epocaMatch = filterEpoca === "all" || t.epoca === filterEpoca;
    const escalaoMatch = filterEscalao === "all" || t.escalao === filterEscalao;
    const generoMatch = filterGenero === "all" || t.genero === filterGenero;
    return searchMatch && epocaMatch && escalaoMatch && generoMatch;
  });

  const handleOpenModal = () => {
    setEditingId(null);
    setEpoca("2025/2026");
    setEscalao("Absoluto");
    setGenero("Masculino");
    setEstilo("Livres");
    setDistancia("100");
    setPiscina("25");
    setMinutos("01");
    setSegundos("00");
    setCentesimas("00");
    setIsModalOpen(true);
  };

  const handleEditClick = (tac: Tac) => {
    setEditingId(tac.id);
    setEpoca(tac.epoca);
    setEscalao(tac.escalao);
    setGenero(tac.genero);
    setEstilo(tac.estilo);
    setDistancia(tac.distancia.toString());
    setPiscina(tac.piscina.toString());
    
    const mins = Math.floor(tac.tempo_centesimos / 6000);
    const secs = Math.floor((tac.tempo_centesimos % 6000) / 100);
    const cents = tac.tempo_centesimos % 100;
    
    setMinutos(mins.toString().padStart(2, '0'));
    setSegundos(secs.toString().padStart(2, '0'));
    setCentesimas(cents.toString().padStart(2, '0'));
    
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem a certeza que pretende eliminar este TAC?")) return;
    
    const { error } = await supabase.from("tacs").delete().eq("id", id);
    if (error) {
      alert("Erro ao eliminar TAC: " + error.message);
    } else {
      setTacs(tacs.filter(t => t.id !== id));
      router.refresh();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const tempoFinal = toCentesimos(minutos, segundos, centesimas);

    const payload = {
      epoca,
      escalao,
      genero,
      estilo,
      distancia: parseInt(distancia),
      piscina: parseInt(piscina),
      tempo_centesimos: tempoFinal
    };

    if (editingId) {
      const { data, error } = await supabase.from("tacs").update(payload).eq("id", editingId).select();
      if (error) alert("Erro ao atualizar: " + error.message);
      else if (data) {
        setTacs(tacs.map(t => t.id === editingId ? data[0] : t));
        setIsModalOpen(false);
      }
    } else {
      const { data, error } = await supabase.from("tacs").insert([payload]).select();
      if (error) alert("Erro ao criar: " + error.message);
      else if (data) {
        setTacs([data[0], ...tacs]);
        setIsModalOpen(false);
      }
    }
    
    setIsLoading(false);
    router.refresh();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target?.result as string;
      const lines = csvData.split('\n').map(l => l.trim()).filter(l => l);
      
      // Expected CSV format: epoca,escalao,genero,estilo,distancia,piscina,tempo
      // where tempo is MM:SS.ms or similar
      const newTacs = [];
      // Skip header line if exists (assuming first element of first line isn't a year format like "2025/2026" or it has letters)
      let startIdx = lines[0].toLowerCase().includes('epoca') ? 1 : 0;
      
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(/[;,]/);
        if (parts.length >= 7) {
          const rawTempo = parts[6].trim();
          // parse tempo like "01:10.50"
          let m = "0", s = "0", c = "0";
          if (rawTempo.includes(':')) {
            const [min, rest] = rawTempo.split(':');
            m = min;
            if (rest.includes('.')) {
              const [sec, cent] = rest.split('.');
              s = sec; c = cent;
            } else {
              s = rest;
            }
          }
          const tempoCent = toCentesimos(m, s, c);
          
          newTacs.push({
            epoca: parts[0].trim(),
            escalao: parts[1].trim(),
            genero: parts[2].trim(),
            estilo: parts[3].trim(),
            distancia: parseInt(parts[4].trim()),
            piscina: parseInt(parts[5].trim()),
            tempo_centesimos: tempoCent
          });
        }
      }

      if (newTacs.length > 0 && window.confirm(`Foram encontrados ${newTacs.length} TACs. Deseja importar para a base de dados?`)) {
        const { data, error } = await supabase.from("tacs").insert(newTacs).select();
        if (error) {
          alert("Erro na importação: " + error.message);
        } else if (data) {
          setTacs([...data, ...tacs]);
          alert("Importação concluída com sucesso!");
          router.refresh();
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const stats = [
    { label: "Total TACs", value: tacs.length, icon: Timer, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Escalões", value: escaloesUnicos.length, icon: Layers, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Épocas", value: epocasUnicas.length, icon: Calendar, color: "text-pink-400", bg: "bg-pink-400/10" },
    { label: "Última Atualização", value: new Date().toLocaleDateString('pt-PT'), icon: Clock, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <div className="space-y-8 bg-[rgba(15,23,42,0.65)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 shadow-2xl">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <span className="p-2 bg-[rgba(15,23,42,0.8)] rounded-xl border border-[rgba(255,255,255,0.08)]">🏊</span>
            Gestão de TACs
          </h1>
          <p className="text-[#94a3b8] mt-2 text-sm">
            Gerir tempos de acesso às competições por época e escalão.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl font-semibold transition-all shadow-lg"
          >
            <UploadCloud className="w-5 h-5" />
            <span>Importar</span>
          </button>
          <button 
            onClick={handleOpenModal}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white rounded-xl font-bold transition-all shadow-[0_4px_15px_rgba(168,85,247,0.4)]"
          >
            <Plus className="w-5 h-5" />
            <span>Novo TAC</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-[rgba(15,23,42,0.9)] border border-[rgba(255,255,255,0.08)] shadow-[0_10px_40px_rgba(0,0,0,0.3)] rounded-2xl p-5 relative overflow-hidden group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#94a3b8] text-sm font-medium mb-1">{stat.label}</p>
                  <h3 className="text-white text-[2rem] font-bold leading-none mt-2">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-10 ${stat.bg} transition-opacity group-hover:opacity-20`} />
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[rgba(15,23,42,0.8)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-2"
      >
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
          <input 
            type="text" 
            placeholder="Procurar estilo ou distância..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none text-white pl-10 pr-4 py-2.5 focus:outline-none placeholder:text-[#94a3b8]"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto px-2 pb-2 md:px-0 md:pb-0 overflow-x-auto whitespace-nowrap">
          <div className="h-6 w-px bg-[rgba(255,255,255,0.08)] hidden md:block mx-2" />
          <Filter className="w-4 h-4 text-[#94a3b8] mr-1 flex-shrink-0" />
          
          <select 
            value={filterEpoca}
            onChange={e => setFilterEpoca(e.target.value)}
            className="bg-transparent text-[#cbd5e1] text-sm focus:outline-none cursor-pointer hover:text-white transition-colors [&>option]:bg-[#0a0a1a]"
          >
            <option value="all">Época</option>
            {epocasUnicas.map(ep => <option key={ep} value={ep}>{ep}</option>)}
          </select>

          <select 
            value={filterEscalao}
            onChange={e => setFilterEscalao(e.target.value)}
            className="bg-transparent text-[#cbd5e1] text-sm focus:outline-none cursor-pointer hover:text-white transition-colors [&>option]:bg-[#0a0a1a]"
          >
            <option value="all">Escalão</option>
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

          <select 
            value={filterGenero}
            onChange={e => setFilterGenero(e.target.value)}
            className="bg-transparent text-[#cbd5e1] text-sm focus:outline-none cursor-pointer hover:text-white transition-colors [&>option]:bg-[#0a0a1a]"
          >
            <option value="all">Género</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[rgba(15,23,42,0.8)] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#cbd5e1]">
            <thead className="bg-[rgba(15,23,42,0.9)] text-[#cbd5e1] font-semibold border-b border-[rgba(255,255,255,0.05)]">
              <tr>
                <th className="px-6 py-4 rounded-tl-2xl">Época / Escalão</th>
                <th className="px-6 py-4">Género</th>
                <th className="px-6 py-4">Prova (Estilo / Dist.)</th>
                <th className="px-6 py-4">Piscina</th>
                <th className="px-6 py-4 text-purple-400">Tempo</th>
                <th className="px-6 py-4 text-right rounded-tr-2xl">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {displayedTacs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-[rgba(15,23,42,0.9)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-2">
                        <Timer className="w-10 h-10 text-[#94a3b8]" />
                      </div>
                      <p className="text-[#94a3b8] text-lg">Ainda não existem TACs registados.</p>
                      <button 
                        onClick={handleOpenModal} 
                        className="text-purple-400 font-medium hover:text-purple-300 hover:underline flex items-center gap-2 mt-2"
                      >
                        <Plus className="w-4 h-4" /> Adicionar o primeiro TAC
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedTacs.map((tac) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={tac.id} 
                    className="hover:bg-[rgba(168,85,247,0.08)] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-white group-hover:text-purple-400 transition-colors">{tac.epoca}</span>
                        <span className="text-xs text-[#94a3b8]">{tac.escalao}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${tac.genero === "Masculino" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-pink-500/10 text-pink-400 border-pink-500/20"}`}>
                        {tac.genero}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-white">{tac.distancia}m</span>
                        <span className="text-xs text-[#94a3b8]">{tac.estilo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#cbd5e1]">{tac.piscina}m</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-purple-400 tracking-wider">
                        {formatTempo(tac.tempo_centesimos)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditClick(tac)}
                          className="p-2 text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors tooltip-trigger" 
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(tac.id)}
                          className="p-2 text-[#94a3b8] hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors tooltip-trigger" 
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal / Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050816]/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[rgba(15,23,42,0.95)] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-pink-500" />
              
              <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Timer className="w-5 h-5 text-purple-400" />
                  {editingId ? "Editar TAC" : "Novo TAC"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Época</label>
                    <select
                      value={epoca}
                      onChange={(e) => setEpoca(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[rgba(15,23,42,0.5)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [&>option]:bg-[#0a0a1a]"
                    >
                      <option value="2025/2026">2025/2026</option>
                      <option value="2026/2027">2026/2027</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Escalão</label>
                    <select
                      value={escalao}
                      onChange={(e) => setEscalao(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[rgba(15,23,42,0.5)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [&>option]:bg-[#0a0a1a]"
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
                  
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Género</label>
                    <select
                      value={genero}
                      onChange={(e) => setGenero(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[rgba(15,23,42,0.5)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [&>option]:bg-[#0a0a1a]"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Estilo</label>
                    <select
                      value={estilo}
                      onChange={(e) => setEstilo(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[rgba(15,23,42,0.5)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [&>option]:bg-[#0a0a1a]"
                    >
                      <option value="Livres">Livres</option>
                      <option value="Costas">Costas</option>
                      <option value="Bruços">Bruços</option>
                      <option value="Mariposa">Mariposa</option>
                      <option value="Estilos">Estilos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Distância (m)</label>
                    <select
                      value={distancia}
                      onChange={(e) => setDistancia(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[rgba(15,23,42,0.5)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [&>option]:bg-[#0a0a1a]"
                    >
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                      <option value="400">400</option>
                      <option value="800">800</option>
                      <option value="1500">1500</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Tamanho da Piscina</label>
                    <select
                      value={piscina}
                      onChange={(e) => setPiscina(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[rgba(15,23,42,0.5)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [&>option]:bg-[#0a0a1a]"
                    >
                      <option value="25">25 Metros</option>
                      <option value="50">50 Metros</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <label className="block text-sm font-medium text-purple-400 mb-3">Tempo Exigido</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="0" max="59" 
                        value={minutos}
                        onChange={(e) => setMinutos(e.target.value)}
                        className="w-20 px-4 py-3 bg-[rgba(15,23,42,0.9)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-lg text-center focus:outline-none focus:border-purple-500" 
                        placeholder="MM"
                      />
                      <span className="text-xl text-white font-bold">:</span>
                      <input 
                        type="number" 
                        min="0" max="59" 
                        value={segundos}
                        onChange={(e) => setSegundos(e.target.value)}
                        className="w-20 px-4 py-3 bg-[rgba(15,23,42,0.9)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-lg text-center focus:outline-none focus:border-purple-500" 
                        placeholder="SS"
                      />
                      <span className="text-xl text-white font-bold">.</span>
                      <input 
                        type="number" 
                        min="0" max="99" 
                        value={centesimas}
                        onChange={(e) => setCentesimas(e.target.value)}
                        className="w-20 px-4 py-3 bg-[rgba(15,23,42,0.9)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-lg text-center focus:outline-none focus:border-purple-500" 
                        placeholder="00"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white rounded-xl font-bold shadow-[0_4px_15px_rgba(168,85,247,0.4)] transition-all flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        A guardar...
                      </>
                    ) : (editingId ? "Guardar Alterações" : "Criar TAC")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
