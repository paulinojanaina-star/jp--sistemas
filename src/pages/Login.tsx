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
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Subtle decorative elements for elegant feel */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-background to-background pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-elevation border-border/40 relative z-10 bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-5 text-center pb-8 pt-10">
          <div className="mx-auto bg-primary/5 p-4 rounded-2xl w-fit mb-2 text-primary border border-primary/10">
            <Leaf className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-3xl font-light tracking-tight text-foreground">
              JP Sistemas
            </CardTitle>
            <CardDescription className="text-xs font-medium tracking-[0.2em] uppercase text-primary/70">
              Gestão em Saúde
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-10">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md text-center border border-destructive/20 animate-fade-in-up">
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
                className="bg-background/50 focus-visible:ring-1 border-border/60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 focus-visible:ring-1 border-border/60"
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
