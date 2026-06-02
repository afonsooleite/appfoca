'use client'

import { useState, useEffect } from 'react'
import { X, Save, Trash } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Treino } from '../types'

interface Props {
  treino?: Treino
  onClose: () => void
  onSuccess: () => void
}

export default function TreinoModal({ treino, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<Partial<Treino>>({
    dia_semana: 1,
    hora_inicio: '08:00',
    hora_fim: '10:00',
    grupo: '',
    categorias: '',
    observacoes: '',
    ativo: true,
    pistas: [],
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (treino) {
      setFormData({
        ...treino,
        hora_inicio: treino.hora_inicio?.substring(0, 5) || '08:00',
        hora_fim: treino.hora_fim?.substring(0, 5) || '10:00',
      })
    }
  }, [treino])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: name === 'dia_semana' ? parseInt(value) : value }))
    }
  }

  const handlePistaToggle = (pistaId: number) => {
    setFormData(prev => {
      const pistas = prev.pistas || []
      if (pistas.includes(pistaId)) {
        return { ...prev, pistas: pistas.filter(p => p !== pistaId) }
      } else {
        return { ...prev, pistas: [...pistas, pistaId].sort() }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const dataToSave = {
        ...formData,
        // Ensure times are properly formatted for time without timezone if needed,
        // Supabase usually accepts HH:mm or HH:mm:ss
        hora_inicio: formData.hora_inicio?.includes(':') && formData.hora_inicio.length === 5 
          ? `${formData.hora_inicio}:00` 
          : formData.hora_inicio,
        hora_fim: formData.hora_fim?.includes(':') && formData.hora_fim.length === 5 
          ? `${formData.hora_fim}:00` 
          : formData.hora_fim,
      }

      if (treino?.id) {
        const { error } = await supabase
          .from('treinos')
          .update(dataToSave)
          .eq('id', treino.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('treinos')
          .insert([dataToSave])
        if (error) throw error
      }
      onSuccess()
    } catch (err: any) {
      console.error('Error saving treino:', err)
      alert('Erro ao guardar o treino: ' + (err?.message || JSON.stringify(err)))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!treino?.id) return
    if (!window.confirm('Tem a certeza que pretende eliminar este treino?')) return
    
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('treinos')
        .delete()
        .eq('id', treino.id)
      if (error) throw error
      onSuccess()
    } catch (err) {
      console.error('Error deleting treino:', err)
      alert('Erro ao eliminar.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {treino ? 'Editar Treino' : 'Novo Treino'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Dia da Semana</label>
              <select
                name="dia_semana"
                required
                value={formData.dia_semana || 1}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value={1}>Segunda-feira</option>
                <option value={2}>Terça-feira</option>
                <option value={3}>Quarta-feira</option>
                <option value={4}>Quinta-feira</option>
                <option value={5}>Sexta-feira</option>
                <option value={6}>Sábado</option>
                <option value={7}>Domingo</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Grupo</label>
              <input
                type="text"
                name="grupo"
                value={formData.grupo || ''}
                onChange={handleChange}
                placeholder="Ex: P1, P2"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Categorias</label>
              <input
                type="text"
                name="categorias"
                value={formData.categorias || ''}
                onChange={handleChange}
                placeholder="Ex: Cadetes"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Hora Início</label>
              <input
                type="time"
                name="hora_inicio"
                required
                value={formData.hora_inicio || ''}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Hora Fim</label>
              <input
                type="time"
                name="hora_fim"
                required
                value={formData.hora_fim || ''}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Observações</label>
            <textarea
              name="observacoes"
              rows={3}
              value={formData.observacoes || ''}
              onChange={handleChange}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
            ></textarea>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Pistas da Piscina</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(pista => {
                const isSelected = formData.pistas?.includes(pista)
                return (
                  <button
                    key={pista}
                    type="button"
                    onClick={() => handlePistaToggle(pista)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors ${
                      isSelected 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50 border border-purple-500' 
                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {pista}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo ?? true}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-800"
              />
              <span className="text-sm font-medium text-gray-300">Ativo</span>
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
            {treino && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="mr-auto text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash className="w-4 h-4" />
                Eliminar treino
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
