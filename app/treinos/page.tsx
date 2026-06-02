import { Metadata } from 'next'
import TreinosClient from './components/TreinosClient'

export const metadata: Metadata = {
  title: 'Treinos - Foca',
  description: 'Gestão de Treinos',
}

export default function TreinosPage() {
  return <TreinosClient />
}