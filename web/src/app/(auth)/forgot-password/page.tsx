'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: Form) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSubmitted(true);
      toast.success('Verifique seu email para redefinir a senha');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Erro ao processar solicitação'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 bg-brand-600/20 border border-brand-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-50">Email enviado</h1>
          <p className="text-sm text-gray-400">
            Verifique sua caixa de entrada para instruções de redefinição de senha
          </p>
        </div>

        <Link href="/login">
          <Button variant="outline" className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-gray-50">Redefinir senha</h1>
        <p className="text-sm text-gray-400">
          Digite seu email para receber um link de redefinição
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-50 block mb-2">
            Email
          </label>
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
            <p className="text-xs text-red-400 mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={isLoading}
        >
          {isLoading ? 'Enviando...' : 'Enviar email'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </form>

      <Link href="/login">
        <Button variant="ghost" className="w-full gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar para login
        </Button>
      </Link>
    </div>
  );
}
