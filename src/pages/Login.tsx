import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2, Leaf, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react'

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
        <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    if (error) {
      setError('Credenciais inválidas. Verifique os dados e tente novamente.')
      setLoading(false)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden selection:bg-primary/20">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(hsl(var(--primary)/0.1)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,white,transparent_80%)] opacity-70" />

      {/* Elegant Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 rounded-[100%] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 animate-fade-in-up">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-20 w-20 bg-card rounded-[1.5rem] shadow-elevation flex items-center justify-center mb-6 border border-border/50 relative group hover:-translate-y-1 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Leaf
              className="h-10 w-10 text-primary relative z-10 drop-shadow-sm"
              strokeWidth={1.5}
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-3 text-center">
            Bem-vindo ao Workspace
          </h1>
          <p className="text-base text-muted-foreground font-medium text-center px-4 max-w-[300px] leading-relaxed">
            Plataforma unificada para gestão inteligente em saúde
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-8 sm:p-10 shadow-elevation border-border/50 bg-card/80 backdrop-blur-2xl rounded-[2rem] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {error && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl text-center border border-destructive/20 animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2 font-medium backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  Email Institucional
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300"
                    strokeWidth={2}
                  />
                  <Input
                    type="email"
                    placeholder="nome@saude.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-12 h-14 rounded-2xl bg-muted/30 focus-visible:bg-background border-border/50 text-base shadow-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground">Senha de Acesso</label>
                  <button
                    type="button"
                    className="text-xs font-bold text-primary/80 hover:text-primary transition-colors focus:outline-none focus-visible:underline"
                  >
                    Recuperar senha
                  </button>
                </div>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300"
                    strokeWidth={2}
                  />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-12 h-14 rounded-2xl bg-muted/30 focus-visible:bg-background border-border/50 text-base font-medium tracking-widest placeholder:tracking-normal shadow-sm"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 rounded-2xl text-base shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden group mt-2"
              disabled={loading}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              <span className="flex items-center justify-center gap-2 relative z-10 w-full font-bold tracking-wide">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Acessar Plataforma
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </>
                )}
              </span>
            </Button>
          </form>
        </Card>

        <div className="mt-12 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-muted-foreground font-bold text-center uppercase tracking-[0.2em]">
            JP Sistemas &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
