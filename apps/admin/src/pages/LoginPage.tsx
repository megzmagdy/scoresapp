import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@dpt/db';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setError('root', { message: error.message });
    }
  }

  return (
    <div className="min-h-screen bg-dpt-bg flex flex-col">
      {/* Branded header — same visual language as web navbar */}
      <header className="w-full border-b border-white/8 bg-dpt-bg/90 backdrop-blur-[14px]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(232,181,58,0.15) 0%, rgba(232,181,58,0.05) 100%)',
                border: '1.5px solid rgba(232,181,58,0.35)',
                boxShadow: '0 0 16px rgba(232,181,58,0.15)',
              }}
            >
              <span
                className="text-[12px] font-black italic text-dpt-gold"
                style={{ fontFamily: ARCHIVO }}
              >
                DPT
              </span>
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="text-base font-black italic uppercase tracking-[0.04em] text-white"
                style={{ fontFamily: ARCHIVO }}
              >
                Delta Padel Tour
              </span>
              <span
                className="mt-1 text-[10px] uppercase tracking-[0.2em] text-dpt-gold"
                style={{ fontFamily: MONO }}
              >
                Admin Panel
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8 text-center">
            <p
              className="text-[10px] uppercase tracking-[0.25em] text-dpt-gold mb-2"
              style={{ fontFamily: MONO }}
            >
              // Secure Access
            </p>
            <h1
              className="text-3xl font-black italic uppercase text-white leading-none"
              style={{ fontFamily: ARCHIVO }}
            >
              Sign In
            </h1>
          </div>

          {/* Form card */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5 bg-[#141414] border border-white/8 rounded-xl p-6"
          >
            <div className="flex flex-col gap-1.5">
              <Label
                className="text-[#a0a0a8] text-xs uppercase tracking-widest"
                style={{ fontFamily: MONO }}
              >
                Email
              </Label>
              <Input
                type="email"
                autoComplete="email"
                {...register('email')}
                className="bg-[#1a1a1a] border-white/10 text-white"
              />
              {errors.email && (
                <p className="text-red-400 text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                className="text-[#a0a0a8] text-xs uppercase tracking-widest"
                style={{ fontFamily: MONO }}
              >
                Password
              </Label>
              <Input
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="bg-[#1a1a1a] border-white/10 text-white"
              />
              {errors.password && (
                <p className="text-red-400 text-xs">{errors.password.message}</p>
              )}
            </div>

            {errors.root && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                {errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold mt-1"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
