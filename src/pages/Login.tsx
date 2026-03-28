import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck, Activity, Hexagon } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950 font-sans selection:bg-primary/30 selection:text-white">
      {/* Premium Photographic Background */}
      <div
        className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity"
        style={{
          backgroundImage:
            'url("https://img.usecurling.com/p/1920/1080?q=modern%20corporate%20architecture%20glass&color=blue&dpr=2")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Elegant Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/80 to-slate-900/90 z-0" />
      <div className="absolute inset-0 bg-primary/5 z-0 backdrop-blur-[1px]" />

      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* JP Sistemas Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden opacity-[0.02] select-none">
        <h1 className="text-[18vw] font-black text-white whitespace-nowrap tracking-tighter">
          JP SISTEMAS
        </h1>
      </div>

      <div className="w-full max-w-[440px] relative z-10 animate-fade-in-up">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/40 transition-colors duration-500" />
            <div className="h-20 w-20 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex items-center justify-center relative transform group-hover:-translate-y-1 transition-all duration-500">
              <Hexagon className="absolute inset-0 w-full h-full text-primary/20 stroke-[1] scale-150 rotate-90 animate-pulse" />
              <Activity
                className="h-10 w-10 text-primary relative z-10 drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                strokeWidth={1.5}
              />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              JP Sistemas
            </h1>
            <p className="text-sm text-slate-400 font-medium tracking-widest uppercase">
              Gestão Inteligente em Saúde
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="p-8 sm:p-10 shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-2xl rounded-[2rem] relative overflow-hidden group/card">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000 pointer-events-none" />

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {error && (
              <div className="p-4 text-sm text-red-200 bg-red-950/50 rounded-xl text-center border border-red-900/50 animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2 font-medium backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 shrink-0 text-red-400" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  Email Institucional
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors duration-300 z-10"
                    strokeWidth={1.5}
                  />
                  <Input
                    type="email"
                    placeholder="nome@saude.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-12 h-14 rounded-2xl bg-slate-950/50 focus-visible:bg-slate-900 border-white/10 focus-visible:border-primary/50 text-slate-100 placeholder:text-slate-600 shadow-inner font-medium transition-all duration-300 ring-offset-slate-950"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-200">Senha de Acesso</label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors focus:outline-none focus-visible:underline"
                  >
                    Recuperar senha
                  </button>
                </div>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors duration-300 z-10"
                    strokeWidth={1.5}
                  />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-12 h-14 rounded-2xl bg-slate-950/50 focus-visible:bg-slate-900 border-white/10 focus-visible:border-primary/50 text-slate-100 placeholder:text-slate-600 shadow-inner font-medium tracking-widest placeholder:tracking-normal transition-all duration-300 ring-offset-slate-950"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 rounded-2xl text-base shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-all duration-300 relative overflow-hidden group mt-4 bg-primary text-primary-foreground border border-primary/50 hover:bg-primary/90"
              disabled={loading}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              <span className="flex items-center justify-center gap-2 relative z-10 w-full font-bold tracking-wide">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Acessar Workspace
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </>
                )}
              </span>
            </Button>
          </form>
        </Card>

        <div className="mt-10 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity duration-300">
          <p className="text-xs text-slate-400 font-semibold text-center tracking-widest flex items-center gap-2 uppercase">
            <ShieldCheck className="h-4 w-4" />
            JP Sistemas • Ambiente Seguro
          </p>
        </div>
      </div>
    </div>
  )
}
