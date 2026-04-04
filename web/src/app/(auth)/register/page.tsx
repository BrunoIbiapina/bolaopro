'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { PageLoader } from '@/components/shared/page-loader';

const registerSchema = z
  .object({
    fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar os termos e condições',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não correspondem',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await register(data.fullName, data.email, data.password);
      toast.success('Conta criada com sucesso!');
      router.push(redirect ?? '/');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Erro ao criar conta'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-gray-50">Criar conta</h1>
        <p className="text-sm text-gray-400">
          Comece a organizar seus bolões agora
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-50 block mb-2">Nome Completo</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Seu nome"
              {...form.register('fullName')}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          {form.formState.errors.fullName && (
            <p className="text-xs text-red-400 mt-1">{form.formState.errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-50 block mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <Input
              type="email"
              placeholder="seu@email.com"
              {...form.register('email')}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-400 mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-50 block mb-2">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <Input
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-red-400 mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-50 block mb-2">Confirme a Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <Input
              type="password"
              placeholder="••••••••"
              {...form.register('confirmPassword')}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-red-400 mt-1">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...form.register('acceptTerms')}
            className="mt-1 w-4 h-4 rounded border-surface-lighter bg-surface checked:bg-brand-600"
            disabled={isLoading}
          />
          <span className="text-xs text-gray-400">
            Eu concordo com os{' '}
            <span className="text-brand-400 hover:text-brand-300">termos e condições</span>
            {' '}e{' '}
            <span className="text-brand-400 hover:text-brand-300">política de privacidade</span>
          </span>
        </label>
        {form.formState.errors.acceptTerms && (
          <p className="text-xs text-red-400 -mt-2">{form.formState.errors.acceptTerms.message}</p>
        )}

        <Button type="submit" className="w-full gap-2" disabled={isLoading}>
          {isLoading ? 'Criando conta...' : 'Criar conta'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-lighter" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface text-gray-400">Já tem conta?</span>
        </div>
      </div>

      <Link href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}>
        <Button variant="outline" className="w-full">Fazer login</Button>
      </Link>

      {/* Divisor */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-lighter" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface text-gray-400">ou entre rapidamente com</span>
        </div>
      </div>

      {/* Botão Google */}
      <button
        type="button"
        disabled={isGoogleLoading || isLoading}
        onClick={() => {
          setIsGoogleLoading(true);
          const url = `${API_URL}/auth/google${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;
          window.location.href = url;
        }}
        className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-gray-700 bg-white/5 hover:bg-white/10 text-gray-200 font-medium text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" className="size-5" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuar com Google
      </button>
    </div>

    {isGoogleLoading && (
      <PageLoader
        message="Redirecionando para o Google..."
        submessage="Aguarde um momento"
      />
    )}
  </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
