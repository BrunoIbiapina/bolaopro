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
  Sparkles, Zap,
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

// ─── Schema ────────────────────────────────────────────────────

const schema = z.object({
  title:               z.string().min(5, 'Mínimo 5 caracteres').max(200),
  description:         z.string().max(1000).optional(),
  category:            z.enum(['POLITICA','ESPORTE','CLIMA','ENTRETENIMENTO','NEGOCIOS','CULTURA','OUTROS']),
  type:                z.enum(['BINARY','CHOICE','NUMERIC']),
  visibility:          z.enum(['PUBLIC','PRIVATE']),
  deadlineDate:        z.string().min(1, 'Obrigatório'),
  deadlineTime:        z.string().min(1, 'Obrigatório'),
  entryFee:            z.number().min(0).default(0),
  cotasPerParticipant: z.number().min(1).max(10).default(1),
  hideVoteCount:       z.boolean().default(false),
  allowComments:       z.boolean().default(true),
  numericUnit:         z.string().max(20).optional(),
  numericMatchMode:    z.enum(['EXACT','CLOSEST']).default('CLOSEST'),
  options:             z.array(z.object({
    label: z.string().min(1, 'Obrigatório').max(100),
    emoji: z.string().max(4).optional(),
    order: z.number().default(0),
  })).optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Wizard ────────────────────────────────────────────────────

const STEP_LABELS = ['Básico', 'Tipo e Opções', 'Configurações'];

export default function NewCausaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [createdCausaId, setCreatedCausaId] = useState<string | null>(null);
  const [showCreatorJoinModal, setShowCreatorJoinModal] = useState(false);
  // Modo de publicação
  const [publishMode, setPublishMode] = useState<'open' | 'scheduled'>('open');
  const [isFeatured, setIsFeatured] = useState(false);

  const createMutation = useCreateCausa();
  const publishMutation = usePublishCausa();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category:            'OUTROS',
      type:                'BINARY',
      visibility:          'PUBLIC',
      entryFee:            0,
      cotasPerParticipant: 1,
      hideVoteCount:       false,
      allowComments:       true,
      numericMatchMode:    'CLOSEST',
      options: [
        { label: '', emoji: '', order: 0 },
        { label: '', emoji: '', order: 1 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'options' });
  const type          = form.watch('type');
  const visibility    = form.watch('visibility');
  const hideVoteCount = form.watch('hideVoteCount');
  const entryFee      = form.watch('entryFee');

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
    const allFields: (keyof FormData)[] = [
      'title', 'description', 'category', 'type',
      'numericUnit', 'numericMatchMode',
      'deadlineDate', 'deadlineTime', 'visibility', 'entryFee', 'cotasPerParticipant',
      'hideVoteCount', 'allowComments',
    ];
    if (type === 'CHOICE') allFields.push('options');
    const valid = await form.trigger(allFields as any);
    if (!valid) return;

    const values = form.getValues();
    const deadlineAt = new Date(`${values.deadlineDate}T${values.deadlineTime}:00`).toISOString();

    try {
      const causa = await createMutation.mutateAsync({
        title:               values.title,
        description:         values.description,
        category:            values.category,
        type:                values.type,
        visibility:          values.visibility,
        deadlineAt,
        entryFee:            values.entryFee,
        cotasPerParticipant: values.cotasPerParticipant,
        hideVoteCount:       values.hideVoteCount,
        allowComments:       values.allowComments,
        numericUnit:         values.numericUnit,
        numericMatchMode:    values.numericMatchMode,
        options: (values.type === 'CHOICE' || values.type === 'BINARY')
          ? values.options?.map((o, i) => ({
              label: o.label?.trim() || (i === 0 ? 'Sim' : 'Não'),
              emoji: o.emoji,
              order: i,
            }))
          : undefined,
      });

      setCreatedCausaId(causa.id);
      await publishMutation.mutateAsync({
        causaId:     causa.id,
        asScheduled: publishMode === 'scheduled',
        isFeatured:  publishMode === 'scheduled' && isFeatured,
      });
      setShowCreatorJoinModal(true);
    } catch {
      // erro já tratado nos hooks
    }
  };

  // ── Modal pós-criação ────────────────────────────────────────
  if (showCreatorJoinModal && createdCausaId) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-surface border border-surface-lighter rounded-2xl p-8 text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Causa publicada!</h2>
          <p className="text-gray-400 text-sm">
            Deseja participar da sua própria causa?
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => router.push(`/causas/${createdCausaId}?join=1`)}
              className="w-full gap-2"
            >
              <Check className="w-4 h-4" /> Sim, quero participar
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
    <div className="max-w-xl mx-auto px-4 py-6 pb-32 sm:pb-6">

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Nova Causa</h1>
            <p className="text-sm text-gray-500 mt-0.5">{STEP_LABELS[step - 1]}</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 shrink-0">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s < step
                    ? 'bg-emerald-500 text-white'
                    : s === step
                    ? 'bg-blue-600 text-white ring-2 ring-blue-500/30'
                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                }`}>
                  {s < step ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`h-0.5 w-6 rounded-full transition-colors ${s < step ? 'bg-emerald-500' : 'bg-gray-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-surface border border-surface-lighter rounded-2xl p-5 space-y-5">

        {/* ── Step 1: Básico ──────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <Label>Título da causa *</Label>
              <Input
                placeholder={
                  form.watch('category') === 'POLITICA'
                    ? 'Ex: Quem vence a disputa para Governador de SP em 2026?'
                    : 'Ex: Quem vai ganhar o Brasileirão 2026?'
                }
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Contexto adicional, regras, referências..."
                rows={3}
                {...form.register('description')}
              />
            </div>

            <div className="space-y-2">
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
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                        selected
                          ? 'border-blue-500/60 bg-blue-500/10 text-blue-300'
                          : 'border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${selected ? 'text-blue-400' : 'text-gray-500'}`} />
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
            <div className="space-y-2">
              <Label>Tipo de previsão *</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'BINARY',  label: 'Dois Lados', icon: ToggleRight, desc: 'A vs B' },
                  { value: 'CHOICE',  label: 'Múltipla',  icon: Check,       desc: '2 – 8 opções' },
                  { value: 'NUMERIC', label: 'Numérico',  icon: Hash,        desc: 'Valor exato' },
                ].map((t) => {
                  const selected = type === t.value;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => form.setValue('type', t.value as any)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                        selected
                          ? 'border-blue-500/60 bg-blue-500/10'
                          : 'border-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${selected ? 'text-blue-400' : 'text-gray-500'}`} />
                      <span className={`text-xs font-semibold ${selected ? 'text-blue-300' : 'text-gray-300'}`}>
                        {t.label}
                      </span>
                      <span className="text-xs text-gray-600">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BINARY: rótulos editáveis */}
            {type === 'BINARY' && (
              <div className="space-y-2">
                <div>
                  <Label>Nome das opções</Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Deixe em branco para usar Sim / Não como padrão.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-400">Opção 1</p>
                    <Input
                      placeholder="Ex: Sim, Vai, Acontece..."
                      maxLength={40}
                      {...form.register('options.0.label')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-400">Opção 2</p>
                    <Input
                      placeholder="Ex: Não, Nunca, Não rola..."
                      maxLength={40}
                      {...form.register('options.1.label')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CHOICE: opções livres */}
            {type === 'CHOICE' && (
              <div className="space-y-2">
                {form.watch('category') === 'POLITICA' ? (
                  <div>
                    <Label>Candidatos (2 a 8) *</Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Adicione os candidatos — ex: "Tarcísio (PL)", "Lula (PT)", "Vereador João Silva"
                    </p>
                  </div>
                ) : (
                  <Label>Opções (2 a 8) *</Label>
                )}
                {fields.map((field, i) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      placeholder="🏅"
                      className="w-14 text-center text-lg px-1"
                      maxLength={4}
                      {...form.register(`options.${i}.emoji`)}
                    />
                    <Input
                      placeholder={
                        form.watch('category') === 'POLITICA'
                          ? `Candidato ${i + 1} — ex: Nome (Partido)`
                          : `Opção ${i + 1}`
                      }
                      {...form.register(`options.${i}.label`)}
                    />
                    {fields.length > 2 && (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {form.formState.errors.options && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Preencha todos os rótulos
                  </p>
                )}
                {fields.length < 8 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => append({ label: '', emoji: '', order: fields.length })}
                    className="w-full border border-dashed border-gray-700 hover:border-gray-500 text-gray-500 hover:text-gray-300"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar opção
                  </Button>
                )}
              </div>
            )}

            {/* NUMERIC */}
            {type === 'NUMERIC' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Unidade (opcional)</Label>
                  <Input
                    placeholder="Ex: gols, %, pontos, votos..."
                    {...form.register('numericUnit')}
                  />
                </div>
                <div className="space-y-2">
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
                          className={`p-3 rounded-xl border text-left transition-all ${
                            sel
                              ? 'border-blue-500/60 bg-blue-500/10'
                              : 'border-gray-800 hover:border-gray-600'
                          }`}
                        >
                          <p className={`text-xs font-semibold ${sel ? 'text-blue-300' : 'text-gray-300'}`}>
                            {m.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{m.desc}</p>
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
            {/* Data e hora */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data limite *</Label>
                <Input
                  type="date"
                  {...form.register('deadlineDate')}
                  min={new Date().toISOString().split('T')[0]}
                />
                {form.formState.errors.deadlineDate && (
                  <p className="text-xs text-red-400">Obrigatório</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Hora *</Label>
                <Input type="time" {...form.register('deadlineTime')} />
              </div>
            </div>

            {/* Visibilidade */}
            <div className="space-y-2">
              <Label>Visibilidade</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'PUBLIC',  label: 'Pública',  desc: 'Aparece no feed', icon: Globe },
                  { value: 'PRIVATE', label: 'Privada',  desc: 'Só via link',      icon: Lock },
                ].map((v) => {
                  const sel = visibility === v.value;
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => form.setValue('visibility', v.value as any)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        sel
                          ? 'border-blue-500/60 bg-blue-500/10'
                          : 'border-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${sel ? 'text-blue-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-xs font-semibold ${sel ? 'text-blue-300' : 'text-gray-300'}`}>
                          {v.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{v.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Taxa + cotas */}
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
                  <p className="text-xs text-amber-400 flex items-center gap-1">
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

            {/* Toggle: ocultar votos */}
            <button
              type="button"
              onClick={() => form.setValue('hideVoteCount', !hideVoteCount)}
              className="flex items-center justify-between w-full p-3 rounded-xl border border-gray-800 hover:border-gray-600 transition-all"
            >
              <div className="flex items-center gap-2.5">
                {hideVoteCount
                  ? <EyeOff className="w-4 h-4 text-gray-400" />
                  : <Eye className="w-4 h-4 text-gray-400" />
                }
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-300">
                    {hideVoteCount ? 'Contagem oculta' : 'Contagem visível'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {hideVoteCount ? 'Resultados revelados após prazo' : 'Votos em tempo real'}
                  </p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors shrink-0 relative ${hideVoteCount ? 'bg-blue-500' : 'bg-gray-700'}`}>
                <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all shadow ${hideVoteCount ? 'left-5' : 'left-0.5'}`} />
              </div>
            </button>

            {/* Modo de publicação */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-300">Publicar como</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    value: 'open',
                    label: 'Aberta agora',
                    desc: 'Votação liberada imediatamente',
                    icon: Zap,
                    color: 'border-blue-500/60 bg-blue-500/10',
                    activeLabel: 'text-blue-300',
                    activeIcon: 'text-blue-400',
                  },
                  {
                    value: 'scheduled',
                    label: 'Em Breve',
                    desc: 'Aparece no feed — votação bloqueada',
                    icon: Sparkles,
                    color: 'border-violet-500/60 bg-violet-500/10',
                    activeLabel: 'text-violet-300',
                    activeIcon: 'text-violet-400',
                  },
                ].map((m) => {
                  const sel = publishMode === m.value;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPublishMode(m.value as any)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        sel ? m.color : 'border-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${sel ? m.activeIcon : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-xs font-semibold ${sel ? m.activeLabel : 'text-gray-300'}`}>
                          {m.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{m.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Toggle: fixar no topo (só no modo scheduled) */}
              {publishMode === 'scheduled' && (
                <button
                  type="button"
                  onClick={() => setIsFeatured((v) => !v)}
                  className={`flex items-center justify-between w-full p-3 rounded-xl border transition-all ${
                    isFeatured ? 'border-violet-500/60 bg-violet-500/10' : 'border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className={`w-4 h-4 ${isFeatured ? 'text-violet-400' : 'text-gray-500'}`} />
                    <div className="text-left">
                      <p className={`text-sm font-medium ${isFeatured ? 'text-violet-300' : 'text-gray-300'}`}>
                        Fixar no topo do feed
                      </p>
                      <p className="text-xs text-gray-500">Aparece em destaque acima das outras causas</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors shrink-0 relative ${isFeatured ? 'bg-violet-500' : 'bg-gray-700'}`}>
                    <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all shadow ${isFeatured ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Botões de navegação — sticky no mobile */}
      <div className="fixed bottom-0 left-0 right-0 sm:relative sm:bottom-auto sm:left-auto sm:right-auto z-30 bg-gray-950/95 sm:bg-transparent backdrop-blur sm:backdrop-blur-none border-t border-gray-800 sm:border-0 px-4 sm:px-0 py-3 sm:py-0 sm:mt-4">
        <div className="flex gap-3 max-w-xl mx-auto">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={handleNext} className="flex-1 gap-1">
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || publishMutation.isPending}
              className="flex-1 gap-2"
            >
              {createMutation.isPending || publishMutation.isPending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publicando...</>
                : publishMode === 'scheduled'
                  ? <><Sparkles className="w-4 h-4" /> Agendar como "Em Breve"</>
                  : <><Check className="w-4 h-4" /> Publicar Causa</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
