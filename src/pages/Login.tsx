import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HeartPulse, Loader2 } from 'lucide-react'

export default function Login() {
  const { signIn, session, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    if (error) {
      setError('Credenciais inválidas. Tente novamente.')
      setLoading(false)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <HeartPulse className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">JP Sistemas</CardTitle>
          <CardDescription>Controle de Estoque de Unidades de Saúde</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Institucional</label>
              <Input
                type="email"
                placeholder="admin@saude.gov.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
