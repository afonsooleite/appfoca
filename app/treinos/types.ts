export interface Treino {
  id: number
  microciclo_id?: number
  data?: string
  hora_inicio: string
  hora_fim: string
  observacoes?: string
  dia_semana: number
  grupo?: string
  categorias?: string
  ativo?: boolean
  pistas?: number[]
}
