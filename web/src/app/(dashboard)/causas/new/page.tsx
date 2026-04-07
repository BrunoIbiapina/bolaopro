'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronRight, ChevronLeft, Plus, X, Globe, Lock,
  Eye, EyeOff, Check, AlertCircle, CheckCircle2,
  Landmark, Dumbbell, Cloud, Clapperboard,
  Briefcase, Theater, Lightbulb, ToggleLeft, ToggleRight, Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateCausa, usePublishCausa,
  CAUSA_CATEGORY_LABELS, type CausaCategory,
} from '@/hooks/use-causas';

const CATEGORY_ICONS: Record<CausaCategory, React.ElementType> = {
  POLITICA:       Landmark,
  ESPORTE:        Dumbbell,
  CLIMA:          Cloud,
  ENTRETENIMENTO: Clapperboard,
  NEGOCIOS:       Briefcase,
  CULTURA:        Theater,
  OUTROS:         Lightbulb,
};

// ─── Schema ───────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(5, 'Mínimo 5 caracteres').max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['POLITICA','ESPORTE','CLIMA','ENTRETENIMENTO','NEGOCIOS','CULTURA','OUTROS']),
  type: z.enum(['BINARY','CHOICE','NUMERIC']),
  visibility: z.enum(['PUBLIC','PRIVATE']),
  deadlineDate: z.string().min(1, 'Obrigatório'),
  deadlineTime: z.string().min(1, 'Obrigatório'),
  entryFee: z.number().min(0).default(0),
  cotasPerParticipant: z.number().min(1).max(10).default(1),
  hideVoteCount: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  numericUnit: z.string().max(20).optional(),
  numericMatchMode: z.enum(['EXACT','CLOSEST']).default('CLOSEST'),
  options: z.array(z.object({
    label: z.string().min(1, 'Obrigatório').max(100),
    emoji: z.string().max(4).optional(),
    order: z.number().default(0),
  })).optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Wizard ───────────────────────────────────────────────────

export default function NewCausaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [createdCausaId, setCreatedCausaId] = useState<string | null>(null);
  const [showCreatorJoinModal, setShowCreatorJoinModal] = useState(false);

  const createMutation = useCreateCausa();
  const publishMutation = usePublishCausa();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'OUTROS',
      type: 'BINARY',
      visibility: 'PUBLIC',
      entryFee: 0,
      cotasPerParticipant: 1,
      hideVoteCount: false,
      allowComments: true,
      numericMatchMode: 'CLOSEST',
      options: [
        { label: '', emoji: '', order: 0 },
        { label: '', emoji: '', order: 1 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'options' });
  const type = form.watch('type');
  const visibility = form.watch('visibility');
  const hideVoteCount = form.watch('hideVoteCount');
  const entryFee = form.watch('entryFee');

  const handleNext = async () => {
    const step2Fields: (keyof FormData)[] = ['type', 'numericUnit', 'numericMatchMode'];
    if (type === 'CHOICE') step2Fields.push('options');

    const fieldsToValidate: (keyof FormData)[][] = [
      ['title', 'description', 'category'],
      step2Fields,
      ['deadlineDate', 'deadlineTime', 'visibility', 'entryFee', 'cotasPerParticipant'],
    ];
    const valid = await form.trigger(fieldsToValidate[step - 1] as any);
    if (valid) setStep(step + 1);
  };

  const handleSubmit = async () => {
    const fieldsToValidate: (keyof FormData)[] = [
      'title', 'category', 'type',
      'deadlineDate', 'deadlineTime', 'visibility',
      'entryFee', 'cotasPerParticipant',
      'numericUnit', 'numericMatchMode',
      'hideVoteCount', 'allowComments',
    ];
    if (type === 'CHOICE') fieldsToValidate.push('options');
    const valid = await form.trigger(fieldsToValidate as any);
    if (!valid) return;

    const values = form.getValues();
    const deadlineAt = new Date(`${values.deadlineDate}T${values.deadlineTime}:00`).toISOString();

    try {
      const causa = await createMutation.mutateAsync({
        title: values.title,
        description: values.description,
        category: values.category,
        type: values.type,
        visibility: values.visibility,
        deadlineAt,
        entryFee: values.entryFee,
        cotasPerParticipant: values.cotasPerParticipant,
        hideVoteCount: values.hideVoteCount,
        allowComments: values.allowComments,
        numericUnit: values.numericUnit,
        numericMatchMode: values.numericMatchMode,
        options: values.type === 'CHOICE'
          ? values.options?.map((o, i) => ({ label: o.label, emoji: o.emoji, order: i }))
          : undefined,
      });

      setCreatedCausaId(causa.id);

      // Publicar imediatamente
      await publishMutation.mutateAsync(causa.id);

      // Perguntar se criador quer participar
      setShowCreatorJoinModal(true);
    } catch {
      // erro já tratado nos hooks
    }
  };

  if (showCreatorJoinModal && createdCausaId) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center space-y-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Causa publicada!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Deseja participar da sua própria causa?
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => router.push(`/causas/${createdCausaId}?join=1`)}
              className="w-full"
            >
              <Check className="w-4 h-4 mr-2" /> Sim, quero participar
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/causas/${createdCausaId}`)}
              className="w-full"
            >
              Não, só criar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nova Causa</h1>

        {/* Progress */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s < step
                  ? 'bg-green-500 text-white'
                  : s === step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {s < step ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && (
                <div className={`h-0.5 w-12 rounded ${s < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {['Básico', 'Tipo e Opções', 'Configurações'][step - 1]}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">

        {/* ── Step 1: Básico ──────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <Label>Título da causa *</Label>
              <Input
                placeholder="Ex: Quem vai ganhar o Brasileirão 2026?"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Contexto adicional..."
                rows={3}
                {...form.register('description')}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(CAUSA_CATEGORY_LABELS) as CausaCategory[]).map((cat) => {
                  const meta = CAUSA_CATEGORY_LABELS[cat];
                  const Icon = CATEGORY_ICONS[cat];
                  const selected = form.watch('category') === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => form.setValue('category', cat)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                        selected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Tipo e Opções ──────────────────────── */}
        {step === 2 && (
          <>
            <div className="space-y-1.5">
              <Label>Tipo de previsão *</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'BINARY',  label: 'Sim / Não', icon: ToggleRight, desc: 'Duas opções fixas' },
                  { value: 'CHOICE',  label: 'Múltipla',  icon: Check,       desc: '2 a 8 opções' },
                  { value: 'NUMERIC', label: 'Numérico',  icon: Hash,        desc: 'Valor exato' },
                ].map((t) => {
                  const selected = type === t.value;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => form.setValue('type', t.value as any)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                        selected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                      <span className={`text-xs font-semibold ${selected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {t.label}
                      </span>
                      <span className="text-xs text-gray-400">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {type === 'BINARY' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Opções criadas automaticamente:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Sim', emoji: '✅' },
                    { label: 'Não', emoji: '❌' },
                  ].map((opt) => (
                    <div
                      key={opt.label}
                      className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-70"
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === 'CHOICE' && (
              <div className="space-y-2">
                <Label>Opções (2 a 8) *</Label>
                {fields.map((field, i) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Ícone"
                      className="w-16 text-center text-xs"
                      maxLength={4}
                      {...form.register(`options.${i}.emoji`)}
                    />
                    <Input
                      placeholder={`Opção ${i + 1}`}
                      {...form.register(`options.${i}.label`)}
                    />
                    {fields.length > 2 && (
                      <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {fields.length < 8 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => append({ label: '', emoji: '', order: fields.length })}
                    className="w-full border border-dashed border-gray-300 dark:border-gray-700"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar opção
                  </Button>
                )}
              </div>
            )}

            {type === 'NUMERIC' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Unidade (opcional)</Label>
                  <Input
                    placeholder="Ex: gols, %, pontos, votos"
                    {...form.register('numericUnit')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Modo de resultado</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'CLOSEST', label: 'Mais próximo', desc: 'Ganha quem chegou mais perto' },
                      { value: 'EXACT',   label: 'Exato',        desc: 'Só quem acertou o número exato' },
                    ].map((m) => {
                      const sel = form.watch('numericMatchMode') === m.value;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => form.setValue('numericMatchMode', m.value as any)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            sel
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                          }`}
                        >
                          <p className={`text-xs font-semibold ${sel ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                            {m.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 3: Configurações ──────────────────────── */}
        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data limite *</Label>
                <Input
                  type="date"
                  {...form.register('deadlineDate')}
                  min={new Date().toISOString().split('T')[0]}
                />
                {form.formState.errors.deadlineDate && (
                  <p className="text-xs text-red-500">Obrigatório</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Hora *</Label>
                <Input type="time" {...form.register('deadlineTime')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Visibilidade</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'PUBLIC',  label: 'Pública',  desc: 'Aparece no feed',       icon: Globe },
                  { value: 'PRIVATE', label: 'Privada',  desc: 'Só via link/convite',   icon: Lock },
                ].map((v) => {
                  const sel = visibility === v.value;
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => form.setValue('visibility', v.value as any)}
                      className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${
                        sel
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 ${sel ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <p className={`text-xs font-semibold ${sel ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          {v.label}
                        </p>
                        <p className="text-xs text-gray-400">{v.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Taxa de entrada por cota (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0 = gratuito"
                  {...form.register('entryFee', { valueAsNumber: true })}
                />
                {entryFee > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Plataforma retém 10% do prize pool
                  </p>
                )}
              </div>

              {entryFee > 0 && (
                <div className="space-y-1.5">
                  <Label>Máx. cotas por participante</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    {...form.register('cotasPerParticipant', { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => form.setValue('hideVoteCount', !hideVoteCount)}
                className="flex items-center justify-between w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-2">
                  {hideVoteCount ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {hideVoteCount ? 'Contagem oculta' : 'Contagem visível'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {hideVoteCount ? 'Votos revelados só após o prazo' : 'Resultados em tempo real'}
                    </p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors ${hideVoteCount ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform shadow ${hideVoteCount ? 'ml-5' : 'ml-0.5'}`} />
                </div>
              </button>
            </div>
          </>
        )}

        {/* Botões de navegação */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={handleNext} className="flex-1">
              Próximo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || publishMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending || publishMutation.isPending ? 'Publicando...' : 'Publicar Causa'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
