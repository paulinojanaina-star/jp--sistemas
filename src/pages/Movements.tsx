import { MovementForm } from '@/components/MovementForm'

export default function Movements() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Registro de Movimentações</h2>
        <p className="text-muted-foreground">Registre entradas e saídas de materiais no estoque.</p>
      </div>

      <div className="max-w-3xl">
        <MovementForm />
      </div>
    </div>
  )
}
