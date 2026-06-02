'use client'

import { useState, useEffect } from 'react'
import { Plus, Sun, Moon, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Treino } from '../types'
import TreinoModal from './TreinoModal'

const DIAS_SEMANA = [
  { id: 1, nome: 'SEG' },
  { id: 2, nome: 'TER' },
  { id: 3, nome: 'QUA' },
  { id: 4, nome: 'QUI' },
  { id: 5, nome: 'SEX' },
  { id: 6, nome: 'SÁB' },
  { id: 7, nome: 'DOM' },
]

export default function TreinosClient() {
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTreino, setEditingTreino] = useState<Treino | undefined>()
  
  // Filters
  const [filterAtivos, setFilterAtivos] = useState(true)
  const [filterCategorias, setFilterCategorias] = useState('')
  const [filterMicrociclo, setFilterMicrociclo] = useState('')

  const fetchTreinos = async () => {
    setLoading(true)
    let query = supabase.from('treinos').select('*')
    
    if (filterAtivos) {
      query = query.eq('ativo', true)
    }
    if (filterCategorias) {
      query = query.eq('categorias', filterCategorias)
    }
    if (filterMicrociclo) {
      query = query.eq('microciclo_id', filterMicrociclo)
    }

    const { data, error } = await query.order('hora_inicio', { ascending: true })
    
    if (error) {
      console.error('Error fetching treinos:', error)
    } else {
      console.log('Treinos recebidos do Supabase:', data)
      const formattedData = data?.map(t => {
        let parsedPistas: number[] = []
        if (Array.isArray(t.pistas)) {
          parsedPistas = t.pistas
        } else if (typeof t.pistas === 'string') {
          parsedPistas = t.pistas.replace(/[{}[\]]/g, '').split(',').map((s: string) => Number(s.trim())).filter((n: number) => !isNaN(n))
        } else if (typeof t.pistas === 'number') {
          parsedPistas = [t.pistas]
        }
        return { ...t, pistas: parsedPistas }
      })
      setTreinos(formattedData || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTreinos()
  }, [filterAtivos, filterCategorias, filterMicrociclo])

  useEffect(() => {
    const channel = supabase
      .channel('treinos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'treinos' },
        () => {
          fetchTreinos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filterAtivos, filterCategorias, filterMicrociclo])

  const openNewModal = () => {
    setEditingTreino(undefined)
    setIsModalOpen(true)
  }

  const openEditModal = (treino: Treino) => {
    setEditingTreino(treino)
    setIsModalOpen(true)
  }

  const parseHour = (timeStr: string) => parseInt(timeStr.split(':')[0], 10)
  
  const getSection = (treino: Treino) => {
    if (!treino.hora_inicio) return 'manha'
    const hour = parseHour(treino.hora_inicio)
    return hour < 12 ? 'manha' : 'tarde'
  }

  const treinosManha = treinos.filter(t => getSection(t) === 'manha')
  const treinosTarde = treinos.filter(t => getSection(t) === 'tarde')

  const getUniqueHours = (list: Treino[]) => {
    const hours = list.map(t => t.hora_inicio?.substring(0, 5) || '00:00')
    return Array.from(new Set(hours)).sort()
  }

  const hoursManha = getUniqueHours(treinosManha)
  const hoursTarde = getUniqueHours(treinosTarde)

  const renderGrid = (hours: string[], list: Treino[]) => {
    if (hours.length === 0) return <div className="text-gray-400 py-4">Sem treinos agendados.</div>

    return (
      <div className="overflow-x-auto w-full">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="col-span-1 text-center font-semibold text-gray-400 text-sm">HORA</div>
            {DIAS_SEMANA.map(dia => (
              <div key={dia.id} className="col-span-1 text-center font-semibold text-gray-300 border-b border-gray-700 pb-2">
                {dia.nome}
              </div>
            ))}
          </div>

          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-2 mb-4 min-h-[100px] border-t border-gray-800 pt-4">
              <div className="col-span-1 flex items-start justify-center pt-2 text-gray-400 font-medium">
                {hour}
              </div>

              {DIAS_SEMANA.map(dia => {
                const dayTreinos = list.filter(t => Number(t.dia_semana) === dia.id && t.hora_inicio?.substring(0, 5) === hour)
                return (
                  <div key={dia.id} className="col-span-1 flex flex-col gap-2 relative">
                    {dayTreinos.map(treino => (
                      <div
                        key={treino.id}
                        onClick={() => openEditModal(treino)}
                        className="bg-purple-900/40 border border-red-500/30 rounded-xl p-3 cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 group flex flex-col gap-1"
                      >
                        <div className="flex items-center text-sm font-bold text-white mb-1">
                          <Clock className="w-3 h-3 mr-1 text-purple-400" />
                          {treino.hora_inicio.substring(0, 5)} - {treino.hora_fim.substring(0, 5)}
                        </div>
                        {treino.grupo && (
                          <div className="text-xs text-purple-300 font-medium mt-1">
                            Grupo: {treino.grupo}
                          </div>
                        )}
                        {treino.categorias && (
                          <div className="text-xs text-purple-300 font-medium mt-1">
                            Categorias: {treino.categorias}
                          </div>
                        )}
                        {treino.observacoes && (
                          <div className="text-xs text-gray-400 italic mt-1 line-clamp-2">
                            {treino.observacoes}
                          </div>
                        )}
                        {treino.pistas && treino.pistas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {treino.pistas.map(p => (
                              <span key={p} className="bg-purple-600/80 border border-purple-500/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                P{p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const allCategorias = Array.from(new Set(treinos.map(t => t.categorias).filter(Boolean))) as string[]

  return (
    <div className="p-6 max-w-7xl mx-auto text-white min-h-screen bg-slate-950 rounded-3xl shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-red-400">Calendário de Treinos</h1>
          <p className="text-gray-400 mt-1">Vista semanal de treinos</p>
        </div>
        
        <button
          onClick={openNewModal}
          className="bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white px-6 py-2 rounded-xl font-medium shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Treino
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-4 rounded-2xl mb-8 flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input 
            type="checkbox" 
            checked={filterAtivos} 
            onChange={(e) => setFilterAtivos(e.target.checked)}
            className="rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700"
          />
          Apenas Ativos
        </label>

        <select
          value={filterCategorias}
          onChange={(e) => setFilterCategorias(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">Todas as Categorias</option>
          {allCategorias.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Microciclo ID:</span>
          <input 
            type="text" 
            placeholder="Opcional..." 
            value={filterMicrociclo}
            onChange={(e) => setFilterMicrociclo(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg w-24 px-2 py-1 text-white focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          <section className="bg-gray-900/60 rounded-3xl p-6 border border-gray-800 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
              <div className="bg-yellow-500/20 p-2 rounded-lg">
                <Sun className="w-6 h-6 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-100">MANHÃ</h2>
            </div>
            {renderGrid(hoursManha, treinosManha)}
          </section>

          <section className="bg-gray-900/60 rounded-3xl p-6 border border-gray-800 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Moon className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-100">TARDE / NOITE</h2>
            </div>
            {renderGrid(hoursTarde, treinosTarde)}
          </section>
        </div>
      )}

      {isModalOpen && (
        <TreinoModal 
          treino={editingTreino} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false)
            fetchTreinos()
          }} 
        />
      )}
    </div>
  )
}
