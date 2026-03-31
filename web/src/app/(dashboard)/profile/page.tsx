'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarWithInitials } from '@/components/ui/avatar';
import api from '@/lib/api';
import { toast } from 'sonner';
import { User, Lock, LogOut } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  pixKey: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Senha atual inválida'),
    newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não correspondem',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      pixKey: user?.pixKey || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      const response = await api.patch('/auth/profile', data);
      updateUser(response.data);
      toast.success('Perfil atualizado com sucesso!');
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Erro ao atualizar perfil'
      );
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Senha alterada com sucesso!');
      passwordForm.reset();
      setIsEditingPassword(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Erro ao alterar senha'
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-50">Perfil</h1>
        <p className="text-gray-400 mt-1">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {/* Avatar */}
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <AvatarWithInitials
            name={user?.fullName || 'User'}
            src={user?.avatarUrl}
          />
          <div>
            <h3 className="font-semibold text-gray-50">{user?.fullName}</h3>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
          {!isEditingProfile && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditingProfile(true)}
            >
              Editar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">
                  Nome Completo
                </label>
                <Input
                  {...profileForm.register('fullName')}
                  disabled={profileForm.formState.isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  {...profileForm.register('email')}
                  disabled
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">
                  Telefone
                </label>
                <Input
                  {...profileForm.register('phone')}
                  placeholder="(11) 9999-9999"
                  disabled={profileForm.formState.isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">
                  Chave PIX
                </label>
                <Input
                  {...profileForm.register('pixKey')}
                  placeholder="seu@email.com"
                  disabled={profileForm.formState.isSubmitting}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditingProfile(false)}
                  disabled={profileForm.formState.isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={profileForm.formState.isSubmitting}
                >
                  Salvar
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">Nome</p>
                <p className="text-gray-50">{user?.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-gray-50">{user?.email}</p>
              </div>
              {user?.phone && (
                <div>
                  <p className="text-xs text-gray-400">Telefone</p>
                  <p className="text-gray-50">{user.phone}</p>
                </div>
              )}
              {user?.pixKey && (
                <div>
                  <p className="text-xs text-gray-400">Chave PIX</p>
                  <p className="text-gray-50">{user.pixKey}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Segurança
          </CardTitle>
          {!isEditingPassword && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditingPassword(true)}
            >
              Alterar Senha
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingPassword ? (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">
                  Senha Atual
                </label>
                <Input
                  type="password"
                  {...passwordForm.register('currentPassword')}
                  disabled={passwordForm.formState.isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">
                  Nova Senha
                </label>
                <Input
                  type="password"
                  {...passwordForm.register('newPassword')}
                  disabled={passwordForm.formState.isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">
                  Confirme a Senha
                </label>
                <Input
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                  disabled={passwordForm.formState.isSubmitting}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditingPassword(false)}
                  disabled={passwordForm.formState.isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={passwordForm.formState.isSubmitting}
                >
                  Alterar
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-400">
              Última alteração: nunca
            </p>
          )}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full gap-2"
        onClick={logout}
      >
        <LogOut className="w-4 h-4" />
        Sair
      </Button>
    </div>
  );
}
