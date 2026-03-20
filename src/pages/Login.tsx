import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Leaf } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-2xl shadow-primary/5 border-border/60">
        <CardHeader className="space-y-4 text-center pb-8 pt-8">
          <div className="mx-auto bg-accent p-4 rounded-full w-fit mb-2 shadow-sm text-accent-foreground">
            <Leaf className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-light tracking-tight text-primary">
              JP Sistemas
            </CardTitle>
            <CardDescription className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
              Gestão em Saúde
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md text-center border border-destructive/20">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Email Institucional</label>
              <Input
                type="email"
                placeholder="admin@saude.gov.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background focus-visible:ring-1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background focus-visible:ring-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full font-medium tracking-wide h-11"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
