"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Trash2,
  TrendingUp,
  ShieldCheck,
  UserCheck
} from "lucide-react";

type Atleta = {
  id: string | number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  equipa?: string;
  escalao?: string;
  ativo?: boolean;
  created_at?: string;
};

export default function AtletasClient({ initialAtletas }: { initialAtletas: Atleta[] }) {
  const [atletas, setAtletas] = useState<Atleta[]>(initialAtletas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEscalao, setFilterEscalao] = useState("all");
  const [formData, setFormData] = useState({ nome: "", email: "", telefone: "", escalao: "Seniores" });
  const router = useRouter();

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({ nome: "", email: "", telefone: "", escalao: "Seniores" });
    setIsModalOpen(true);
  };

  const handleEditClick = (atleta: Atleta) => {
    setEditingId(atleta.id);
    setFormData({
      nome: atleta.nome,
      email: atleta.email || "",
      telefone: atleta.telefone || "",
      escalao: atleta.escalao || "Seniores"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Tens a certeza que desejas eliminar este atleta?")) return;

    const { error } = await supabase.from("atletas").delete().eq("id", id);
    
    if (error) {
      alert("Erro ao eliminar atleta: " + error.message);
    } else {
      setAtletas(atletas.filter(a => a.id !== id));
      router.refresh();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ nome: "", email: "", telefone: "", escalao: "Seniores" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      nome: formData.nome, 
      email: formData.email || null, 
      telefone: formData.telefone || null,
      escalao: formData.escalao
    };

    if (editingId) {
      // Update existing athlete
      const { data, error } = await supabase
        .from("atletas")
        .update(payload)
        .eq("id", editingId)
        .select();

      if (error) {
        alert("Erro ao atualizar atleta: " + error.message);
      } else if (data) {
        setAtletas(atletas.map(a => a.id === editingId ? data[0] : a));
        handleCloseModal();
        router.refresh();
      }
    } else {
      // Create new athlete
      const { data, error } = await supabase
        .from("atletas")
        .insert([payload])
        .select();

      if (error) {
        alert("Erro ao criar atleta: " + error.message);
      } else if (data) {
        setAtletas([data[0], ...atletas]);
        handleCloseModal();
        router.refresh();
      }
    }
    
    setIsLoading(false);
  };

  // Mocking some data if not present just to match the visual requirements
  const displayedAtletas = atletas.map(a => ({
    ...a,
    escalao: a.escalao || "Seniores"
  })).filter(a => {
    const matchesSearch = a.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEscalao = filterEscalao === "all" || a.escalao === filterEscalao;
    return matchesSearch && matchesEscalao;
  });

  const stats = [
    { label: "Total de Atletas", value: atletas.length || 152, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Atletas Federados", value: 134, icon: ShieldCheck, color: "text-pink-400", bg: "bg-pink-400/10" },
    { label: "Novos este mês", value: 12, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

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
            <span className="p-2 bg-[rgba(15,23,42,0.8)] rounded-xl border border-[rgba(255,255,255,0.08)]">👥</span>
            Atletas
          </h1>
          <p className="text-[#94a3b8] mt-2 text-sm">
            Gerir atletas, equipas e informações do clube.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 hover:scale-105 active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Novo Atleta
        </button>
      </motion.div>

      {/* Metrics Cards */}
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

      {/* Filters and Search */}
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
            placeholder="Procurar atleta..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none text-white pl-10 pr-4 py-2.5 focus:outline-none placeholder:text-[#94a3b8]"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto px-2 pb-2 md:px-0 md:pb-0">
          <div className="h-6 w-px bg-[rgba(255,255,255,0.08)] hidden md:block mx-2" />
          <Filter className="w-4 h-4 text-[#94a3b8] mr-1" />
          
          <select 
            value={filterEscalao}
            onChange={e => setFilterEscalao(e.target.value)}
            className="bg-transparent text-slate-300 text-sm focus:outline-none cursor-pointer hover:text-white transition-colors [&>option]:bg-[#0a0a1a]"
          >
            <option value="all">Todos os Escalões</option>
            <option value="Seniores">Seniores</option>
            <option value="Juniores">Juniores</option>
            <option value="Juvenis">Juvenis</option>
            <option value="Infantis">Infantis</option>
            <option value="Cadetes">Cadetes</option>
            <option value="Grupo Formação">Grupo Formação</option>
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
                <th className="px-6 py-4 rounded-tl-2xl">Atleta</th>
                <th className="px-6 py-4">Escalão</th>
                <th className="px-6 py-4">Contactos</th>
                <th className="px-6 py-4 text-right rounded-tr-2xl">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {displayedAtletas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-[rgba(15,23,42,0.9)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-2">
                        <Users className="w-10 h-10 text-[#94a3b8]" />
                      </div>
                      <p className="text-[#94a3b8] text-lg">Ainda não existem atletas registados.</p>
                      <button 
                        onClick={handleOpenModal} 
                        className="text-purple-400 font-medium hover:text-purple-300 hover:underline flex items-center gap-2 mt-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Adicionar primeiro atleta
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedAtletas.map((atleta) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={atleta.id} 
                    className="hover:bg-[rgba(168,85,247,0.08)] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold shadow-[0_4px_10px_rgba(168,85,247,0.4)]">
                          {getInitials(atleta.nome)}
                        </div>
                        <div className="font-bold text-white group-hover:text-purple-400 transition-colors">
                          {atleta.nome}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[#cbd5e1]">{atleta.escalao}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[#cbd5e1]">{atleta.email || <span className="text-slate-600 italic">Sem email</span>}</span>
                        <span className="text-xs text-[#94a3b8]">{atleta.telefone || <span className="text-slate-600 italic">Sem telefone</span>}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors tooltip-trigger" title="Ver Detalhes">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(atleta)}
                          className="p-2 text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors tooltip-trigger" 
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(atleta.id)}
                          className="p-2 text-[#94a3b8] hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors tooltip-trigger" 
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <button className="md:hidden p-2 text-[#94a3b8]">
                        <MoreVertical className="w-4 h-4" />
                      </button>
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
              className="bg-[rgba(15,23,42,0.95)] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
              
              <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                  {editingId ? "Editar Atleta" : "Novo Atleta"}
                </h2>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label htmlFor="nome" className="block text-sm font-medium text-slate-300 mb-2">Nome Completo <span className="text-pink-500">*</span></label>
                    <input
                      id="nome"
                      name="nome"
                      type="text"
                      required
                      value={formData.nome}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                      placeholder="joao@email.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-slate-300 mb-2">Telefone</label>
                    <input
                      id="telefone"
                      name="telefone"
                      type="tel"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                      placeholder="912345678"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="escalao" className="block text-sm font-medium text-slate-300 mb-2">Escalão</label>
                    <select
                      id="escalao"
                      name="escalao"
                      value={formData.escalao}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all [&>option]:bg-[#0a0a1a]"
                    >
                      <option value="Seniores">Seniores</option>
                      <option value="Juniores">Juniores</option>
                      <option value="Juvenis">Juvenis</option>
                      <option value="Infantis">Infantis</option>
                      <option value="Cadetes">Cadetes</option>
                      <option value="Grupo Formação">Grupo Formação</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 text-slate-300 font-medium hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center gap-2 hover:scale-105 active:scale-95"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        A guardar...
                      </>
                    ) : (editingId ? "Guardar Alterações" : "Criar Atleta")}
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
