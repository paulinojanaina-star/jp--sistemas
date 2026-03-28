import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2, Leaf, Mail, Lock, ArrowRight } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden font-sans selection:bg-primary/20">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,white,transparent_80%)] opacity-70" />

      {/* Abstract Glowing Blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in-up">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center justify-center mb-6 border border-zinc-200/80 dark:border-zinc-800/80 relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
            <Leaf className="h-8 w-8 text-primary relative z-10 drop-shadow-sm" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2 text-center">
            Bem-vindo de volta
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium text-center px-4">
            Acesse o painel administrativo de gestão em saúde
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border-zinc-200/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-[28px] relative overflow-hidden">
          {/* Subtle inner reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent dark:from-white/5 pointer-events-none" />

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {error && (
              <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/30 rounded-2xl text-center border border-red-100 dark:border-red-900/30 animate-fade-in flex items-center justify-center gap-2 font-medium backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400 shrink-0 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1 flex items-center gap-2">
                  Email Institucional
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-primary transition-colors duration-300"
                    strokeWidth={1.5}
                  />
                  <Input
                    type="email"
                    placeholder="admin@saude.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-12 h-14 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all duration-300 text-base shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Senha
                  </label>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md px-1"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-primary transition-colors duration-300"
                    strokeWidth={1.5}
                  />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-12 h-14 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all duration-300 text-base font-medium tracking-wider placeholder:tracking-normal shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl text-[15px] font-semibold shadow-[0_8px_20px_-4px_rgba(var(--primary),0.3)] hover:shadow-[0_12px_25px_-4px_rgba(var(--primary),0.4)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              <span className="flex items-center justify-center gap-2 relative z-10 w-full">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Entrar no Sistema
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </>
                )}
              </span>
            </Button>
          </form>
        </Card>

        {/* Footer Section */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold text-center uppercase tracking-[0.2em] opacity-80">
            JP Sistemas &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
