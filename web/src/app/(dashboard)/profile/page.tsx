'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarWithInitials } from '@/components/ui/avatar';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  User,
  Lock,
  LogOut,
  Sun,
  Moon,
  Pencil,
  Shield,
  Phone,
  Mail,
  Check,
  X,
  Banknote,
  MessageCircle,
} from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
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

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-700 dark:border-gray-700 light:border-gray-200 bg-surface-light hover:bg-surface-lighter transition-all duration-200 text-sm font-medium text-gray-300 dark:text-gray-300"
      title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-yellow-400" />
          <span className="text-gray-300">Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-brand-400" />
          <span className="text-gray-600">Escuro</span>
        </>
      )}
    </button>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string; icon?: React.ElementType }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-surface-light last:border-0">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-brand-600/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-brand-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm text-gray-100 dark:text-gray-100 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phone: (user as any)?.phone || '',
      pixKey: (user as any)?.pixKey || '',
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
      const response = await api.patch('/users/me', data);
      updateUser(response.data);
      toast.success('Perfil atualizado com sucesso!');
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar perfil');
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await api.post('/users/me/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Senha alterada com sucesso!');
      passwordForm.reset();
      setIsEditingPassword(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao alterar senha');
    }
  };

  const roleLabel = user?.role === 'ADMIN' ? 'Administrador' : 'Participante';
  const roleBg = user?.role === 'ADMIN'
    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
    : 'bg-brand-600/15 text-brand-300 border border-brand-500/20';

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-8">

      {/* Top bar: title + theme toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">Meu Perfil</h1>
          <p className="text-sm text-gray-400 mt-0.5">Informações e preferências da conta</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-700/30 via-surface to-surface border border-surface-light overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-brand-800/40 to-brand-600/20" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end gap-4">
            <div className="ring-4 ring-surface rounded-2xl">
              <AvatarWithInitials
                name={user?.fullName || 'User'}
                src={user?.avatarUrl}
                className="w-16 h-16 text-xl rounded-2xl"
              />
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-50 truncate">{user?.fullName}</h2>
              <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            </div>
            <span className={`mb-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${roleBg}`}>
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Info Section */}
      <div className="rounded-2xl bg-surface border border-surface-light overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-light">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-400" />
            </div>
            <span className="font-semibold text-gray-100">Informações Pessoais</span>
          </div>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors font-medium"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
          )}
        </div>

        <div className="px-5 py-2">
          {isEditingProfile ? (
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 py-3">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Nome Completo</label>
                <Input
                  {...profileForm.register('fullName')}
                  disabled={profileForm.formState.isSubmitting}
                />
                {profileForm.formState.errors.fullName && (
                  <p className="text-xs text-red-400 mt-1">{profileForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Email</label>
                <Input type="email" value={user?.email || ''} readOnly disabled className="opacity-60 cursor-not-allowed" />
                <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Telefone</label>
                <Input
                  {...profileForm.register('phone')}
                  placeholder="(11) 9 9999-9999"
                  disabled={profileForm.formState.isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Chave PIX para receber prêmios</label>
                <Input
                  {...profileForm.register('pixKey')}
                  placeholder="CPF, email, telefone ou chave aleatória"
                  disabled={profileForm.formState.isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">Usada para receber o prêmio caso vença um bolão</p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setIsEditingProfile(false);
                    profileForm.reset();
                  }}
                  disabled={profileForm.formState.isSubmitting}
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5"
                  disabled={profileForm.formState.isSubmitting}
                >
                  <Check className="w-3.5 h-3.5" />
                  {profileForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          ) : (
            <div>
              <InfoRow label="Nome Completo" value={user?.fullName} icon={User} />
              <InfoRow label="Email" value={user?.email} icon={Mail} />
              {user?.phone ? (
                <InfoRow label="Telefone" value={user.phone} icon={Phone} />
              ) : (
                <div className="py-3 border-b border-surface-light last:border-0">
                  <p className="text-xs text-gray-400 mb-0.5">Telefone</p>
                  <p className="text-sm text-gray-500 italic">Não informado</p>
                </div>
              )}
              {user?.pixKey ? (
                <InfoRow label="Chave PIX" value={user.pixKey} icon={Banknote} />
              ) : (
                <div className="py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Chave PIX</p>
                  <p className="text-sm text-gray-500 italic">Não cadastrada — necessária para receber prêmios</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Notifications Section */}
      <div className="rounded-2xl bg-surface border border-surface-light overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-light">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-600/15 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-green-400" />
            </div>
            <span className="font-semibold text-gray-100">Notificações WhatsApp</span>
          </div>
        </div>
        <div className="px-5 py-4">
          {!(user as any)?.phone ? (
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-300 font-medium">Cadastre seu telefone primeiro</p>
                <p className="text-xs text-gray-500 mt-0.5">Edite seu perfil acima e adicione um número de telefone para ativar as notificações.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                {(user as any)?.whatsappOptIn ? (
                  <>
                    <p className="text-sm text-green-400 font-medium">Notificações ativas</p>
                    <p className="text-xs text-gray-500 mt-0.5">Voce recebe alertas de resultados, pagamentos e mais via WhatsApp.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-300 font-medium">Notificações desativadas</p>
                    <p className="text-xs text-gray-500 mt-0.5">Ative para receber resultados de partidas, confirmacoes de pagamento e mais.</p>
                  </>
                )}
              </div>
              <Button
                size="sm"
                variant={(user as any)?.whatsappOptIn ? 'secondary' : 'default'}
                className={`shrink-0 gap-1.5 ${(user as any)?.whatsappOptIn ? '' : 'bg-green-600 hover:bg-green-700 text-white border-green-600'}`}
                onClick={async () => {
                  try {
                    const newValue = !(user as any)?.whatsappOptIn;
                    const response = await api.patch('/users/me', { whatsappOptIn: newValue });
                    updateUser(response.data);
                    toast.success(newValue ? 'Notificacoes WhatsApp ativadas!' : 'Notificacoes WhatsApp desativadas.');
                  } catch {
                    toast.error('Erro ao atualizar preferencia');
                  }
                }}
              >
                {(user as any)?.whatsappOptIn ? (
                  <><X className="w-3.5 h-3.5" /> Desativar</>
                ) : (
                  <><Check className="w-3.5 h-3.5" /> Ativar</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-2xl bg-surface border border-surface-light overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-light">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-brand-400" />
            </div>
            <span className="font-semibold text-gray-100">Segurança</span>
          </div>
          {!isEditingPassword && (
            <button
              onClick={() => setIsEditingPassword(true)}
              className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors font-medium"
            >
              <Lock className="w-3.5 h-3.5" />
              Alterar senha
            </button>
          )}
        </div>

        <div className="px-5 py-2">
          {isEditingPassword ? (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 py-3">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Senha Atual</label>
                <Input
                  type="password"
                  {...passwordForm.register('currentPassword')}
                  disabled={passwordForm.formState.isSubmitting}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-red-400 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Nova Senha</label>
                <Input
                  type="password"
                  {...passwordForm.register('newPassword')}
                  disabled={passwordForm.formState.isSubmitting}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-400 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Confirme a Nova Senha</label>
                <Input
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                  disabled={passwordForm.formState.isSubmitting}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setIsEditingPassword(false);
                    passwordForm.reset();
                  }}
                  disabled={passwordForm.formState.isSubmitting}
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5"
                  disabled={passwordForm.formState.isSubmitting}
                >
                  <Check className="w-3.5 h-3.5" />
                  {passwordForm.formState.isSubmitting ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-700/40 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-100 font-medium">Senha</p>
                <p className="text-xs text-gray-500">••••••••••••</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-medium transition-all duration-200 text-sm"
      >
        <LogOut className="w-4 h-4" />
        Sair da conta
      </button>
    </div>
  );
}
