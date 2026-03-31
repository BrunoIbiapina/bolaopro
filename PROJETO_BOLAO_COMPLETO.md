# BOLÃO PRO — Documento Técnico Completo do Projeto

**Plataforma de Bolão Esportivo Social entre Amigos**

**Versão:** 1.0.0
**Data:** 30 de março de 2026
**Autor:** Arquitetura gerada por IA — revisão humana obrigatória antes da implementação
**Classificação:** Documento técnico de produto — confidencial

---

## Sumário Executivo

O **Bolão Pro** é uma plataforma digital de gestão de bolões esportivos privados entre amigos, com foco em futebol. Não se trata de uma casa de apostas ou sportsbook. É um sistema social, transparente e auditável para que grupos de amigos possam organizar seus bolões com segurança, controle financeiro e experiência de uso premium.

O sistema resolve as dores reais de quem organiza bolões hoje: planilhas manuais, cobranças via WhatsApp, falta de transparência na apuração, disputas sobre regras e rateio, e ausência de histórico confiável.

**Posicionamento legal:** plataforma social de gestão de bolões privados. Não intermedia apostas com operadoras licenciadas. Integrações com odds externas servem exclusivamente como referência comparativa e informacional. Todo módulo sensível pode ser ativado ou desativado conforme contexto regulatório.

---

# 1. VISÃO GERAL DO PRODUTO

## 1.1 Proposta do Sistema

Bolão Pro é uma plataforma web responsiva (com roadmap para app mobile) que permite a qualquer pessoa criar, gerenciar e participar de bolões esportivos privados entre amigos, com controle completo de regras, pagamentos, apuração, ranking e rateio de prêmios.

## 1.2 Público-Alvo

O público primário são grupos de amigos, colegas de trabalho, familiares e comunidades online que já fazem bolões informais em planilhas, WhatsApp ou verbalmente. Perfil demográfico principal: homens e mulheres de 18 a 55 anos, com acesso a smartphone e conta bancária (PIX).

Públicos secundários incluem organizadores de eventos corporativos, bares e restaurantes que promovem bolões em época de Copa do Mundo ou Campeonato Brasileiro, e comunidades de fãs de futebol em redes sociais.

## 1.3 Tipos de Bolão Suportados

O sistema suporta diversos formatos de bolão, todos configuráveis via motor de regras:

**Bolão de Rodada:** o participante dá palpites para todos os jogos de uma rodada específica de um campeonato. Pontuação acumulada rodada a rodada. Campeão é quem fizer mais pontos ao final da última rodada.

**Bolão de Campeonato Completo:** engloba todas as rodadas de um campeonato (ex: Brasileirão Série A completo). Pontuação acumulada durante toda a temporada.

**Bolão de Mata-Mata:** voltado para fases eliminatórias (ex: Copa do Brasil a partir das oitavas, Champions League a partir das oitavas). O participante aposta no classificado de cada confronto, com bônus opcional para placar exato.

**Bolão de Copa do Mundo / Copa América:** formato especial com fase de grupos + mata-mata. Regras específicas para prorrogação e pênaltis.

**Bolão Personalizado:** o organizador define livremente: quantos jogos, quais competições, regras de pontuação, critérios de campeão e formato de rateio.

## 1.4 Diferenciais

Gestão financeira integrada com link de pagamento individual por participante, status de pagamento em tempo real e conciliação automática via webhook. Transparência total com trilha de auditoria, log de todas as ações e histórico imutável de palpites (com timestamp de registro). Motor de regras flexível que permite criar qualquer formato de bolão sem alterar código. Ranking em tempo real com atualização automática conforme resultados são registrados. Experiência visual premium com estados claros, badges de status, destaque do líder e tela de campeão impactante. Comparação opcional com odds externas como módulo informativo, sem dependência operacional. Preparação para compliance e LGPD desde o dia zero.

## 1.5 Fluxo Principal do Usuário

O usuário recebe um link de convite para um bolão. Ao clicar, é direcionado para a landing page do bolão com informações sobre o campeonato, regras, valor de entrada e lista de participantes. Se ainda não tem conta, faz cadastro com e-mail e senha, confirma o e-mail e preenche dados do perfil. Com a conta criada, aceita o convite e é direcionado para o link de pagamento da taxa de entrada. Após confirmação do pagamento (via webhook), seu status muda para "ativo" e ele pode acessar a tela de palpites. Preenche seus palpites para os jogos disponíveis (até o horário de travamento de cada partida). Acompanha resultados em tempo real no dashboard. Vê sua posição no ranking atualizado. Ao final do bolão, vê a tela de campeão ou, se não houver vencedor, a tela de rateio/devolução.

## 1.6 Fluxo Principal do Administrador

O administrador faz login no painel admin. Cadastra equipes (ou importa via integração). Cadastra o campeonato e suas rodadas. Cadastra as partidas de cada rodada (ou importa via integração). Cria um bolão associado ao campeonato, definindo regras, valor de entrada, limite de participantes e critérios de pontuação. Gera o link de convite e distribui. Acompanha adesões e pagamentos no painel financeiro. Após cada rodada, confirma resultados (automáticos via integração ou manuais). O sistema recalcula ranking automaticamente. Ao final, o sistema declara o campeão ou processa devoluções. O admin pode exportar relatórios, visualizar auditoria e gerenciar situações excepcionais.

---

# 2. DEFINIÇÃO COMPLETA DAS FUNCIONALIDADES

## 2.1 Autenticação

Cadastro com e-mail e senha. Senha com requisitos mínimos: 8 caracteres, pelo menos 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial. Confirmação de e-mail obrigatória via token com validade de 24 horas. Login com e-mail e senha retornando access token JWT (validade 15 minutos) e refresh token (validade 7 dias, rotativo). Recuperação de senha via link enviado por e-mail com token de uso único e validade de 1 hora. Logout que invalida o refresh token atual. Rate limiting: máximo 5 tentativas de login falhadas por IP em 15 minutos, bloqueio temporário de 30 minutos. Futuramente: login social (Google, Apple) e 2FA via TOTP.

## 2.2 Cadastro de Usuário

Campos obrigatórios: nome completo, e-mail, senha, confirmação de senha. Campos opcionais no cadastro inicial: telefone celular (para notificações futuras). Após cadastro, e-mail de verificação é enviado automaticamente. Reenvio de e-mail de verificação disponível a cada 2 minutos. Usuário não verificado pode navegar mas não pode participar de bolões ou fazer palpites.

## 2.3 Perfil do Usuário

Dados pessoais: nome, e-mail (não editável após verificação), telefone, avatar (upload de imagem, máximo 2MB, formatos JPG/PNG/WebP), data de nascimento (validação de idade mínima 18 anos), chave PIX (para recebimento de prêmios/devoluções). Estatísticas: total de bolões participados, bolões vencidos, taxa de acerto geral, melhor colocação, palpites registrados. Preferências: notificações por e-mail (liga/desliga por tipo), modo escuro, fuso horário. Dados sensíveis: CPF (opcional, necessário apenas se regulamentação exigir), armazenado com criptografia em repouso.

## 2.4 Criação e Gestão de Bolões

O organizador cria um bolão preenchendo: nome do bolão, descrição/regras em texto livre, campeonato vinculado, rodadas incluídas, valor da taxa de entrada (0 para bolão gratuito), limite de participantes (ou ilimitado), visibilidade (privado por convite / público com link), regras de pontuação (selecionadas de templates ou personalizadas), critério de campeão, política de empate no topo, política de rateio do prêmio, política de devolução, prazo limite de inscrição, data de encerramento.

Estados do bolão: RASCUNHO (criado mas não publicado), ABERTO (aceitando inscrições e pagamentos), EM_ANDAMENTO (jogos já começaram, inscrições podem estar abertas ou fechadas conforme configuração), FINALIZADO (todos os jogos terminaram, campeão declarado ou devolução processada), CANCELADO (bolão cancelado antes da finalização, devolução total processada).

## 2.5 Convite por Link

Cada bolão gera um link único de convite no formato `https://bolaopro.com.br/convite/{codigo}`. O código é um UUID v4 encurtado (base62, 8 caracteres). O link pode ser compartilhado via WhatsApp, Telegram, e-mail ou qualquer rede social. Ao acessar o link, o visitante vê a página pública do bolão com informações básicas. Se não estiver logado, é redirecionado para login/cadastro com redirect automático para o bolão após autenticação. O organizador pode revogar e gerar novo link a qualquer momento. Opcionalmente, o organizador pode definir senha para o bolão (camada extra de privacidade).

## 2.6 Pagamento por Participante

Ao aceitar um convite de bolão com taxa, o sistema gera automaticamente um link de pagamento individual para o participante. O link é gerado via API do provedor de pagamento (Mercado Pago como primeira escolha, com Asaas como backup). Métodos aceitos: PIX (prioridade), cartão de crédito, boleto bancário. Status do pagamento: PENDENTE, PROCESSANDO, PAGO, EXPIRADO, CANCELADO, REEMBOLSADO, ESTORNADO. O link de pagamento expira em 48 horas (configurável). Se expirar, o participante pode solicitar reenvio. Confirmação de pagamento é recebida via webhook e atualiza o status em tempo real. Participante só pode registrar palpites após pagamento confirmado. Bolão gratuito (taxa = 0) não gera link de pagamento; o participante é ativado automaticamente ao aceitar o convite.

## 2.7 Cadastro de Times

Campos: nome oficial, nome abreviado (máx 3 caracteres, ex: FLA, PAL, COR), escudo (upload de imagem ou URL), país, estado (para times brasileiros), cidade, estádio principal, ID externo (para integração com API esportiva). Cadastro manual pelo admin ou importação automática via integração. Soft delete para times inativos. Índice único em nome + país para evitar duplicatas.

## 2.8 Cadastro de Campeonatos

Campos: nome, temporada/ano, país, tipo (liga/pontos corridos, copa/mata-mata, misto), número de rodadas/fases, data de início, data de término prevista, status (PLANEJADO, EM_ANDAMENTO, FINALIZADO, CANCELADO), ID externo (para integração), logo/imagem. Cada campeonato tem rodadas/fases filhas. Cada rodada tem data de início e fim, número sequencial e nome (ex: "Rodada 1", "Quartas de Final — Ida").

## 2.9 Cadastro de Partidas

Campos: campeonato, rodada/fase, time mandante, time visitante, data e horário (com fuso), estádio, status (AGENDADA, EM_ANDAMENTO, INTERVALO, FINALIZADA, ADIADA, CANCELADA, WO), gols mandante (null até finalizar), gols visitante (null até finalizar), ID externo. Para mata-mata: gols prorrogação mandante/visitante, resultado de pênaltis mandante/visitante, classificado. Timestamps: created_at, updated_at, started_at, finished_at. O admin pode cadastrar manualmente ou o sistema importa via API esportiva. Atualização de resultado: manual pelo admin ou automática via integração (com confirmação ou aprovação do admin, conforme configuração).

## 2.10 Lançamento de Resultados

Dois modos de operação:

**Modo Manual:** o admin acessa a partida no painel, insere o placar final e confirma. O sistema marca a partida como FINALIZADA e dispara recálculo de ranking.

**Modo Automático (com integração):** um job agendado consulta a API esportiva periodicamente (a cada 1 minuto durante jogos, a cada 15 minutos fora de horário de jogo). Quando detecta que a partida foi finalizada, atualiza o placar automaticamente. Conforme configuração, pode exigir aprovação do admin ou aplicar diretamente. Em caso de divergência entre API e valor já registrado, gera alerta para o admin.

Reprocessamento: se um resultado for corrigido (erro da API, alteração pela CBF), o admin pode editar o placar e disparar reprocessamento manual. O sistema recalcula todos os palpites afetados e atualiza o ranking.

## 2.11 Registro de Palpites

O participante acessa a tela de palpites e vê todos os jogos disponíveis para a rodada corrente. Para cada jogo, informa: gols do mandante e gols do visitante (números inteiros >= 0). Em bolões de mata-mata, pode também informar: qual time se classifica (obrigatório). O palpite é registrado com timestamp. O palpite pode ser alterado quantas vezes quiser ATÉ o horário de travamento. Horário de travamento: horário de início da partida menos o tempo de antecedência configurado no bolão (padrão: 0 minutos, ou seja, trava no exato horário de início). Após travamento, o palpite é imutável e recebe selo de "travado". Se o participante não registrar palpite antes do travamento, recebe 0 pontos para aquela partida. Validações: somente participantes ativos (pagamento confirmado) podem registrar palpites. Números negativos são bloqueados. Campos obrigatórios para todos os jogos da rodada (aviso, mas não bloqueio — é possível salvar parcialmente).

## 2.12 Ranking

O ranking é uma tabela classificatória de todos os participantes do bolão, ordenada por pontuação total (decrescente) com critérios de desempate configuráveis. Atualização: recalculado automaticamente após cada resultado de partida ser registrado. O recálculo é assíncrono (via fila) para não bloquear a aplicação. Campos exibidos: posição, nome do participante, avatar, pontuação total, número de acertos exatos, número de acertos de vencedor, número de erros, variação de posição (subiu/desceu/manteve desde última atualização), status (ativo/eliminado). Critérios de desempate (ordem padrão, configurável): pontuação total, número de acertos exatos, número de acertos de vencedor, quem registrou palpites primeiro (timestamp mais antigo). O ranking tem destaque visual no líder (coroa/badge dourado), top 3 (pódio visual), zona de premiação (se houver mais de um prêmio), zona de eliminação (em bolões com eliminação).

## 2.13 Apuração

A apuração é o processo de comparar o palpite do participante com o resultado oficial da partida e atribuir pontuação. Regras de pontuação padrão (configuráveis por bolão):

Acerto exato do placar: 10 pontos. Exemplo: palpitou 2x1 e o jogo terminou 2x1.

Acerto do vencedor com diferença de gols correta: 7 pontos. Exemplo: palpitou 3x1 e o jogo terminou 2x0 (ambos vitória do mandante com 2 gols de diferença).

Acerto do vencedor (com gols do vencedor correto): 5 pontos. Exemplo: palpitou 2x0 e o jogo terminou 2x1 (ambos vitória do mandante e mandante fez 2 gols).

Acerto do vencedor (simples): 3 pontos. Exemplo: palpitou 1x0 e o jogo terminou 3x2 (ambos vitória do mandante).

Acerto de empate (sem placar exato): 2 pontos. Exemplo: palpitou 1x1 e o jogo terminou 0x0 (ambos empate, mas placar diferente).

Erro total: 0 pontos.

Em mata-mata: bônus de 5 pontos por acertar o classificado.

Essas pontuações são valores padrão. O organizador do bolão pode customizar cada valor.

## 2.14 Cálculo de Campeão

Ao encerrar a última rodada/fase do bolão, o sistema verifica o ranking final. O participante com maior pontuação é declarado campeão. Se houver empate no topo, aplica-se o critério de desempate configurado. Se após todos os critérios de desempate ainda houver empate: o prêmio é dividido igualmente entre os empatados (configuração padrão), ou o organizador pode resolver manualmente (configuração alternativa).

## 2.15 Cálculo de Empate

Quando dois ou mais participantes terminam empatados na primeira posição e o bolão está configurado para divisão automática: o prêmio total é dividido igualmente entre os empatados. Exemplo: prêmio de R$ 1.000 e 2 empatados = R$ 500 cada. Se a divisão resultar em centavos, arredondar para baixo e o residual fica retido na plataforma (ou é doado para o organizador, conforme configuração).

## 2.16 Cálculo de Devolução

Cenários que ativam devolução:

**Bolão cancelado pelo organizador antes do início:** devolução integral de 100% para todos que pagaram.

**Bolão cancelado durante o andamento:** devolução proporcional baseada no percentual de jogos não realizados. Exemplo: se 60% dos jogos foram disputados, devolve 40% do valor.

**Bolão sem vencedor (todos os critérios de vitória não atendidos):** devolução integral ou conforme regra configurada.

**Campeonato cancelado externamente:** devolução integral.

O cálculo de devolução gera um registro de reembolso para cada participante. O reembolso pode ser processado via estorno no meio de pagamento original, PIX para a chave cadastrada no perfil, ou crédito na carteira interna (se existir). O admin pode revisar e aprovar devoluções antes do processamento. Trilha de auditoria registra toda devolução.

## 2.17 Notificações

O sistema de notificações opera em 3 canais: in-app (centro de notificações no dashboard), e-mail (via serviço transacional — SendGrid ou Amazon SES) e push (futuro, para app mobile).

Eventos que geram notificação: convite para bolão recebido, pagamento pendente (lembrete após 24h e 6h antes de expirar), pagamento confirmado, palpite registrado com sucesso, prazo para palpite encerrando (2h antes e 30min antes), resultado de jogo registrado, você ganhou aquele confronto, você perdeu aquele confronto, ranking atualizado (sua posição mudou), campeão definido, devolução disponível, bolão cancelado, nova mensagem do organizador.

Cada tipo de notificação pode ser ativado/desativado pelo usuário nas preferências.

## 2.18 Painel Administrativo

Funcionalidades completas descritas na Seção 14.

## 2.19 Relatórios

Funcionalidades completas descritas na Seção 19.

## 2.20 Logs e Auditoria

Toda ação relevante gera um registro de auditoria contendo: timestamp, ID do usuário, tipo de ação, entidade afetada (ex: bolão, palpite, pagamento), dados anteriores (snapshot JSON), dados novos (snapshot JSON), IP de origem, user agent. Ações auditadas: criação/edição/exclusão de bolão, campeonato, partida, time; registro/edição de resultado; registro/edição de palpite (antes do travamento); pagamento recebido/estornado; devolução processada; alteração de regras do bolão; alteração de permissões; login/logout; ações destrutivas (cancelamentos).

Logs são imutáveis (append-only). Retenção mínima de 5 anos. Acesso restrito a super admin e perfil de auditoria.

## 2.21 Regras Personalizadas por Bolão

O motor de regras (Seção 13) permite que cada bolão tenha configuração independente de: pontuação por tipo de acerto, critérios de desempate, política de palpite não registrado, política de partida adiada/cancelada, formato do prêmio (winner-takes-all, top 3, percentual personalizado), permissão de alteração de palpite, tempo de antecedência para travamento, requisito de pagamento, etc.

---

# 3. REGRAS DE NEGÓCIO COMPLETAS

## 3.1 Quem Pode Criar Bolão

Qualquer usuário verificado (e-mail confirmado) pode criar bolões. O criador torna-se automaticamente o organizador do bolão. O super admin pode restringir a criação de bolões a perfis específicos, se necessário. Limite configurável de bolões ativos simultâneos por organizador (padrão: 10).

## 3.2 Ciclo de Vida do Bolão

**Abertura:** o organizador publica o bolão (muda de RASCUNHO para ABERTO). A partir desse momento, convites podem ser enviados e participantes podem se inscrever.

**Fechamento de inscrições:** pode ser automático (data configurada) ou manual (organizador fecha). Após fechamento, novos participantes não são aceitos. Participantes com pagamento pendente podem ter prazo extra configurável.

**Início:** o bolão entra em EM_ANDAMENTO quando a primeira partida vinculada começa. Não é necessária ação manual.

**Finalização:** o bolão é finalizado quando todos os resultados de todas as partidas vinculadas foram registrados e o ranking final está calculado. O sistema declara automaticamente o campeão ou processa devoluções.

**Cancelamento:** o organizador ou admin pode cancelar o bolão a qualquer momento. Se já houver pagamentos, o sistema processa devoluções conforme a política configurada.

## 3.3 Quem Pode Entrar

Qualquer usuário verificado que possua o link de convite. Se o bolão tem senha, o usuário deve informá-la. Se o bolão atingiu o limite de participantes, novos convites são rejeitados com mensagem clara. O organizador pode aprovar ou rejeitar participantes individualmente (modo de inscrição com aprovação).

## 3.4 Pagamento Obrigatório Antes de Apostar

**Regra inviolável:** nenhum palpite pode ser registrado por participante com status de pagamento diferente de PAGO. A API de registro de palpites valida o status de pagamento a cada requisição. Participantes com pagamento pendente veem os jogos mas não podem interagir com os campos de palpite. Mensagem contextual: "Efetue o pagamento para liberar seus palpites" com botão para acessar o link de pagamento.

## 3.5 Prazo Limite para Palpites

O prazo padrão é o horário de início da partida. O organizador pode configurar antecedência (ex: 30 minutos antes). Cada partida tem seu próprio horário de travamento. Palpites podem ser alterados livremente até o travamento. Após o travamento, o campo fica desabilitado e exibe selo "Palpite travado às HH:MM". Se o participante não registrar palpite antes do travamento, recebe 0 pontos para aquela partida. Nenhuma exceção é aceita — nem pelo organizador, nem pelo admin. Isso garante integridade e confiança no sistema.

## 3.6 Bloqueio de Palpites Após Início do Jogo

O bloqueio é verificado em duas camadas:

**Frontend:** timer visual mostra contagem regressiva. Ao atingir zero, campos são desabilitados via JavaScript. Isso é meramente visual e não constitui segurança.

**Backend:** toda requisição de registro/edição de palpite valida: `DateTime.now() < partida.data_hora - bolao.antecedencia_travamento`. Se a condição for falsa, a API retorna HTTP 422 com mensagem "Palpites para esta partida já foram travados". O backend é a fonte da verdade. Mesmo que o frontend tenha bug ou seja manipulado, o backend impede o registro.

## 3.7 Pontuação — Acerto de Placar Exato

O participante palpitou exatamente o placar final (gols mandante e gols visitante). Exemplo: palpitou 2x1 e resultado foi 2x1. Pontuação padrão: 10 pontos. É a forma mais alta de pontuação.

## 3.8 Pontuação — Acerto de Vencedor

O participante acertou qual time venceu (ou que houve empate) mas errou o placar. Subníveis configuráveis:

Acertou vencedor + diferença de gols: 7 pontos (ex: palpitou 3x1, resultado 2x0 — ambos mandante com +2).
Acertou vencedor + gols do vencedor: 5 pontos (ex: palpitou 2x0, resultado 2x1 — mandante fez 2).
Acertou apenas vencedor: 3 pontos (ex: palpitou 1x0, resultado 3x1 — ambos mandante).

## 3.9 Pontuação — Empate

Se o resultado foi empate e o participante também palpitou empate, mas com placar diferente: 2 pontos (padrão). Se acertou placar exato do empate: 10 pontos (mesma regra de placar exato).

## 3.10 Pontuação — Mata-Mata

Em jogos de mata-mata, além do placar, o participante pode indicar o classificado. Bônus por acertar o classificado: 5 pontos (adicionados à pontuação do placar). Se houve prorrogação e o participante acertou o vencedor no tempo normal mas errou o classificado (ex: palpitou classificação do mandante mas visitante passou nos pênaltis): recebe pontos do placar do tempo normal mas não recebe bônus de classificado. Se o organizador configurou que em mata-mata só vale acertar o classificado: toda a pontuação é baseada apenas em quem se classifica, com bônus por acerto de placar.

## 3.11 Partidas Canceladas

Se uma partida é cancelada antes de começar: todos os palpites daquela partida são anulados, nenhum ponto é distribuído nem descontado. O ranking é recalculado desconsiderando a partida. Notificação é enviada a todos os participantes.

## 3.12 WO (Walkover)

Se um time vence por W.O. (placar oficial geralmente 3x0 no futebol brasileiro): o resultado é registrado como 3x0. Palpites são apurados normalmente contra o placar de W.O. Se alguém palpitou 3x0 para o time vencedor, recebe pontuação de placar exato. **Alternativa configurável:** o organizador pode optar por anular a partida em caso de W.O., similar a partida cancelada.

## 3.13 Jogo Adiado

Se um jogo é adiado para nova data dentro do período do bolão: os palpites existentes são mantidos. O travamento é reajustado para o novo horário. Participantes que não haviam palpitado ganham nova janela para fazê-lo. Notificação é enviada sobre o adiamento.

Se o jogo é adiado para data fora do período do bolão: tratado como partida cancelada (anulada). O organizador pode decidir manualmente incluir ou excluir.

## 3.14 Bolão Sem Vencedor

**Regra geral:** se nenhum participante atender aos critérios de vitória ao término do bolão, ninguém ganha o prêmio. O valor total arrecadado fica retido pelo sistema (plataforma). Não há devolução aos participantes nesses casos.

**Critério de "nenhum vencedor":** configurado pelo organizador ao criar o bolão. Exemplos: ninguém acertou nenhum placar exato; ninguém atingiu pontuação mínima definida; nenhum participante completou todos os palpites obrigatórios. O padrão da plataforma é: há sempre um vencedor (maior pontuação, com desempate). O organizador pode ativar a opção "exigir critério mínimo para vencer" — se habilitada, e ninguém atingir o critério, o bolão encerra sem vencedor.

**Cenários que ativam o status FINALIZADO_SEM_VENCEDOR:**
- Todos os jogos foram disputados mas nenhum participante atingiu o critério mínimo de vitória configurado.
- O campeonato foi interrompido definitivamente por entidade externa.
- O bolão foi cancelado pelo organizador após início dos jogos (neste caso, aplicar regra de devolução proporcional da Seção 3.16 — única exceção onde há devolução).

**Destino do prêmio retido:** o valor fica registrado como receita da plataforma. O admin pode visualizar o saldo retido por bolão no painel financeiro.

**Comunicação:** todos os participantes são notificados com a mensagem "O bolão [nome] foi encerrado sem vencedor. O prêmio de R$ X não foi distribuído conforme as regras do bolão." Status final do bolão: FINALIZADO_SEM_VENCEDOR.

## 3.15 Divisão do Prêmio

O prêmio total é a soma de todas as taxas de entrada pagas. A divisão padrão é winner-takes-all (100% para o campeão). Divisões alternativas configuráveis: 1º lugar 70%, 2º lugar 20%, 3º lugar 10%; 1º lugar 60%, 2º lugar 25%, 3º lugar 15%; personalizada pelo organizador. Se a soma dos percentuais não der 100%, o sistema rejeita a configuração. O valor do prêmio já considera eventuais taxas da plataforma (ex: 5% de taxa administrativa — configurável, pode ser 0%).

## 3.16 Devolução Proporcional

Para bolão cancelado durante andamento:

```
percentual_restante = jogos_não_realizados / total_jogos_do_bolão
valor_devolver_por_participante = taxa_entrada * percentual_restante
```

Para bolão cancelado antes de qualquer jogo: devolução de 100%.

Taxas de processamento do provedor de pagamento podem ser descontadas ou absorvidas pela plataforma, conforme configuração.

## 3.17 Empate entre Usuários no Topo

Cadeia de desempate (nesta ordem, configurável):

1. Pontuação total (maior vence).
2. Número de acertos exatos (maior vence).
3. Número de acertos de vencedor (maior vence).
4. Menos erros totais (menor vence).
5. Palpite registrado primeiro — timestamp médio mais antigo (incentiva registrar palpites cedo).
6. Se após todos os critérios ainda houver empate: prêmio é dividido igualmente entre os empatados.

O organizador pode alterar a ordem desses critérios ou remover alguns.

## 3.18 Pagamento Estornado

Se um pagamento é estornado (chargeback ou disputa):

1. O status do pagamento muda para ESTORNADO.
2. O participante é imediatamente desativado (não pode mais registrar palpites).
3. Palpites já registrados permanecem no histórico mas são marcados como INVALIDADOS.
4. A pontuação do participante é zerada e o ranking é recalculado.
5. Notificação é enviada ao participante e ao organizador.
6. O participante não pode se reinscrever até regularizar a situação.
7. Registro completo na trilha de auditoria.

## 3.19 Usuário Inadimplente

Participante que aceitou o convite mas não pagou a taxa:

Após 48h sem pagamento: lembrete automático por e-mail.
Após expiração do link de pagamento: status muda para EXPIRADO.
Participante pode solicitar novo link de pagamento (se inscrições ainda estiverem abertas).
Se as inscrições fecharem e o participante ainda estiver inadimplente: é removido automaticamente do bolão.
Nunca recebe acesso a palpites.

## 3.20 Usuário Convidado que Não Finalizou Cadastro

O link de convite é acessível sem login. Se o visitante não tem conta, é direcionado para cadastro. Se abandona o cadastro, o sistema não cria nenhum registro de participação. O bolão não contabiliza o visitante como participante até que: tenha conta verificada E tenha aceitado o convite explicitamente. Nenhuma reserva de vaga é feita para cadastros incompletos.

---

# 4. PERFIS DE ACESSO

## 4.1 Super Admin

Perfil de mais alto nível, atribuído apenas ao(s) proprietário(s) da plataforma.

Permissões: acesso total a todas as funcionalidades; gerenciar configurações globais do sistema; criar e gerenciar admins do sistema; visualizar e gerenciar todos os bolões de todos os organizadores; acessar trilha de auditoria completa; gerenciar integrações externas (APIs, pagamentos); configurar taxas da plataforma; exportar dados completos; gerenciar políticas de compliance; ativar/desativar módulos (odds, integrações); gerenciar templates de regras; visualizar métricas de uso da plataforma.

## 4.2 Admin do Sistema

Perfil de suporte e operação, criado pelo super admin.

Permissões: visualizar e gerenciar todos os bolões; cadastrar e gerenciar times, campeonatos e partidas; registrar resultados; gerenciar pagamentos e devoluções; acessar trilha de auditoria; gerenciar usuários (ativar, desativar, resetar senha); visualizar relatórios; gerenciar notificações.

Restrições: não pode alterar configurações globais; não pode gerenciar outros admins; não pode acessar dados financeiros consolidados da plataforma (apenas por bolão); não pode ativar/desativar módulos.

## 4.3 Organizador do Bolão

É o criador do bolão. Automaticamente recebe este papel para os bolões que criou.

Permissões (apenas sobre seus bolões): criar, editar e cancelar bolões; gerar e revogar links de convite; aprovar ou rejeitar participantes; visualizar pagamentos dos seus bolões; registrar resultados (se habilitado pelo admin); enviar comunicados aos participantes; visualizar ranking e estatísticas; forçar recálculo de ranking (com justificativa); exportar relatórios do bolão; gerenciar regras do bolão.

Restrições: não pode acessar bolões de outros organizadores; não pode registrar resultados globalmente (apenas se o admin autorizar); não pode gerenciar dados do sistema (times, campeonatos etc.); não pode acessar trilha de auditoria de outros bolões.

## 4.4 Participante

Usuário verificado e ativo em pelo menos um bolão.

Permissões: visualizar bolões em que participa; registrar e editar palpites (dentro do prazo); acompanhar ranking; visualizar histórico de seus palpites e desempenho; acessar link de pagamento; gerenciar perfil; gerenciar preferências de notificação; visualizar odds comparativas (se módulo ativo); receber notificações.

Restrições: não pode acessar painel admin; não pode ver palpites de outros participantes antes do travamento; não pode editar palpites após travamento; não pode ver dados financeiros de outros participantes.

## 4.5 Convidado (Visitante)

Usuário não autenticado que acessou um link de convite.

Permissões: visualizar página pública do bolão (informações gerais, regras, número de participantes); criar conta.

Restrições: não pode ver ranking detalhado; não pode ver palpites; não pode interagir com o bolão; não pode ver informações financeiras.

## 4.6 Financeiro / Suporte

Perfil especializado para operações financeiras e atendimento.

Permissões: visualizar pagamentos de todos os bolões; processar devoluções (com aprovação de admin); reenviar links de pagamento; visualizar conciliação financeira; acessar relatórios financeiros; visualizar trilha de auditoria financeira; responder tickets de suporte (se existir módulo).

Restrições: não pode alterar resultados; não pode alterar palpites; não pode gerenciar bolões; não pode acessar dados de auditoria não financeiros.

---

# 5. ESTRUTURA DE TELAS

## 5.1 Landing Page

**Objetivo:** converter visitantes em usuários cadastrados. Apresentar o produto, seus diferenciais e como funciona.

**Componentes:** hero section com headline, subtítulo e CTA "Criar meu bolão"; seção "Como funciona" com 4 passos ilustrados (Crie, Convide, Palpite, Ganhe); seção de diferenciais com ícones; seção de depoimentos/prova social; seção de FAQ; footer com links institucionais, termos e política de privacidade.

**Comportamento responsivo:** hero com imagem adaptativa, seções empilhadas em mobile, CTA fixo no rodapé em mobile.

## 5.2 Login

**Objetivo:** autenticar o usuário existente.

**Componentes:** formulário com campos e-mail e senha; botão "Entrar"; link "Esqueceu sua senha?"; link "Criar conta"; divider "ou" para login social futuro.

**Validações:** e-mail com formato válido, senha não vazia. **Mensagens de erro:** "E-mail ou senha incorretos" (genérica para segurança), "Conta não verificada — verifique seu e-mail", "Conta bloqueada temporariamente — tente novamente em X minutos".

**Estado vazio:** N/A. **Responsivo:** formulário centralizado, full-width em mobile.

## 5.3 Cadastro

**Objetivo:** criar nova conta de usuário.

**Fluxo em 2 etapas:**

*Etapa 1 — Conta:* formulário com nome completo, e-mail, senha, confirmação de senha; checkbox de aceite dos termos de uso e política de privacidade; botão "Continuar"; link "Já tem conta? Faça login".

*Etapa 2 — Dados de recebimento:* campo de chave PIX com máscara inteligente (detecta automaticamente o tipo enquanto o usuário digita: CPF, CNPJ, e-mail, telefone ou chave aleatória); label de ajuda: "Sua chave PIX é usada para receber prêmios. Você pode alterar depois no Perfil."; badge de tipo detectado exibido em tempo real (ex: "CPF detectado ✓", "E-mail detectado ✓"); botão "Criar conta". Campo PIX é **obrigatório** — sem ele o cadastro não pode ser concluído. Exibir aviso claro: "Sem chave PIX não é possível receber prêmios."

**Validações:** nome mínimo 3 caracteres; e-mail formato válido; senha com requisitos exibidos em tempo real (indicadores visuais de força); confirmação de senha deve coincidir; aceite dos termos obrigatório; chave PIX: se CPF → valida dígitos verificadores; se e-mail → valida formato; se telefone → valida formato brasileiro (+55 11 9xxxx-xxxx); se chave aleatória → valida formato UUID. **Mensagens de erro:** "Este e-mail já está cadastrado", "As senhas não coincidem", "Senha não atende os requisitos mínimos", "Chave PIX inválida — verifique o formato".

**Responsivo:** formulário centralizado, full-width em mobile. Stepper visual no topo indicando etapa 1/2.

## 5.4 Recuperação de Senha

**Objetivo:** permitir reset de senha via e-mail.

**Componentes:** campo e-mail; botão "Enviar link de recuperação"; tela de confirmação "E-mail enviado"; tela de nova senha (ao clicar no link do e-mail) com campos nova senha e confirmação.

**Validações:** e-mail formato válido; nova senha com requisitos. **Mensagens:** "Se este e-mail estiver cadastrado, você receberá um link" (mensagem genérica para segurança), "Link expirado — solicite um novo", "Senha alterada com sucesso".

## 5.5 Dashboard do Usuário

**Objetivo:** visão geral do participante. Ponto de entrada principal após login.

**Componentes:** saudação personalizada ("Olá, Bruno!"); resumo de bolões ativos (cards com nome, campeonato, sua posição no ranking, próximo jogo, status do pagamento); alerta de palpites pendentes (jogos que travam em breve sem palpite registrado); widget de próximos jogos (lista dos próximos 5 jogos dos bolões ativos); widget de resultados recentes (últimos 5 resultados com indicação se acertou ou errou); widget de ranking resumido (sua posição e top 3 em cada bolão); widget de notificações recentes (últimas 5).

**Estado vazio:** "Você ainda não participa de nenhum bolão. Crie um ou peça um convite!" com botão "Criar bolão" e campo para inserir código de convite.

**Responsivo:** cards empilhados em mobile, widgets em coluna única.

## 5.6 Meus Bolões

**Objetivo:** listar todos os bolões do usuário com filtros.

**Componentes:** abas "Participando" / "Organizando"; filtros por status (ativo, finalizado, cancelado); lista de cards com: nome, campeonato, sua posição, total de participantes, próximo jogo ou resultado final, badge de status (ativo/finalizado/cancelado); botão "Criar bolão" (destaque).

**Estado vazio:** "Nenhum bolão encontrado para este filtro."

**Responsivo:** lista vertical em mobile, 2 colunas em tablet, 3 em desktop.

## 5.7 Detalhes do Bolão

**Objetivo:** visão completa de um bolão específico.

**Componentes:** header com nome, campeonato, badge de status; abas: Palpites, Ranking, Jogos, Participantes, Regras, Pagamento; informações do bolão: organizador, data de criação, taxa de entrada, total do prêmio, número de participantes, formato de pontuação; se o usuário não está inscrito: botão "Participar" e informações sobre o bolão; se está inscrito com pagamento pendente: alerta com link de pagamento; se está ativo: acesso direto à aba de palpites.

**Responsivo:** abas viram swipeable em mobile.

## 5.8 Tela de Palpites

**Objetivo:** registrar palpites para os jogos da rodada.

**Componentes:** seletor de rodada (dropdown ou swipe); lista de jogos da rodada, cada um com: escudo + nome do mandante, campo numérico de gols mandante, "x", campo numérico de gols visitante, escudo + nome do visitante, data/horário do jogo, timer de contagem regressiva até travamento, status: "Aberto para palpites" / "Palpite travado" / "Em andamento" / "Finalizado"; em partidas finalizadas: exibir resultado real + pontuação obtida + badge (acertou/errou); em mata-mata: seletor de "classificado" abaixo do placar; botão "Salvar palpites" com feedback de sucesso; auto-save com debounce de 2 segundos (salva automaticamente ao parar de digitar).

**Validações:** somente números >= 0; somente se pagamento confirmado; somente antes do travamento. **Mensagens de erro:** "Palpites travados para esta partida", "Efetue o pagamento para desbloquear seus palpites". **Feedback:** toast de "Palpites salvos!" com animação sutil.

**Responsivo:** lista vertical full-width em mobile, campos de palpite com stepper (+/-) em mobile.

## 5.9 Ranking

**Objetivo:** exibir classificação completa do bolão.

**Componentes:** tabela com colunas: posição, variação (seta verde/vermelha/traço), avatar, nome, pontos, acertos exatos, acertos de vencedor, erros; destaque no líder (fundo dourado, ícone de coroa); destaque no top 3 (badge prata/bronze); destaque na posição do usuário logado (linha em azul); se bolão finalizado: pódio visual no topo com 1º, 2º e 3º; filtro por rodada (ranking parcial até aquela rodada); indicador de quem está na zona de premiação.

**Estado vazio:** "O ranking será exibido após o primeiro jogo ser finalizado."

**Responsivo:** tabela com scroll horizontal em mobile ou layout card-based para cada participante.

## 5.10 Pagamentos

**Objetivo:** gerenciar pagamento do bolão para o participante.

**Componentes:** status atual do pagamento (badge visual); valor da taxa; data do pagamento (se pago); botão "Pagar agora" (se pendente) que redireciona para link externo ou abre modal com QR code PIX; histórico de pagamentos (se houver devoluções); comprovante (se disponível via API do provedor).

**Responsivo:** layout simples, single column.

## 5.11 Carteira / Extrato

**Objetivo:** visão financeira consolidada do usuário na plataforma.

**Componentes:** saldo disponível (prêmios recebidos - saques); histórico de transações: pagamentos de taxas (saída), prêmios recebidos (entrada), devoluções (entrada), saques (saída); filtros por tipo, período e bolão; botão "Solicitar saque" (envia para PIX cadastrado).

**Estado vazio:** "Nenhuma transação registrada."

**Responsivo:** lista vertical com cards de transação.

## 5.12 Notificações

**Objetivo:** centro de notificações in-app.

**Componentes:** lista de notificações ordenada por data (mais recente primeiro); cada notificação: ícone do tipo, título, mensagem resumida, data/hora, status lido/não lido; badge de contagem de não lidas no header; "Marcar todas como lidas"; filtro por tipo.

**Estado vazio:** "Nenhuma notificação por enquanto."

**Responsivo:** lista vertical full-width.

## 5.13 Perfil

**Objetivo:** gerenciar dados pessoais e preferências.

**Componentes:** seção de dados pessoais (nome, e-mail exibido como readonly, telefone, avatar com upload, data de nascimento); seção financeira — "Dados para recebimento de prêmios": campo chave PIX com máscara inteligente que detecta tipo em tempo real (CPF, CNPJ, e-mail, telefone, chave aleatória), badge do tipo detectado, validação inline, alerta em vermelho se PIX não está cadastrado ("⚠️ Cadastre sua chave PIX para poder receber prêmios"), botão "Salvar chave PIX" separado do restante do formulário; seção de estatísticas (resumo do desempenho global); seção de preferências (notificações por tipo, modo escuro); seção de segurança (alterar senha, futuramente 2FA); botão "Excluir minha conta" (com confirmação dupla e aviso sobre dados).

**Validações:** nome mínimo 3 caracteres, telefone formato brasileiro, avatar max 2MB. **Responsivo:** formulários full-width em mobile.

## 5.14 Painel Admin — Dashboard

**Objetivo:** visão geral para o administrador.

**Componentes:** KPIs: total de usuários, bolões ativos, bolões finalizados, pagamentos recebidos (R$), devoluções pendentes; gráfico de adesão (novos usuários por semana); gráfico de pagamentos (entradas por mês); alertas: pagamentos estornados, integrações com erro, partidas sem resultado há mais de 24h; atalhos rápidos: cadastrar partida, registrar resultado, gerenciar bolão.

## 5.15 Cadastro de Equipes (Admin)

**Objetivo:** gerenciar catálogo de times.

**Componentes:** tabela com: nome, abreviação, escudo (thumbnail), país, ações; busca por nome; filtro por país; botão "Novo time" abre modal com formulário; botão "Importar da API" (se integração ativa); edição inline ou via modal.

**Validações:** nome obrigatório e único por país, abreviação max 3 caracteres. **Estado vazio:** "Nenhum time cadastrado. Comece adicionando ou importando."

## 5.16 Cadastro de Campeonatos (Admin)

**Objetivo:** gerenciar campeonatos.

**Componentes:** tabela com: nome, temporada, tipo, status, ações; botão "Novo campeonato" abre formulário; formulário com campos da Seção 2.8; lista de rodadas vinculadas com opção de criar/editar; botão "Importar campeonato da API".

## 5.17 Cadastro de Partidas (Admin)

**Objetivo:** gerenciar jogos dentro de campeonatos/rodadas.

**Componentes:** filtro por campeonato e rodada; tabela com: mandante, visitante, data/hora, status, placar, ações; botão "Nova partida" abre formulário; campos: campeonato (select), rodada (select), mandante (select com busca), visitante (select com busca), data/hora (datetime picker com fuso), estádio; botão "Importar partidas da API".

**Validações:** mandante ≠ visitante, data no futuro (ao cadastrar), campeonato e rodada obrigatórios.

## 5.18 Gestão de Resultados (Admin)

**Objetivo:** registrar e gerenciar placares finais.

**Componentes:** filtro por campeonato, rodada e status; lista de partidas com: mandante x visitante, data, status, placar (campos editáveis se FINALIZADA); botão "Registrar resultado" por partida; botão "Importar resultados da API"; indicador de "Resultado importado automaticamente" vs "Resultado manual"; botão "Reprocessar ranking" por rodada; confirmação antes de salvar resultado.

## 5.19 Gestão Financeira (Admin)

**Objetivo:** controle de pagamentos e devoluções.

**Componentes:** filtro por bolão, status, período; tabela de pagamentos: participante, bolão, valor, método, status, data, ações; resumo: total recebido, total pendente, total devolvido; botão "Reenviar link de pagamento"; botão "Processar devolução" (individual ou em lote); conciliação: comparação entre registros internos e webhook recebidos; alertas de divergências.

## 5.19b Apuração de Ganhadores e Pagamento (Admin — dentro do bolão)

**Objetivo:** permitir ao admin identificar os ganhadores de um bolão encerrado e executar o pagamento com agilidade, usando o PIX cadastrado de cada ganhador.

**Acesso:** disponível na área interna do bolão (Admin → Bolões → [nome do bolão] → aba "Apuração & Pagamento"). Somente visível após o bolão entrar em status FINALIZADO ou FINALIZADO_SEM_VENCEDOR.

**Componentes da tela:**

*Cabeçalho do bolão:* nome, campeonato, total arrecadado (R$), taxa da plataforma (R$), **prêmio líquido a distribuir (R$)** em destaque.

*Status de encerramento:* badge visual — "Com vencedor(es)" (verde) ou "Sem vencedor — prêmio retido" (cinza).

*Tabela de ganhadores* (exibida apenas se houver vencedores):

| # | Nome | Pontuação | Acertos Exatos | Prêmio a Receber | Chave PIX | Tipo PIX | Ação |
|---|------|-----------|----------------|-----------------|-----------|----------|------|
| 1 | João Silva | 87 pts | 5 | R$ 350,00 | joao@email.com | E-mail | [Copiar PIX] |
| 2 | Maria Costa | 87 pts | 5 | R$ 350,00 | 123.456.789-00 | CPF | [Copiar PIX] |

- Se o ganhador não tiver PIX cadastrado: exibe badge "PIX não cadastrado" em vermelho com tooltip "Solicite ao participante que cadastre o PIX no perfil antes de efetuar o pagamento."
- Botão **[Copiar PIX]**: copia a chave PIX para a área de transferência com feedback visual ("Copiado!").
- Linha de total: "Total a pagar: R$ 700,00 para 2 ganhadores."

*Painel de divisão do prêmio:* resumo automático mostrando como o prêmio foi calculado — ex: "R$ 1.000 arrecadados − R$ 50 taxa da plataforma (5%) = R$ 950 distribuíveis. Divididos entre 2 ganhadores: R$ 475 cada."

*Confirmação de pagamento manual:* para cada ganhador, botão **"Marcar como pago"** (com confirmação). Após clicar: status muda para "Pago ✓" + campo de observação opcional (ex: "Transferência efetuada em 31/03/2026"). Registro de auditoria é gerado automaticamente.

*Histórico de pagamentos* da apuração: lista de todas as marcações "Pago" com timestamp, usuário admin que confirmou e valor.

**Fluxo do admin:**
1. Admin acessa o bolão finalizado → aba "Apuração & Pagamento".
2. Sistema exibe automaticamente os ganhadores com pontuação, valor a receber e chave PIX.
3. Admin clica em [Copiar PIX] do ganhador → abre o app bancário → cola a chave → informa o valor exibido → confirma a transferência.
4. Admin retorna e clica "Marcar como pago" — o sistema registra a confirmação com auditoria.
5. Ganhador recebe notificação: "Seu prêmio de R$ X foi enviado! Confira seu PIX."

**Validações e alertas:**
- Alerta se algum ganhador não tem PIX cadastrado.
- Alerta se o bolão foi dividido (múltiplos ganhadores) — exibe mensagem clara: "Este bolão teve [N] ganhadores com pontuação igual. O prêmio foi dividido igualmente."
- Alerta se total dos valores a pagar ≠ prêmio líquido disponível (erro de cálculo — aciona revisão manual).

## 5.20 Relatórios (Admin)

**Objetivo:** exportação e visualização de relatórios.

**Componentes:** seletor de tipo de relatório (participantes, pagamentos, inadimplentes, desempenho, ranking, devoluções); filtros (bolão, campeonato, período); preview em tabela; botão "Exportar CSV" e "Exportar PDF".

## 5.21 Auditoria (Admin)

**Objetivo:** trilha de auditoria para compliance e transparência.

**Componentes:** tabela com: data/hora, usuário, ação, entidade, resumo da mudança; filtros por tipo de ação, usuário, entidade, período; expansão para ver diff completo (antes/depois em JSON formatado); export para CSV.

## 5.22 Configurações Gerais (Super Admin)

**Objetivo:** configurações globais da plataforma.

**Componentes:** seção de pagamentos: provedor ativo, credenciais (mascaradas), taxa da plataforma (%); seção de integrações: API esportiva (status, última sync, erros recentes); seção de compliance: módulos ativados/desativados (odds, pagamento, etc.); seção de notificações: provedor de e-mail, templates; seção de segurança: rate limiting, bloqueio de IPs, política de senha.

---

# 6. UX/UI — DIREÇÃO DE DESIGN

## 6.1 Identidade Visual

O Bolão Pro segue uma estética esportiva sofisticada, inspirada em plataformas premium de estatísticas esportivas (como SofaScore, FotMob, ESPN+) combinada com a limpeza de fintechs modernas (Nubank, Mercado Pago).

**Paleta de Cores:**

Fundo principal (dark mode): `#0A0F1C` (azul escuro profundo).
Superfície de cards: `#111827` (cinza-azulado escuro).
Borda sutil: `#1F2937`.
Texto primário: `#F9FAFB` (branco suave).
Texto secundário: `#9CA3AF` (cinza médio).
Accent principal: `#10B981` (verde esmeralda — vitória, sucesso, ação principal).
Accent secundário: `#3B82F6` (azul — informação, link, destaque neutro).
Perigo/Erro: `#EF4444` (vermelho).
Aviso: `#F59E0B` (âmbar).
Ouro (campeão/líder): `#FBBF24`.
Prata (2º lugar): `#94A3B8`.
Bronze (3º lugar): `#D97706`.

**Modo Claro:** fundo `#F9FAFB`, cards `#FFFFFF`, bordas `#E5E7EB`, texto `#111827`. Toggle no header.

**Tipografia:** Inter para texto geral (sans-serif moderna, excelente legibilidade). JetBrains Mono para números em tabelas de ranking e placares (monospace, facilita leitura de números alinhados). Font sizes: body 14px, small 12px, heading 1 28px, heading 2 22px, heading 3 18px.

## 6.2 Componentes Visuais Essenciais

**Badges de Status:**

"Ganhou" — fundo verde (`#10B981`) com ícone de check, texto branco.
"Perdeu" — fundo vermelho (`#EF4444`) com ícone de X, texto branco.
"Pendente" — fundo âmbar (`#F59E0B`) com ícone de relógio, texto escuro.
"Aguardando Resultado" — borda azul pontilhada, texto azul.
"Palpite Travado" — fundo cinza com ícone de cadeado.
"Eliminado" — fundo vermelho escuro, texto com opacidade reduzida.
"Classificado" — fundo verde com ícone de seta para cima.
"Campeão" — fundo gradiente dourado com ícone de troféu.
"Pagamento Pendente" — badge pulsante amarelo.
"Pagamento Confirmado" — badge verde estático.
"Devolução em Processamento" — badge azul com spinner.
"Devolução Concluída" — badge verde com ícone de check duplo.

**Cards de Bolão:** com gradiente sutil na borda superior (cor do campeonato), nome, campeonato, badge de status, posição no ranking com variação, próximo jogo ou resultado final, barra de progresso (rodadas completadas / total).

**Tabela de Ranking:** linhas zebradas, hover com highlight, posição do usuário logado sempre visível (sticky se rolar), coroa no 1º lugar, ícones de variação (triângulo verde para subiu, vermelho para desceu, traço para manteve), tooltip no nome mostrando estatísticas resumidas.

**Card de Jogo/Palpite:** layout horizontal com escudos dos times, nome abreviado, campo de placar centralizados, timer de contagem regressiva com cor que muda (verde > 1h, âmbar < 1h, vermelho < 15min, cinza = travado), animação sutil ao salvar palpite (pulse no card).

## 6.3 Microinterações

Ao salvar palpite: card faz pulse sutil + toast "Palpite salvo" com checkmark animado.
Ao receber resultado: card do jogo transiciona de "Aguardando" para "Ganhou" ou "Perdeu" com animação de flip.
Ao subir no ranking: seta verde com bounce animation.
Ao ser declarado campeão: tela especial com confetti animation + troféu animado.
Hover em qualquer badge: tooltip com explicação do status.
Loading states: skeletons animados (shimmer) em vez de spinners genéricos.
Pull-to-refresh em mobile.
Scroll suave com lazy loading em listas longas.

## 6.4 Tela do Campeão

Tela full-screen que aparece quando o bolão é finalizado. Fundo com gradiente escuro + partículas douradas (tipo confetti digital). Troféu dourado animado (SVG ou Lottie) centralizado. Nome e avatar do campeão em destaque. Pontuação final e estatísticas (acertos exatos, acertos de vencedor). Pódio visual com 1º, 2º e 3º. Mensagem "Parabéns, [nome]! Você é o campeão do [nome do bolão]!" Valor do prêmio em destaque. Botão "Compartilhar" gerando imagem para redes sociais. Botão "Ver ranking completo".

## 6.5 Tela de Rateio/Devolução (Sem Campeão)

Tela com tom sóbrio e elegante. Ícone de balança (equilíbrio) em destaque. Mensagem "O bolão [nome] foi encerrado sem um vencedor definido." Tabela de devolução: nome, valor pago, valor devolvido, método de devolução, status. Barra de progresso das devoluções (X de Y processadas). Mensagem de rodapé: "Valores serão processados em até X dias úteis."

## 6.6 Responsividade

**Breakpoints:** mobile 0-639px, tablet 640-1023px, desktop 1024px+.

**Mobile:** navegação bottom tab bar (Dashboard, Bolões, Palpites, Ranking, Perfil). Cards full-width empilhados. Tabelas viram cards ou ganham scroll horizontal. Ações principais ficam fixas no rodapé.

**Tablet:** sidebar colapsável. Grid de 2 colunas para cards. Tabelas mantêm formato mas com tamanho reduzido.

**Desktop:** sidebar fixa expandida. Grid de 3-4 colunas para cards. Tabelas completas. Dashboard com layout de grid complexo (KPIs no topo, gráficos ao lado).

---

# 7. ARQUITETURA TÉCNICA RECOMENDADA

## 7.1 Stack Recomendada e Justificativas

### Frontend: Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui

**Justificativa:** Next.js App Router permite SSR, SSG e ISR para performance ideal. TypeScript garante type safety de ponta a ponta (compartilhamento de tipos com backend). Tailwind CSS com shadcn/ui oferece componentes acessíveis e customizáveis prontos para produção, reduzindo drasticamente o tempo de desenvolvimento de UI sem sacrificar qualidade. A comunidade é vasta e o ecossistema maduro.

### Backend: NestJS + TypeScript

**Justificativa:** NestJS foi escolhido em vez de FastAPI pelos seguintes motivos:

1. **TypeScript end-to-end:** compartilhar interfaces, enums e validações entre front e back sem transpilação entre linguagens.
2. **Ecossistema Node.js:** Prisma ORM tem suporte first-class em TypeScript. BullMQ (filas) é nativo Node.js. Integração com Vercel e Railway é trivial.
3. **Arquitetura modular:** NestJS impõe arquitetura modular (modules, controllers, services, guards, interceptors, pipes) que escala bem para sistemas complexos.
4. **Guards e Decorators:** sistema de guards para autorização (RBAC) e decorators custom para validação são muito expressivos.
5. **WebSocket nativo:** suporte a WebSocket via `@nestjs/websockets` para atualizações em tempo real de ranking e resultados.
6. **Swagger automático:** decorators `@ApiProperty()` geram documentação OpenAPI automaticamente.

FastAPI seria excelente para um backend mais focado em dados/ML, mas para este sistema CRUD-intensivo com lógica de negócio complexa e necessidade de tempo real, NestJS em TypeScript é a escolha superior.

### Banco de Dados: PostgreSQL 16

**Justificativa:** robustez, ACID compliance, JSON support para regras flexíveis, extensões poderosas (pg_cron para jobs, pg_trgm para busca fuzzy), excelente suporte a índices complexos, CTEs recursivas para ranking, views materializadas para relatórios.

### ORM: Prisma

**Justificativa:** schema declarativo legível, migrations automáticas, type safety total em TypeScript, Prisma Studio para exploração visual, boa performance para CRUD. Para queries complexas de ranking e relatórios, Prisma permite raw queries quando necessário.

### Autenticação: JWT + Refresh Token + E-mail Verification

Access token JWT com payload mínimo (userId, roles). Validade: 15 minutos. Refresh token opaco (UUID), armazenado no banco com index, rotativo (novo a cada uso). Validade: 7 dias. E-mail de verificação com token aleatório, validade 24h. Password hashing com bcrypt (salt rounds: 12). Tokens de recuperação de senha: uso único, validade 1h.

### Filas: Redis + BullMQ

Para processamento assíncrono de: recálculo de ranking após resultado, envio de notificações (e-mail, push), processamento de devoluções, sync com API esportiva, geração de relatórios pesados. Redis também serve como cache layer.

### Cache: Redis

Cache de ranking (invalidado após resultado), cache de dados de times e campeonatos (TTL longo), cache de sessões de API esportiva, rate limiting counters.

### Observabilidade

**Logs:** Pino (structured JSON logging) com integração com serviço de log (ex: Datadog, Grafana Loki, ou Axiom).
**Métricas:** Prometheus-compatible metrics via `@willsoto/nestjs-prometheus`.
**APM:** Sentry para error tracking e performance monitoring.
**Healthchecks:** endpoints `/health` e `/ready` para cada serviço.

### Deploy

**Frontend:** Vercel (otimizado para Next.js, preview deploys, edge functions).
**Backend:** Railway ou Render (containers Docker, auto-scaling, PostgreSQL gerenciado, Redis gerenciado).
**Alternativa robusta:** AWS ECS Fargate + RDS + ElastiCache (para escala maior).
**CI/CD:** GitHub Actions com pipelines de lint, test, build, deploy. Ambientes: development (branch develop), staging (branch staging), production (branch main).

## 7.2 Diagrama de Arquitetura (Textual)

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTE                                │
│  Next.js App (Vercel)  ←→  shadcn/ui + Tailwind              │
│  SSR/CSR + React Query (TanStack)                             │
└──────────┬───────────────────────────────────────────────────┘
           │ HTTPS (REST + WebSocket)
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    API GATEWAY / BACKEND                       │
│  NestJS (TypeScript)                                          │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│  │  Auth    │ │  Bolões  │ │ Palpites  │ │  Pagamentos    │  │
│  │  Module  │ │  Module  │ │  Module   │ │  Module        │  │
│  └─────────┘ └──────────┘ └───────────┘ └────────────────┘  │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ Ranking │ │  Sports  │ │   Odds    │ │  Notification  │  │
│  │ Module  │ │  Data    │ │  Module   │ │  Module        │  │
│  └─────────┘ └──────────┘ └───────────┘ └────────────────┘  │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐                     │
│  │ Audit   │ │  Admin   │ │  Reports  │                     │
│  │ Module  │ │  Module  │ │  Module   │                     │
│  └─────────┘ └──────────┘ └───────────┘                     │
└──────────┬──────────────────────┬────────────────────────────┘
           │                      │
     ┌─────▼─────┐         ┌─────▼─────┐
     │ PostgreSQL │         │   Redis   │
     │  (Prisma)  │         │ (Cache +  │
     │            │         │  BullMQ)  │
     └────────────┘         └───────────┘
           │
           │ (Jobs assíncronos via BullMQ)
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    SERVIÇOS EXTERNOS                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Mercado Pago │  │ API Futebol  │  │   SendGrid /     │   │
│  │ (Pagamento)  │  │ (API-Sports) │  │   Amazon SES     │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │  Sentry      │  │  Odds API    │                          │
│  │  (Errors)    │  │  (Opcional)  │                          │
│  └──────────────┘  └──────────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

## 7.3 Estrutura de Pastas — Backend (NestJS)

```
server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── api-paginated.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── throttle.guard.ts
│   │   ├── interceptors/
│   │   │   ├── audit.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   └── utils/
│   │       ├── hash.util.ts
│   │       ├── token.util.ts
│   │       └── date.util.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── refresh.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── register.dto.ts
│   │   │       └── reset-password.dto.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   ├── pools/
│   │   │   ├── pools.module.ts
│   │   │   ├── pools.controller.ts
│   │   │   ├── pools.service.ts
│   │   │   ├── pool-members.service.ts
│   │   │   ├── pool-rules.service.ts
│   │   │   └── dto/
│   │   ├── predictions/
│   │   │   ├── predictions.module.ts
│   │   │   ├── predictions.controller.ts
│   │   │   ├── predictions.service.ts
│   │   │   └── dto/
│   │   ├── sports/
│   │   │   ├── sports.module.ts
│   │   │   ├── teams.controller.ts
│   │   │   ├── teams.service.ts
│   │   │   ├── championships.controller.ts
│   │   │   ├── championships.service.ts
│   │   │   ├── matches.controller.ts
│   │   │   ├── matches.service.ts
│   │   │   ├── results.controller.ts
│   │   │   ├── results.service.ts
│   │   │   └── dto/
│   │   ├── rankings/
│   │   │   ├── rankings.module.ts
│   │   │   ├── rankings.controller.ts
│   │   │   ├── rankings.service.ts
│   │   │   ├── scoring.engine.ts
│   │   │   └── tiebreaker.engine.ts
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── webhooks.controller.ts
│   │   │   ├── refunds.service.ts
│   │   │   ├── providers/
│   │   │   │   ├── payment-provider.interface.ts
│   │   │   │   ├── mercadopago.provider.ts
│   │   │   │   └── asaas.provider.ts
│   │   │   └── dto/
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── templates/
│   │   ├── odds/
│   │   │   ├── odds.module.ts
│   │   │   ├── odds.controller.ts
│   │   │   ├── odds.service.ts
│   │   │   └── dto/
│   │   ├── audit/
│   │   │   ├── audit.module.ts
│   │   │   ├── audit.service.ts
│   │   │   └── audit.controller.ts
│   │   ├── reports/
│   │   │   ├── reports.module.ts
│   │   │   ├── reports.controller.ts
│   │   │   └── reports.service.ts
│   │   └── admin/
│   │       ├── admin.module.ts
│   │       ├── admin.controller.ts
│   │       └── admin.service.ts
│   ├── jobs/
│   │   ├── sports-sync.job.ts
│   │   ├── ranking-recalc.job.ts
│   │   ├── payment-expiry.job.ts
│   │   ├── notification.job.ts
│   │   └── odds-sync.job.ts
│   └── config/
│       ├── database.config.ts
│       ├── redis.config.ts
│       ├── auth.config.ts
│       ├── payment.config.ts
│       └── sports-api.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── tsconfig.json
└── package.json
```

## 7.4 Estrutura de Pastas — Frontend (Next.js)

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                          # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/[token]/page.tsx
│   │   │   └── verify-email/[token]/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                    # Sidebar + header
│   │   │   ├── page.tsx                      # Dashboard principal
│   │   │   ├── pools/
│   │   │   │   ├── page.tsx                  # Meus bolões
│   │   │   │   ├── new/page.tsx              # Criar bolão
│   │   │   │   └── [poolId]/
│   │   │   │       ├── page.tsx              # Detalhes do bolão
│   │   │   │       ├── predictions/page.tsx  # Palpites
│   │   │   │       ├── ranking/page.tsx      # Ranking
│   │   │   │       ├── participants/page.tsx
│   │   │   │       └── payments/page.tsx
│   │   │   ├── wallet/page.tsx               # Carteira
│   │   │   ├── notifications/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                      # Dashboard admin
│   │   │   ├── teams/page.tsx
│   │   │   ├── championships/page.tsx
│   │   │   ├── matches/page.tsx
│   │   │   ├── results/page.tsx
│   │   │   ├── finance/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── audit/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── invite/[code]/page.tsx            # Convite público
│   │   └── champion/[poolId]/page.tsx        # Tela do campeão
│   ├── components/
│   │   ├── ui/                               # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── footer.tsx
│   │   ├── pools/
│   │   │   ├── pool-card.tsx
│   │   │   ├── pool-form.tsx
│   │   │   └── pool-rules-config.tsx
│   │   ├── predictions/
│   │   │   ├── match-prediction-card.tsx
│   │   │   └── prediction-status-badge.tsx
│   │   ├── ranking/
│   │   │   ├── ranking-table.tsx
│   │   │   ├── podium.tsx
│   │   │   └── position-change-indicator.tsx
│   │   ├── payments/
│   │   │   ├── payment-status-badge.tsx
│   │   │   └── payment-card.tsx
│   │   ├── matches/
│   │   │   ├── match-card.tsx
│   │   │   ├── match-timer.tsx
│   │   │   └── score-input.tsx
│   │   ├── champion/
│   │   │   ├── champion-screen.tsx
│   │   │   ├── confetti.tsx
│   │   │   └── trophy-animation.tsx
│   │   └── shared/
│   │       ├── status-badge.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-skeleton.tsx
│   │       └── data-table.tsx
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-pool.ts
│   │   ├── use-predictions.ts
│   │   ├── use-ranking.ts
│   │   ├── use-payments.ts
│   │   ├── use-notifications.ts
│   │   └── use-countdown.ts
│   ├── lib/
│   │   ├── api.ts                            # Axios/fetch config
│   │   ├── auth.ts                           # Token management
│   │   ├── utils.ts
│   │   ├── validations.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── pool.ts
│   │   ├── prediction.ts
│   │   ├── match.ts
│   │   ├── payment.ts
│   │   ├── user.ts
│   │   └── api.ts
│   └── styles/
│       └── globals.css
├── public/
│   ├── images/
│   └── icons/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

# 8. MODELO DE BANCO DE DADOS

## 8.1 Schema Prisma Completo

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// ENUMS
// ==========================================

enum UserRole {
  SUPER_ADMIN
  ADMIN
  ORGANIZER
  PARTICIPANT
  FINANCE
}

enum UserStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
  DELETED
}

enum PoolStatus {
  DRAFT
  OPEN
  IN_PROGRESS
  FINISHED
  FINISHED_NO_WINNER
  CANCELLED
}

enum PoolMemberStatus {
  INVITED
  PENDING_PAYMENT
  ACTIVE
  SUSPENDED
  REMOVED
  ELIMINATED
}

enum MatchStatus {
  SCHEDULED
  LIVE
  HALF_TIME
  FINISHED
  POSTPONED
  CANCELLED
  WALKOVER
}

enum PredictionStatus {
  OPEN
  LOCKED
  SCORED
  INVALIDATED
}

enum PaymentStatus {
  PENDING
  PROCESSING
  PAID
  EXPIRED
  CANCELLED
  REFUNDED
  CHARGEDBACK
}

enum PaymentMethod {
  PIX
  CREDIT_CARD
  BOLETO
}

enum RefundStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum NotificationType {
  POOL_INVITE
  PAYMENT_PENDING
  PAYMENT_CONFIRMED
  PREDICTION_CONFIRMED
  PREDICTION_DEADLINE
  MATCH_RESULT
  YOU_WON
  YOU_LOST
  RANKING_UPDATED
  CHAMPION_DECLARED
  REFUND_AVAILABLE
  POOL_CANCELLED
  ORGANIZER_MESSAGE
}

enum ChampionshipType {
  LEAGUE
  CUP
  MIXED
}

enum ChampionshipStatus {
  PLANNED
  IN_PROGRESS
  FINISHED
  CANCELLED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  PAYMENT_RECEIVED
  PAYMENT_REFUNDED
  PAYMENT_CHARGEDBACK
  PREDICTION_LOCKED
  RESULT_REGISTERED
  RANKING_RECALCULATED
  CHAMPION_DECLARED
  POOL_CANCELLED
  MEMBER_REMOVED
  SETTINGS_CHANGED
}

// ==========================================
// USERS & AUTH
// ==========================================

model User {
  id                    String          @id @default(uuid())
  email                 String          @unique
  passwordHash          String          @map("password_hash")
  emailVerified         Boolean         @default(false) @map("email_verified")
  emailVerificationToken String?        @unique @map("email_verification_token")
  emailVerificationExpiry DateTime?     @map("email_verification_expiry")
  passwordResetToken    String?         @unique @map("password_reset_token")
  passwordResetExpiry   DateTime?       @map("password_reset_expiry")
  status                UserStatus      @default(PENDING_VERIFICATION)
  role                  UserRole        @default(PARTICIPANT)
  createdAt             DateTime        @default(now()) @map("created_at")
  updatedAt             DateTime        @updatedAt @map("updated_at")
  deletedAt             DateTime?       @map("deleted_at")

  profile               Profile?
  refreshTokens         RefreshToken[]
  poolsOrganized        Pool[]          @relation("PoolOrganizer")
  poolMemberships       PoolMember[]
  predictions           Prediction[]
  payments              Payment[]
  notifications         Notification[]
  auditLogs             AuditLog[]      @relation("AuditUser")

  @@index([email])
  @@index([status])
  @@map("users")
}

model Profile {
  id          String    @id @default(uuid())
  userId      String    @unique @map("user_id")
  fullName    String    @map("full_name")
  phone       String?
  avatarUrl   String?   @map("avatar_url")
  birthDate   DateTime? @map("birth_date")
  pixKey      String?   @map("pix_key")
  pixKeyType  String?   @map("pix_key_type")
  cpf         String?   // Encrypted at application level
  timezone    String    @default("America/Sao_Paulo")
  darkMode    Boolean   @default(true) @map("dark_mode")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

model RefreshToken {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  token       String    @unique
  expiresAt   DateTime  @map("expires_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  revokedAt   DateTime? @map("revoked_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@map("refresh_tokens")
}

// ==========================================
// SPORTS DATA
// ==========================================

model Team {
  id            String    @id @default(uuid())
  name          String
  shortName     String    @map("short_name") @db.VarChar(5)
  logoUrl       String?   @map("logo_url")
  country       String
  state         String?
  city          String?
  stadium       String?
  externalId    String?   @unique @map("external_id")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  homeMatches   Match[]   @relation("HomeTeam")
  awayMatches   Match[]   @relation("AwayTeam")
  wonMatches    Match[]   @relation("MatchWinner")

  @@unique([name, country])
  @@index([externalId])
  @@map("teams")
}

model Championship {
  id            String              @id @default(uuid())
  name          String
  season        String              // e.g., "2026"
  country       String?
  type          ChampionshipType
  status        ChampionshipStatus  @default(PLANNED)
  startDate     DateTime?           @map("start_date")
  endDate       DateTime?           @map("end_date")
  logoUrl       String?             @map("logo_url")
  externalId    String?             @unique @map("external_id")
  createdAt     DateTime            @default(now()) @map("created_at")
  updatedAt     DateTime            @updatedAt @map("updated_at")
  deletedAt     DateTime?           @map("deleted_at")

  rounds        Round[]
  pools         Pool[]

  @@unique([name, season])
  @@index([status])
  @@map("championships")
}

model Round {
  id              String        @id @default(uuid())
  championshipId  String        @map("championship_id")
  number          Int
  name            String        // "Rodada 1", "Quartas - Ida"
  startDate       DateTime?     @map("start_date")
  endDate         DateTime?     @map("end_date")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  championship    Championship  @relation(fields: [championshipId], references: [id], onDelete: Cascade)
  matches         Match[]

  @@unique([championshipId, number])
  @@map("rounds")
}

model Match {
  id                  String        @id @default(uuid())
  roundId             String        @map("round_id")
  homeTeamId          String        @map("home_team_id")
  awayTeamId          String        @map("away_team_id")
  scheduledAt         DateTime      @map("scheduled_at")
  stadium             String?
  status              MatchStatus   @default(SCHEDULED)
  homeScore           Int?          @map("home_score")
  awayScore           Int?          @map("away_score")
  homeScoreExtraTime  Int?          @map("home_score_extra_time")
  awayScoreExtraTime  Int?          @map("away_score_extra_time")
  homePenalties       Int?          @map("home_penalties")
  awayPenalties       Int?          @map("away_penalties")
  winnerId            String?       @map("winner_id")
  isKnockout          Boolean       @default(false) @map("is_knockout")
  externalId          String?       @unique @map("external_id")
  startedAt           DateTime?     @map("started_at")
  finishedAt          DateTime?     @map("finished_at")
  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")

  round               Round         @relation(fields: [roundId], references: [id], onDelete: Cascade)
  homeTeam            Team          @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeam            Team          @relation("AwayTeam", fields: [awayTeamId], references: [id])
  winner              Team?         @relation("MatchWinner", fields: [winnerId], references: [id])
  predictions         Prediction[]
  oddsSnapshots       OddsSnapshot[]

  @@index([roundId])
  @@index([status])
  @@index([scheduledAt])
  @@index([externalId])
  @@map("matches")
}

// ==========================================
// POOLS (BOLÕES)
// ==========================================

model Pool {
  id                    String          @id @default(uuid())
  name                  String
  description           String?         @db.Text
  organizerId           String          @map("organizer_id")
  championshipId        String          @map("championship_id")
  status                PoolStatus      @default(DRAFT)
  entryFee              Decimal         @default(0) @map("entry_fee") @db.Decimal(10, 2)
  maxParticipants       Int?            @map("max_participants")
  inviteCode            String          @unique @map("invite_code")
  invitePassword        String?         @map("invite_password")
  registrationDeadline  DateTime?       @map("registration_deadline")
  platformFeePercent    Decimal         @default(0) @map("platform_fee_percent") @db.Decimal(5, 2)
  totalPrize            Decimal         @default(0) @map("total_prize") @db.Decimal(12, 2)
  createdAt             DateTime        @default(now()) @map("created_at")
  updatedAt             DateTime        @updatedAt @map("updated_at")
  finishedAt            DateTime?       @map("finished_at")
  cancelledAt           DateTime?       @map("cancelled_at")
  deletedAt             DateTime?       @map("deleted_at")

  organizer             User            @relation("PoolOrganizer", fields: [organizerId], references: [id])
  championship          Championship    @relation(fields: [championshipId], references: [id])
  members               PoolMember[]
  rules                 PoolRules?
  payoutRules           PayoutRule[]
  standings             Standing[]
  poolRounds            PoolRound[]

  @@index([organizerId])
  @@index([status])
  @@index([inviteCode])
  @@map("pools")
}

model PoolRound {
  id        String  @id @default(uuid())
  poolId    String  @map("pool_id")
  roundId   String  @map("round_id")

  pool      Pool    @relation(fields: [poolId], references: [id], onDelete: Cascade)

  @@unique([poolId, roundId])
  @@map("pool_rounds")
}

model PoolRules {
  id                        String    @id @default(uuid())
  poolId                    String    @unique @map("pool_id")
  exactScorePoints          Int       @default(10) @map("exact_score_points")
  correctWinnerDiffPoints   Int       @default(7) @map("correct_winner_diff_points")
  correctWinnerGoalsPoints  Int       @default(5) @map("correct_winner_goals_points")
  correctWinnerPoints       Int       @default(3) @map("correct_winner_points")
  correctDrawPoints         Int       @default(2) @map("correct_draw_points")
  knockoutBonusPoints       Int       @default(5) @map("knockout_bonus_points")
  lockMinutesBefore         Int       @default(0) @map("lock_minutes_before")
  allowPredictionEdit       Boolean   @default(true) @map("allow_prediction_edit")
  requirePayment            Boolean   @default(true) @map("require_payment")
  walkoverPolicy            String    @default("SCORE_3_0") @map("walkover_policy") // SCORE_3_0 or ANNUL
  postponedPolicy           String    @default("KEEP_PREDICTIONS") @map("postponed_policy") // KEEP_PREDICTIONS or ANNUL
  tiebreakerOrder           Json      @default("[\"total_points\",\"exact_scores\",\"correct_winners\",\"fewer_errors\",\"earliest_prediction\"]") @map("tiebreaker_order")
  championCriteria          String    @default("HIGHEST_SCORE") @map("champion_criteria")
  createdAt                 DateTime  @default(now()) @map("created_at")
  updatedAt                 DateTime  @updatedAt @map("updated_at")

  pool                      Pool      @relation(fields: [poolId], references: [id], onDelete: Cascade)

  @@map("pool_rules")
}

model PayoutRule {
  id          String    @id @default(uuid())
  poolId      String    @map("pool_id")
  position    Int       // 1, 2, 3...
  percentage  Decimal   @db.Decimal(5, 2) // 70.00, 20.00, 10.00
  createdAt   DateTime  @default(now()) @map("created_at")

  pool        Pool      @relation(fields: [poolId], references: [id], onDelete: Cascade)

  @@unique([poolId, position])
  @@map("payout_rules")
}

// ==========================================
// MEMBERS & PREDICTIONS
// ==========================================

model PoolMember {
  id          String            @id @default(uuid())
  poolId      String            @map("pool_id")
  userId      String            @map("user_id")
  status      PoolMemberStatus  @default(INVITED)
  joinedAt    DateTime?         @map("joined_at")
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")

  pool        Pool              @relation(fields: [poolId], references: [id], onDelete: Cascade)
  user        User              @relation(fields: [userId], references: [id])
  predictions Prediction[]
  payments    Payment[]
  standings   Standing[]

  @@unique([poolId, userId])
  @@index([poolId, status])
  @@map("pool_members")
}

model Prediction {
  id              String            @id @default(uuid())
  poolMemberId    String            @map("pool_member_id")
  matchId         String            @map("match_id")
  userId          String            @map("user_id")
  homeScore       Int               @map("home_score")
  awayScore       Int               @map("away_score")
  knockoutWinnerId String?          @map("knockout_winner_id")
  status          PredictionStatus  @default(OPEN)
  pointsEarned    Int?              @map("points_earned")
  scoringDetail   String?           @map("scoring_detail") // "exact_score", "correct_winner_diff", etc.
  lockedAt        DateTime?         @map("locked_at")
  scoredAt        DateTime?         @map("scored_at")
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  poolMember      PoolMember        @relation(fields: [poolMemberId], references: [id], onDelete: Cascade)
  match           Match             @relation(fields: [matchId], references: [id])
  user            User              @relation(fields: [userId], references: [id])

  @@unique([poolMemberId, matchId])
  @@index([matchId])
  @@index([userId])
  @@index([status])
  @@map("predictions")
}

// ==========================================
// STANDINGS (RANKING)
// ==========================================

model Standing {
  id                String      @id @default(uuid())
  poolId            String      @map("pool_id")
  poolMemberId      String      @map("pool_member_id")
  position          Int
  previousPosition  Int?        @map("previous_position")
  totalPoints       Int         @default(0) @map("total_points")
  exactScores       Int         @default(0) @map("exact_scores")
  correctWinners    Int         @default(0) @map("correct_winners")
  correctDraws      Int         @default(0) @map("correct_draws")
  totalErrors       Int         @default(0) @map("total_errors")
  totalPredictions  Int         @default(0) @map("total_predictions")
  isChampion        Boolean     @default(false) @map("is_champion")
  prizeAmount       Decimal?    @map("prize_amount") @db.Decimal(12, 2)
  lastCalculatedAt  DateTime    @map("last_calculated_at")
  createdAt         DateTime    @default(now()) @map("created_at")
  updatedAt         DateTime    @updatedAt @map("updated_at")

  pool              Pool        @relation(fields: [poolId], references: [id], onDelete: Cascade)
  poolMember        PoolMember  @relation(fields: [poolMemberId], references: [id], onDelete: Cascade)

  @@unique([poolId, poolMemberId])
  @@index([poolId, position])
  @@map("standings")
}

// ==========================================
// PAYMENTS & REFUNDS
// ==========================================

model Payment {
  id              String          @id @default(uuid())
  poolMemberId    String          @map("pool_member_id")
  userId          String          @map("user_id")
  amount          Decimal         @db.Decimal(10, 2)
  method          PaymentMethod?
  status          PaymentStatus   @default(PENDING)
  providerName    String          @map("provider_name") // "mercadopago", "asaas"
  providerPaymentId String?       @unique @map("provider_payment_id")
  paymentLink     String?         @map("payment_link")
  paymentLinkExpiry DateTime?     @map("payment_link_expiry")
  qrCode          String?         @map("qr_code") @db.Text
  qrCodeBase64    String?         @map("qr_code_base64") @db.Text
  paidAt          DateTime?       @map("paid_at")
  expiredAt       DateTime?       @map("expired_at")
  cancelledAt     DateTime?       @map("cancelled_at")
  webhookPayload  Json?           @map("webhook_payload")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  poolMember      PoolMember      @relation(fields: [poolMemberId], references: [id])
  user            User            @relation(fields: [userId], references: [id])
  refund          Refund?

  @@index([poolMemberId])
  @@index([userId])
  @@index([status])
  @@index([providerPaymentId])
  @@map("payments")
}

model Refund {
  id              String        @id @default(uuid())
  paymentId       String        @unique @map("payment_id")
  amount          Decimal       @db.Decimal(10, 2)
  reason          String
  status          RefundStatus  @default(PENDING)
  providerRefundId String?      @unique @map("provider_refund_id")
  processedAt     DateTime?     @map("processed_at")
  failedAt        DateTime?     @map("failed_at")
  failureReason   String?       @map("failure_reason")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  payment         Payment       @relation(fields: [paymentId], references: [id])

  @@index([status])
  @@map("refunds")
}

// ==========================================
// NOTIFICATIONS
// ==========================================

model Notification {
  id          String            @id @default(uuid())
  userId      String            @map("user_id")
  type        NotificationType
  title       String
  message     String            @db.Text
  data        Json?             // { poolId, matchId, etc. }
  readAt      DateTime?         @map("read_at")
  sentEmailAt DateTime?         @map("sent_email_at")
  createdAt   DateTime          @default(now()) @map("created_at")

  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, readAt])
  @@index([userId, createdAt])
  @@map("notifications")
}

// ==========================================
// AUDIT
// ==========================================

model AuditLog {
  id          String        @id @default(uuid())
  userId      String?       @map("user_id")
  action      AuditAction
  entityType  String        @map("entity_type") // "pool", "prediction", "payment", etc.
  entityId    String        @map("entity_id")
  oldData     Json?         @map("old_data")
  newData     Json?         @map("new_data")
  ipAddress   String?       @map("ip_address")
  userAgent   String?       @map("user_agent") @db.Text
  createdAt   DateTime      @default(now()) @map("created_at")

  user        User?         @relation("AuditUser", fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}

// ==========================================
// ODDS (OPTIONAL MODULE)
// ==========================================

model OddsSnapshot {
  id          String    @id @default(uuid())
  matchId     String    @map("match_id")
  provider    String    // "api-odds", "the-odds-api"
  homeWinOdds Decimal?  @map("home_win_odds") @db.Decimal(8, 4)
  drawOdds    Decimal?  @map("draw_odds") @db.Decimal(8, 4)
  awayWinOdds Decimal?  @map("away_win_odds") @db.Decimal(8, 4)
  rawData     Json?     @map("raw_data")
  capturedAt  DateTime  @map("captured_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  match       Match     @relation(fields: [matchId], references: [id], onDelete: Cascade)

  @@index([matchId, capturedAt])
  @@map("odds_snapshots")
}

// ==========================================
// SYSTEM SETTINGS
// ==========================================

model SystemSetting {
  id          String    @id @default(uuid())
  key         String    @unique
  value       Json
  description String?
  updatedAt   DateTime  @updatedAt @map("updated_at")
  updatedBy   String?   @map("updated_by")

  @@map("system_settings")
}

model Integration {
  id            String    @id @default(uuid())
  name          String    @unique // "sports_api", "payment_provider", "odds_api"
  provider      String    // "api-football", "mercadopago", "the-odds-api"
  isActive      Boolean   @default(false) @map("is_active")
  config        Json      // Encrypted credentials and settings
  lastSyncAt    DateTime? @map("last_sync_at")
  lastError     String?   @map("last_error") @db.Text
  lastErrorAt   DateTime? @map("last_error_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("integrations")
}
```

## 8.2 Índices e Considerações de Performance

Os índices mais críticos para performance estão definidos no schema acima com `@@index`. Adicionalmente, em produção, considerar:

Views materializadas para ranking consolidado (recalculadas via trigger ou job). Índice parcial em `predictions` para `status = 'OPEN'` (queries frequentes de palpites abertos). Particionamento de `audit_logs` por mês para queries históricas. Connection pooling via PgBouncer para cenários de alta concorrência.

---

# 9. FLUXOS PRINCIPAIS

## 9.1 Cadastro do Usuário

1. Usuário acessa `/register`.
2. Preenche nome, e-mail, senha, confirmação de senha.
3. Aceita termos de uso.
4. Frontend valida campos localmente.
5. `POST /api/v1/auth/register` com payload `{ fullName, email, password }`.
6. Backend valida: e-mail único, senha atende requisitos, termos aceitos.
7. Cria registro em `users` com status `PENDING_VERIFICATION`.
8. Cria registro em `profiles` com `fullName`.
9. Gera `emailVerificationToken` (UUID) com validade 24h.
10. Dispara job na fila para enviar e-mail de verificação.
11. Retorna HTTP 201 com mensagem "Conta criada. Verifique seu e-mail."
12. Audit log: `CREATE` em `user`.

## 9.2 Confirmação por E-mail

1. Usuário clica no link do e-mail: `/verify-email/{token}`.
2. Frontend faz `POST /api/v1/auth/verify-email` com `{ token }`.
3. Backend busca user por `emailVerificationToken`.
4. Valida que token não expirou.
5. Atualiza `emailVerified = true`, `status = ACTIVE`, limpa token.
6. Retorna HTTP 200.
7. Frontend redireciona para login com mensagem de sucesso.
8. Audit log: `UPDATE` em `user` (verificação).

## 9.3 Entrada em Bolão por Convite

1. Usuário recebe link `/invite/{code}`.
2. Frontend carrega página pública do bolão: `GET /api/v1/pools/invite/{code}`.
3. API retorna: nome, descrição, campeonato, taxa, regras resumidas, total de participantes.
4. Se usuário não está logado: redirect para login com `?redirect=/invite/{code}`.
5. Após login: `POST /api/v1/pools/{poolId}/join` com `{ inviteCode }`.
6. Backend valida: bolão está ABERTO, limite de participantes não atingido, usuário não é membro já, senha correta (se exigida).
7. Cria `PoolMember` com status `PENDING_PAYMENT` (ou `ACTIVE` se bolão gratuito).
8. Se bolão pago: cria `Payment` com status `PENDING` e gera link de pagamento via provedor.
9. Retorna HTTP 201 com dados do membro e link de pagamento (se aplicável).
10. Notificação para o organizador: "Novo participante no seu bolão."
11. Audit log: `CREATE` em `pool_member`.

## 9.4 Pagamento da Taxa

1. Participante acessa link de pagamento (retornado no join ou via botão na tela de pagamento).
2. Link redireciona para checkout do provedor (Mercado Pago).
3. Participante escolhe método (PIX, cartão, boleto) e completa o pagamento.
4. Provedor processa e envia webhook para `POST /api/v1/webhooks/payments/{provider}`.

## 9.5 Confirmação do Pagamento (Webhook)

1. Webhook recebido no backend.
2. Valida assinatura/HMAC do webhook.
3. Busca `Payment` pelo `providerPaymentId`.
4. Se status no webhook = "approved/paid": atualiza `Payment.status = PAID`, registra `paidAt`, `method` e `webhookPayload`.
5. Atualiza `PoolMember.status = ACTIVE`.
6. Recalcula `Pool.totalPrize = SUM(pagamentos pagos) * (1 - platformFeePercent/100)`.
7. Envia notificação `PAYMENT_CONFIRMED` ao participante.
8. Envia notificação ao organizador.
9. Audit log: `PAYMENT_RECEIVED`.

## 9.6 Liberação do Participante

Imediata após confirmação do webhook. O participante vê atualização em tempo real (via polling ou WebSocket). A tela de palpites é desbloqueada. Status visual muda de "Pagamento Pendente" para "Ativo".

## 9.7 Envio de Palpites

1. Participante acessa `/pools/{poolId}/predictions`.
2. Frontend carrega jogos da rodada: `GET /api/v1/pools/{poolId}/matches?round={roundId}`.
3. Para cada jogo retornado: status, horário, se já tem palpite registrado, se está travado.
4. Participante preenche placares.
5. Auto-save com debounce 2s ou botão "Salvar": `PUT /api/v1/predictions/batch`.
6. Payload: `{ predictions: [{ matchId, homeScore, awayScore, knockoutWinnerId? }] }`.
7. Backend valida para cada prediction: participante é membro ACTIVE do bolão; `DateTime.now() < match.scheduledAt - rules.lockMinutesBefore`; valores >= 0; matchId pertence ao bolão.
8. Upsert de `Prediction` (cria ou atualiza).
9. Retorna HTTP 200 com predictions atualizadas.
10. Audit log: `CREATE` ou `UPDATE` em `prediction`.

## 9.8 Travamento de Palpites

1. Job agendado verifica a cada minuto partidas que estão prestes a iniciar.
2. Para partidas onde `scheduledAt - lockMinutesBefore <= DateTime.now()`: atualiza todas as `Prediction` com `status = OPEN` para `status = LOCKED`, `lockedAt = now()`.
3. Frontend verifica via polling (ou WebSocket) e desabilita campos.
4. Qualquer tentativa de PUT no backend após travamento retorna HTTP 422.

## 9.9 Atualização de Resultados

1. **Via integração:** job consulta API esportiva. Detecta partida finalizada. Atualiza `Match` com placar, status `FINISHED`, `finishedAt`. Se configurado para auto-apply: aplica direto. Se configurado para aprovação: cria alerta para admin.
2. **Via admin manual:** admin acessa painel, insere placar, confirma.
3. Em ambos os casos, após resultado registrado: dispara job de apuração e recálculo de ranking.
4. Audit log: `RESULT_REGISTERED`.

## 9.10 Recálculo do Ranking

1. Job é adicionado à fila BullMQ: `ranking-recalc` com payload `{ poolId, matchId }`.
2. Worker busca todas as predictions para o match dentro do pool.
3. Para cada prediction, aplica scoring engine (Seção 13):
   - Compara palpite vs resultado real.
   - Calcula pontuação conforme `PoolRules`.
   - Atualiza `Prediction.pointsEarned` e `scoringDetail`.
   - Atualiza `Prediction.status = SCORED`.
4. Recalcula `Standing` para cada membro: soma total de pontos de todas as predictions scored, contagem de acertos exatos, winners, draws, errors.
5. Ordena por critérios de desempate definidos em `PoolRules.tiebreakerOrder`.
6. Atualiza posições, calcula `previousPosition` para indicador de variação.
7. Se bolão está finalizado (todos os jogos da última rodada scored): marca campeão.
8. Invalida cache Redis do ranking.
9. Envia notificações `RANKING_UPDATED` para participantes cuja posição mudou.
10. Audit log: `RANKING_RECALCULATED`.

## 9.11 Marcação de Vencedor ou Eliminado

Em bolões com eliminação configurada: após cada rodada, o sistema verifica regras de eliminação. Participantes abaixo do corte são marcados como `ELIMINATED` no `PoolMember`. Seus palpites futuros são bloqueados. Notificação `YOU_LOST` enviada. Em bolões sem eliminação: todos permanecem ACTIVE até o final.

## 9.12 Encerramento do Bolão

1. Todas as partidas vinculadas ao bolão estão com status `FINISHED`.
2. Recálculo final do ranking é executado.
3. Sistema aplica critérios de campeão.
4. Se há vencedor claro: marca `Standing.isChampion = true`, calcula `prizeAmount` conforme `PayoutRules`, atualiza `Pool.status = FINISHED`, `finishedAt = now()`.
5. Se há empate irresolvível: divide prêmio, marca múltiplos campeões.
6. Se não há vencedor (ex: bolão cancelado): `Pool.status = FINISHED_NO_WINNER`, processa devoluções.
7. Notificação `CHAMPION_DECLARED` para todos.
8. Tela do campeão é ativada.
9. Audit log: `CHAMPION_DECLARED`.

## 9.13 Anúncio do Campeão

Após marcação do campeão: e-mail especial para o campeão com dados do prêmio. E-mail para todos com resultado final e link para ranking. Tela do campeão (confetti, troféu, nome, valor) é exibida ao acessar o bolão. Geração de imagem compartilhável para redes sociais. Prêmio é processado: se PIX do vencedor cadastrado, transferência é iniciada; caso contrário, crédito na carteira interna.

## 9.14 Cálculo de Devolução

1. Trigger: bolão cancelado ou finalizado sem vencedor.
2. Sistema calcula valor de devolução por participante conforme regras (Seção 3.16).
3. Cria registro `Refund` para cada `Payment` com status PAID.
4. Se reembolso automático está habilitado: processa via API do provedor, atualiza status conforme webhook.
5. Se reembolso manual: gera lista para admin aprovar, admin revisa e confirma em lote, sistema processa.
6. Notificação `REFUND_AVAILABLE` para cada participante.
7. Audit log: `PAYMENT_REFUNDED`.

---

# 10. INTEGRAÇÃO COM PAGAMENTOS

## 10.1 Provedor Recomendado: Mercado Pago

**Justificativa:** maior penetração no Brasil, suporte nativo a PIX com QR code, checkout transparente e redirecionado, webhooks confiáveis, API madura e bem documentada, sandbox para testes, taxas competitivas (3.99% cartão, 0.99% PIX, ou negociável para volumes maiores).

**Provedor backup:** Asaas — excelente para PIX e boleto, API moderna, bom para B2B. Fácil migração pois a camada de abstração `PaymentProvider` torna os provedores intercambiáveis.

## 10.2 Fluxo Técnico de Integração

### Geração do Link de Pagamento

```typescript
// payments.service.ts (simplificado)
async createPaymentForMember(poolMemberId: string): Promise<Payment> {
  const member = await this.prisma.poolMember.findUnique({
    where: { id: poolMemberId },
    include: { pool: true, user: { include: { profile: true } } },
  });

  const paymentData = await this.paymentProvider.createPayment({
    amount: member.pool.entryFee.toNumber(),
    description: `Bolão: ${member.pool.name}`,
    externalReference: poolMemberId,
    payer: {
      email: member.user.email,
      firstName: member.user.profile.fullName.split(' ')[0],
    },
    expirationMinutes: 2880, // 48h
    notificationUrl: `${this.configService.get('API_URL')}/webhooks/payments/mercadopago`,
    methods: ['pix', 'credit_card', 'boleto'],
  });

  return this.prisma.payment.create({
    data: {
      poolMemberId,
      userId: member.userId,
      amount: member.pool.entryFee,
      status: 'PENDING',
      providerName: 'mercadopago',
      providerPaymentId: paymentData.id,
      paymentLink: paymentData.initPoint,
      paymentLinkExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000),
      qrCode: paymentData.pointOfInteraction?.transactionData?.qrCode,
      qrCodeBase64: paymentData.pointOfInteraction?.transactionData?.qrCodeBase64,
    },
  });
}
```

### Webhook Handler

```typescript
// webhooks.controller.ts (simplificado)
@Post('payments/mercadopago')
async handleMercadoPagoWebhook(
  @Body() body: any,
  @Headers('x-signature') signature: string,
  @Req() req: Request,
) {
  // 1. Validar assinatura HMAC
  this.paymentProvider.validateWebhookSignature(body, signature);

  // 2. Buscar detalhes completos do pagamento na API do provedor
  const paymentDetails = await this.paymentProvider.getPayment(body.data.id);

  // 3. Processar conforme status
  await this.paymentsService.processWebhook(paymentDetails);

  return { received: true };
}
```

### Interface do Provider (Strategy Pattern)

```typescript
// payment-provider.interface.ts
export interface PaymentProvider {
  createPayment(data: CreatePaymentDto): Promise<ProviderPaymentResponse>;
  getPayment(providerPaymentId: string): Promise<ProviderPaymentDetails>;
  createRefund(providerPaymentId: string, amount: number): Promise<ProviderRefundResponse>;
  validateWebhookSignature(body: any, signature: string): boolean;
}
```

Essa interface é implementada por `MercadoPagoProvider` e `AsaasProvider`, permitindo trocar de provedor sem alterar lógica de negócio.

## 10.3 Conciliação

Job diário (03:00 AM) busca todos os `Payment` com status `PENDING` ou `PROCESSING` e consulta a API do provedor para verificar status atualizado. Divergências (webhook não recebido mas pagamento aprovado) são corrigidas automaticamente. Relatório de conciliação gerado e enviado para o perfil financeiro/admin.

## 10.4 Expiração Automática

Job a cada hora verifica `Payment` com status `PENDING` e `paymentLinkExpiry < now()`. Atualiza para `EXPIRED`. Se o bolão ainda aceita inscrições, o participante pode solicitar novo link. Se as inscrições fecharam, participante é removido.

## 10.5 Reembolso

```typescript
async processRefund(paymentId: string, reason: string): Promise<Refund> {
  const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });

  // Chamar API do provedor
  const providerRefund = await this.paymentProvider.createRefund(
    payment.providerPaymentId,
    payment.amount.toNumber(),
  );

  return this.prisma.refund.create({
    data: {
      paymentId,
      amount: payment.amount,
      reason,
      status: 'PROCESSING',
      providerRefundId: providerRefund.id,
    },
  });
}
```

Status do reembolso é atualizado via webhook do provedor.

---

# 11. INTEGRAÇÃO COM DADOS ESPORTIVOS

## 11.1 Provedor Recomendado: API-Football (via RapidAPI)

**Justificativa:** cobertura completa de campeonatos brasileiros e internacionais, dados em tempo real (live scores), endpoints para times, campeonatos, rodadas, partidas e estatísticas, plano gratuito para desenvolvimento (100 requests/dia), planos pagos acessíveis para produção.

**Alternativa:** Football-Data.org (gratuito para uso não-comercial, mais limitado) ou SportMonks.

**Fallback:** cadastro 100% manual pelo admin.

## 11.2 Estratégia de Integração

### Cenário Ideal (API ativa)

Job agendado `sports-sync.job.ts`:

**Sync de times:** executado 1x por dia. Busca times dos campeonatos cadastrados. Cria/atualiza registros em `teams` vinculando por `externalId`.

**Sync de partidas:** executado a cada 15 minutos (fora de horário de jogo) ou a cada 1 minuto (durante janela de jogos — detectada automaticamente). Busca status e placar de partidas do dia. Atualiza `matches` com status e placar.

**Sync de resultados:** quando detecta `match.status = FT` (Full Time): atualiza placar final, marca `FINISHED`, dispara recálculo de ranking.

### Cenário Alternativo (API com limitações)

Se a API tiver rate limit ou instabilidade: implementar retry com backoff exponencial (1s, 2s, 4s, 8s, máx 60s). Cache agressivo de dados estáveis (times, campeonatos). Fila de prioridade: partidas ao vivo > partidas do dia > sync geral. Se o quota diário for atingido: fallback para modo manual com alerta ao admin.

### Fallback Manual

Admin cadastra tudo manualmente: times, campeonatos, rodadas, partidas, resultados. O sistema funciona 100% sem nenhuma API externa. A integração é um acelerador, nunca uma dependência.

## 11.3 Tratamento de Inconsistências

Se a API retorna resultado diferente do já registrado (ex: placar corrigido pela confederação): sistema gera alerta para o admin, admin pode aceitar a correção ou manter o valor, se aceitar, sistema reprocessa todos os palpites e recálculo de ranking, audit log registra a mudança completa.

---

# 12. INTEGRAÇÃO COM ODDS / COMPARAÇÃO EXTERNA

## 12.1 Provedor Recomendado: The Odds API

**Justificativa:** agrega odds de múltiplas casas de apostas, API simples e bem documentada, plano gratuito com 500 requests/mês (suficiente para MVP), retorna odds em formato padronizado.

## 12.2 Arquitetura do Módulo de Odds

**Princípio fundamental:** o módulo de odds é 100% opcional e desacoplado. O bolão funciona perfeitamente sem ele. Se a API cair, nenhuma funcionalidade core é afetada.

### Armazenamento

Odds são salvas em `odds_snapshots` — tabela append-only que versiona as odds ao longo do tempo. Cada snapshot tem `capturedAt` (timestamp da captura), `matchId`, odds de vitória casa/empate/visitante, e `rawData` (JSON completo da API para dados adicionais).

### Sync

Job `odds-sync.job.ts` executa a cada 6 horas para jogos nos próximos 7 dias. Para jogos nas próximas 24 horas: a cada 1 hora. Nunca executa para jogos já finalizados.

### Exibição ao Usuário

Na tela de palpites, ao lado de cada jogo (se odds disponíveis): exibe odds atuais no formato decimal (ex: Casa 1.85 | Empate 3.40 | Fora 4.20). Tooltip mostra variação: "Odd de vitória do Flamengo caiu de 2.10 para 1.85 nas últimas 24h". Após o palpite ser salvo: registra snapshot da odd no momento do palpite (para comparação futura). Na tela de resultados: compara a escolha do participante com a tendência das casas ("Você apostou contra a tendência! A odd de vitória do visitante era 4.20").

### Feature Flag

O módulo é controlado por `SystemSetting` com key `odds_module_enabled`. Se `false`: todo o módulo é inerte. API endpoints de odds retornam 404. Jobs de sync não executam. Frontend não renderiza componentes de odds. Se `true`: funciona normalmente.

### Aviso Arquitetural

> **ATENÇÃO:** Odds externas são informação comparativa. Nunca são usadas para calcular pontuação, declarar vencedor ou influenciar resultado do bolão. Resultados oficiais dependem exclusivamente da tabela `matches`, alimentada por resultado real da partida (via API esportiva ou cadastro manual). Se a API de odds ficar indisponível: o bolão continua funcionando 100%. Nenhuma funcionalidade core depende de odds.

---

# 13. MOTOR DE REGRAS DO BOLÃO

## 13.1 Scoring Engine

O `ScoringEngine` é o núcleo da apuração. Recebe um palpite e um resultado e retorna a pontuação.

```typescript
// scoring.engine.ts
export class ScoringEngine {
  calculate(
    prediction: { homeScore: number; awayScore: number; knockoutWinnerId?: string },
    result: { homeScore: number; awayScore: number; winnerId?: string; isKnockout: boolean },
    rules: PoolRules,
  ): { points: number; detail: string } {

    // Acerto exato
    if (prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore) {
      let points = rules.exactScorePoints;
      let detail = 'exact_score';

      // Bonus mata-mata
      if (result.isKnockout && prediction.knockoutWinnerId === result.winnerId) {
        points += rules.knockoutBonusPoints;
        detail = 'exact_score_knockout_bonus';
      }
      return { points, detail };
    }

    const predictionDiff = prediction.homeScore - prediction.awayScore;
    const resultDiff = result.homeScore - result.awayScore;
    const predictionWinner = predictionDiff > 0 ? 'home' : predictionDiff < 0 ? 'away' : 'draw';
    const resultWinner = resultDiff > 0 ? 'home' : resultDiff < 0 ? 'away' : 'draw';

    // Acerto de empate (sem placar exato — placar exato já foi tratado acima)
    if (predictionWinner === 'draw' && resultWinner === 'draw') {
      return { points: rules.correctDrawPoints, detail: 'correct_draw' };
    }

    // Acertou o vencedor
    if (predictionWinner === resultWinner && predictionWinner !== 'draw') {
      // Acertou vencedor com mesma diferença de gols
      if (predictionDiff === resultDiff) {
        return { points: rules.correctWinnerDiffPoints, detail: 'correct_winner_diff' };
      }

      // Acertou vencedor com gols do vencedor correto
      const predWinnerGoals = predictionWinner === 'home' ? prediction.homeScore : prediction.awayScore;
      const resWinnerGoals = resultWinner === 'home' ? result.homeScore : result.awayScore;
      if (predWinnerGoals === resWinnerGoals) {
        return { points: rules.correctWinnerGoalsPoints, detail: 'correct_winner_goals' };
      }

      // Acertou apenas o vencedor
      return { points: rules.correctWinnerPoints, detail: 'correct_winner' };
    }

    // Bônus mata-mata isolado (errou tudo mas acertou classificado)
    if (result.isKnockout && prediction.knockoutWinnerId === result.winnerId) {
      return { points: rules.knockoutBonusPoints, detail: 'knockout_only' };
    }

    // Erro total
    return { points: 0, detail: 'miss' };
  }
}
```

## 13.2 Tiebreaker Engine

```typescript
// tiebreaker.engine.ts
export class TiebreakerEngine {
  sort(standings: StandingData[], order: string[]): StandingData[] {
    return standings.sort((a, b) => {
      for (const criterion of order) {
        const diff = this.compare(a, b, criterion);
        if (diff !== 0) return diff;
      }
      return 0; // Empate absoluto
    });
  }

  private compare(a: StandingData, b: StandingData, criterion: string): number {
    switch (criterion) {
      case 'total_points': return b.totalPoints - a.totalPoints;
      case 'exact_scores': return b.exactScores - a.exactScores;
      case 'correct_winners': return b.correctWinners - a.correctWinners;
      case 'fewer_errors': return a.totalErrors - b.totalErrors;
      case 'earliest_prediction': return a.avgPredictionTimestamp - b.avgPredictionTimestamp;
      default: return 0;
    }
  }
}
```

## 13.3 Configurabilidade

Todos os parâmetros do motor de regras estão na tabela `pool_rules`, permitindo que cada bolão tenha configuração independente. O organizador configura via formulário na criação do bolão, com templates pré-definidos ("Padrão", "Só Vencedor", "Mata-Mata", "Personalizado"). Qualquer alteração de regra após início do bolão exige confirmação dupla e é registrada em auditoria.

---

# 14. PAINEL ADMINISTRATIVO COMPLETO

O admin pode: cadastrar equipes (individual ou importação em lote via CSV ou API), cadastrar campeonatos com rodadas, cadastrar partidas (individual, lote ou importação), editar placares (com confirmação e registro de motivo), encerrar bolões manualmente, acompanhar pagamentos com filtros (por bolão, status, data, método), aprovar ou remover participantes, visualizar ranking de qualquer bolão, forçar recalcular pontuação (com registro de motivo), reenviar notificação específica ou em lote, visualizar erros de integração (log de falhas da API esportiva e de pagamento), gerenciar devoluções (individual ou lote, com aprovação), exportar relatórios (CSV e PDF), ver trilha de auditoria com filtros avançados.

---

# 15. DASHBOARD DO USUÁRIO

(Detalhado na Seção 5.5 — componentes e comportamentos completos.)

O participante tem visão unificada de: bolões ativos com posição no ranking, status de pagamento, palpites pendentes com timer, resultados recentes com badges, posição no ranking com variação, odds comparativas (se módulo ativo), resultado final do bolão, valor a receber ou devolução.

---

# 16. ESTADOS VISUAIS

O sistema implementa os seguintes estados visuais com badges, cores e ícones padronizados:

| Estado | Cor de Fundo | Ícone | Contexto |
|---|---|---|---|
| Pagamento Pendente | Amarelo pulsante | Relógio | Tela de participante/admin |
| Pagamento Confirmado | Verde | Check | Tela de participante/admin |
| Aguardando Início | Cinza com borda azul | Calendário | Card de partida |
| Aposta Registrada | Azul | Lápis | Card de palpite |
| Aposta Travada | Cinza escuro | Cadeado | Card de palpite |
| Ganhou Confronto | Verde | Check duplo | Resultado da partida |
| Perdeu Confronto | Vermelho | X | Resultado da partida |
| Eliminado | Vermelho escuro, opacidade 70% | Skull | Ranking |
| Classificado | Verde | Seta para cima | Ranking (mata-mata) |
| Campeão | Gradiente dourado | Troféu | Ranking / Tela final |
| Bolão Encerrado sem Campeão | Cinza azulado | Balança | Tela final |
| Devolução em Processamento | Azul com spinner | Spinner | Tela financeira |
| Devolução Concluída | Verde | Check duplo | Tela financeira |

---

# 17. SEGURANÇA

## 17.1 Autenticação e Senhas

Hashing com bcrypt, salt rounds 12. JWT com algoritmo RS256 (chave assimétrica) em produção. Access token com payload mínimo (sub, role, iat, exp). Refresh token opaco armazenado em tabela com índice, rotativo. Cookies HttpOnly + Secure + SameSite=Strict para refresh token (não em localStorage).

## 17.2 Proteção Contra Ataques

**Rate Limiting:** por IP (100 req/min geral, 5 req/15min para login). Implementado via `@nestjs/throttler` com Redis store.

**CSRF:** tokens CSRF para formulários stateful. Headers de segurança via Helmet middleware.

**XSS:** Content Security Policy rigorosa. Sanitização de input com class-validator e class-transformer. React escapa output por padrão.

**SQL Injection:** Prisma ORM com queries parametrizadas. Nenhuma query raw sem parâmetros bindados.

**Validação de Input:** DTOs com class-validator em todo endpoint. Tamanho máximo de payload: 1MB.

## 17.3 Webhooks

Validação de assinatura HMAC em todo webhook recebido. IP allowlist do provedor de pagamento (quando suportado). Idempotência: webhooks duplicados são ignorados (verificação por `providerPaymentId`).

## 17.4 Auditoria e Logs

Toda ação crítica gera audit log (Seção 2.20). Logs estruturados em JSON com correlationId por request. Dados sensíveis (senhas, tokens, CPF) nunca são logados.

## 17.5 Privacidade e LGPD

Consentimento explícito no cadastro (checkbox de termos e política de privacidade). Endpoint para exportação de dados pessoais (`GET /api/v1/users/me/data-export`). Endpoint para exclusão de conta (`DELETE /api/v1/users/me` — soft delete com anonimização de dados pessoais após período de retenção). CPF criptografado em repouso com AES-256. Dados pessoais acessíveis apenas ao próprio usuário e admins autorizados. Política de retenção: dados de auditoria 5 anos, dados pessoais removidos após exclusão de conta + período legal.

## 17.6 Segurança de Infraestrutura

HTTPS obrigatório (TLS 1.3). Variáveis de ambiente para secrets (nunca hardcoded). Secrets manager em produção (ex: AWS Secrets Manager, Doppler, ou Infisical). Banco de dados com acesso restrito (VPC, security groups). Backups automáticos diários com retenção de 30 dias. Atualizações de segurança automatizadas para dependências (Dependabot/Renovate).

---

# 18. ESCALABILIDADE

## 18.1 Múltiplos Bolões Simultâneos

Modelo multi-tenant por bolão (cada query filtrada por `poolId`). Índices compostos em todas as tabelas com `poolId`. Sem gargalos de lock global — cada bolão opera independentemente.

## 18.2 Recálculo de Ranking sem Travar

Recálculo é assíncrono via BullMQ. Jobs são processados em workers dedicados. O ranking anterior fica em cache Redis enquanto o novo é calculado. Atualização atômica (transaction) ao final do cálculo. Para bolões com muitos participantes (>1000): cálculo paralelo por batches.

## 18.3 Filas para Processamento Pesado

BullMQ com filas dedicadas: `ranking` (prioridade alta), `notifications` (prioridade média), `sports-sync` (prioridade baixa), `payments` (prioridade alta), `reports` (prioridade baixa). Workers escaláveis horizontalmente.

## 18.4 Cache

Redis cache para: ranking atual de cada bolão (TTL: até invalidação por recálculo), dados de times e campeonatos (TTL: 24h), contagem de participantes por bolão (TTL: 5min), sessões de rate limiting.

## 18.5 Arquitetura Modular

Cada módulo NestJS é independente e pode ser extraído para microserviço futuramente (se necessário). Comunicação entre módulos via service injection (monolito modular). Se escalar para microserviços: BullMQ ou Apache Kafka para comunicação assíncrona.

## 18.6 App Mobile Futuro

API REST versionada (`/api/v1/`) é consumida identicamente por web e mobile. WebSocket para push em tempo real já preparado. Notificações push via Firebase Cloud Messaging (a adicionar no módulo de notificações).

---

# 19. RELATÓRIOS

Relatórios disponíveis: participantes por bolão (nome, e-mail, status de pagamento, pontuação, posição), pagamentos realizados (por bolão, período, método, status), inadimplentes (participantes com pagamento pendente/expirado, com data do convite e última ação), desempenho por rodada (pontuação média, melhor palpite, pior palpite, acertos exatos), ranking final (posição, nome, pontuação, detalhamento), histórico de resultados (todas as partidas com placar, data, status), devoluções (por bolão, status, valores, datas), auditoria (log filtrado e exportável), integridade dos dados esportivos (partidas sem resultado, divergências com API).

Formatos: visualização em tabela no painel, exportação CSV, exportação PDF (para relatórios formatados).

---

# 20. NOTIFICAÇÕES

(Detalhadas na Seção 2.17.)

**Implementação técnica:** serviço de e-mail transacional via SendGrid (recomendado) ou Amazon SES. Templates em HTML responsivo com MJML. Fila dedicada no BullMQ para envio assíncrono. Retry automático com backoff para falhas de envio. Tracking de abertura e clique (SendGrid nativo). Push notifications (futuro): Firebase Cloud Messaging, configuração por dispositivo. In-app: tabela `notifications` com polling a cada 30 segundos ou WebSocket.

---

# 21. APIs E CONTRATOS

## 21.1 Arquitetura da API

REST com versionamento via URL prefix (`/api/v1/`). Documentação automática via Swagger/OpenAPI (decorators do NestJS). Autenticação via Bearer token (JWT) no header `Authorization`. Paginação padrão: `?page=1&limit=20` retornando `{ data: [], meta: { total, page, limit, totalPages } }`. Filtros via query params: `?status=ACTIVE&search=flamengo`.

## 21.2 Endpoints Principais

### Auth

```
POST   /api/v1/auth/register           - Criar conta
POST   /api/v1/auth/login              - Login (retorna access + refresh token)
POST   /api/v1/auth/refresh            - Renovar access token
POST   /api/v1/auth/logout             - Invalidar refresh token
POST   /api/v1/auth/verify-email       - Verificar e-mail
POST   /api/v1/auth/forgot-password    - Solicitar reset de senha
POST   /api/v1/auth/reset-password     - Resetar senha
```

### Users

```
GET    /api/v1/users/me                - Perfil do usuário logado
PATCH  /api/v1/users/me                - Atualizar perfil
PATCH  /api/v1/users/me/avatar         - Upload de avatar
DELETE /api/v1/users/me                - Excluir conta
GET    /api/v1/users/me/data-export    - Exportar dados (LGPD)
GET    /api/v1/users/me/stats          - Estatísticas do usuário
```

### Pools

```
POST   /api/v1/pools                   - Criar bolão
GET    /api/v1/pools                   - Listar bolões do usuário
GET    /api/v1/pools/:id               - Detalhes do bolão
PATCH  /api/v1/pools/:id               - Editar bolão (organizador)
DELETE /api/v1/pools/:id               - Cancelar bolão
POST   /api/v1/pools/:id/join          - Entrar no bolão
POST   /api/v1/pools/:id/leave         - Sair do bolão
GET    /api/v1/pools/invite/:code      - Dados públicos do bolão (sem auth)
POST   /api/v1/pools/:id/invite/regenerate - Gerar novo código de convite
GET    /api/v1/pools/:id/members       - Listar membros
PATCH  /api/v1/pools/:id/members/:memberId - Gerenciar membro (aprovar, remover)
```

### Predictions

```
GET    /api/v1/pools/:poolId/predictions              - Meus palpites do bolão
GET    /api/v1/pools/:poolId/predictions/round/:roundId - Palpites por rodada
PUT    /api/v1/predictions/batch                       - Salvar palpites (batch)
GET    /api/v1/pools/:poolId/predictions/history       - Histórico de palpites
```

### Rankings

```
GET    /api/v1/pools/:poolId/ranking                - Ranking completo
GET    /api/v1/pools/:poolId/ranking/round/:roundId - Ranking parcial por rodada
POST   /api/v1/pools/:poolId/ranking/recalculate    - Forçar recálculo (admin)
```

### Payments

```
GET    /api/v1/pools/:poolId/payment              - Meu pagamento do bolão
POST   /api/v1/pools/:poolId/payment/generate     - Gerar/reenviar link
POST   /api/v1/webhooks/payments/:provider        - Webhook (sem auth JWT, com HMAC)
```

### Sports (Admin)

```
GET    /api/v1/admin/teams                   - Listar times
POST   /api/v1/admin/teams                   - Criar time
PATCH  /api/v1/admin/teams/:id               - Editar time
DELETE /api/v1/admin/teams/:id               - Remover time
POST   /api/v1/admin/teams/import            - Importar times da API

GET    /api/v1/admin/championships           - Listar campeonatos
POST   /api/v1/admin/championships           - Criar campeonato
PATCH  /api/v1/admin/championships/:id       - Editar campeonato

GET    /api/v1/admin/matches                 - Listar partidas (filtros)
POST   /api/v1/admin/matches                 - Criar partida
PATCH  /api/v1/admin/matches/:id             - Editar partida
POST   /api/v1/admin/matches/:id/result      - Registrar resultado
POST   /api/v1/admin/matches/import          - Importar partidas da API
```

### Notifications

```
GET    /api/v1/notifications                 - Listar notificações
PATCH  /api/v1/notifications/:id/read        - Marcar como lida
POST   /api/v1/notifications/read-all        - Marcar todas como lidas
GET    /api/v1/notifications/preferences     - Preferências
PATCH  /api/v1/notifications/preferences     - Atualizar preferências
```

### Admin

```
GET    /api/v1/admin/dashboard               - KPIs e métricas
GET    /api/v1/admin/payments                 - Todos os pagamentos
POST   /api/v1/admin/refunds                 - Processar devolução
GET    /api/v1/admin/audit-logs              - Trilha de auditoria
GET    /api/v1/admin/reports/:type           - Gerar relatório
GET    /api/v1/admin/integrations            - Status das integrações
POST   /api/v1/admin/integrations/:id/sync   - Forçar sync
GET    /api/v1/admin/settings                - Configurações
PATCH  /api/v1/admin/settings                - Atualizar configurações
```

## 21.3 Exemplos de Payload

### POST /api/v1/auth/register — Request

```json
{
  "fullName": "Bruno Ibiapina",
  "email": "bruno@example.com",
  "password": "Senh@Forte123",
  "acceptedTerms": true
}
```

### POST /api/v1/auth/register — Response (201)

```json
{
  "message": "Conta criada com sucesso. Verifique seu e-mail para ativar.",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### PUT /api/v1/predictions/batch — Request

```json
{
  "poolId": "pool_abc123",
  "predictions": [
    {
      "matchId": "match_001",
      "homeScore": 2,
      "awayScore": 1,
      "knockoutWinnerId": null
    },
    {
      "matchId": "match_002",
      "homeScore": 0,
      "awayScore": 0,
      "knockoutWinnerId": null
    },
    {
      "matchId": "match_003",
      "homeScore": 1,
      "awayScore": 3,
      "knockoutWinnerId": "team_xyz"
    }
  ]
}
```

### PUT /api/v1/predictions/batch — Response (200)

```json
{
  "saved": 3,
  "locked": 0,
  "errors": [],
  "predictions": [
    {
      "matchId": "match_001",
      "homeScore": 2,
      "awayScore": 1,
      "status": "OPEN",
      "updatedAt": "2026-03-30T14:23:00Z"
    }
  ]
}
```

### GET /api/v1/pools/:poolId/ranking — Response (200)

```json
{
  "data": [
    {
      "position": 1,
      "previousPosition": 2,
      "change": "up",
      "user": {
        "id": "user_001",
        "fullName": "Maria Silva",
        "avatarUrl": "https://..."
      },
      "totalPoints": 47,
      "exactScores": 3,
      "correctWinners": 8,
      "totalErrors": 4,
      "isChampion": false
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "totalPages": 1,
    "myPosition": 5,
    "lastCalculatedAt": "2026-03-30T20:15:00Z"
  }
}
```

---

# 22. DOCUMENTAÇÃO TÉCNICA

## 22.1 Padrão de Código

**Backend:** Airbnb TypeScript style guide com ESLint + Prettier. Naming: camelCase para variáveis e funções, PascalCase para classes e types, SCREAMING_SNAKE para enums. Arquivos: kebab-case (ex: `pool-members.service.ts`). Cada módulo é auto-contido com seu controller, service, DTOs.

**Frontend:** Airbnb React style guide com ESLint + Prettier. Componentes: PascalCase (ex: `PoolCard.tsx`). Hooks: camelCase com prefixo "use" (ex: `usePool.ts`). Server Components por padrão, Client Components apenas quando necessário (`'use client'`).

## 22.2 Estratégia de Testes

**Testes unitários:** para scoring engine, tiebreaker engine, validações de DTO, utils. Framework: Jest. Cobertura mínima: 90% para engines e utils.

**Testes de integração:** para controllers + services com banco de teste. Framework: Jest + Supertest + Prisma Test Environment. Banco de teste PostgreSQL em Docker (docker-compose.test.yml).

**Testes de regras de negócio:** cenários completos: criar bolão → entrar → pagar → palpitar → resultado → ranking → campeão. Cenários de borda: empate no topo, chargeback, partida cancelada, bolão sem vencedor.

**Testes de pagamento:** mock do provedor de pagamento (interface permite substituir por mock). Teste de webhook com payload real (salvo em fixtures).

**Testes de sincronização esportiva:** mock da API externa com fixtures de respostas reais. Teste de inconsistência, retry e fallback.

**Testes E2E:** Playwright para fluxos críticos no frontend: cadastro → login → criar bolão → entrar → palpitar. Executados em CI antes de deploy para staging.

---

# 23. ENTREGA EM FASES

## Fase 1: Autenticação e Cadastro (2 semanas)

**Objetivo:** usuários podem criar conta, verificar e-mail, fazer login e gerenciar perfil.

**Entregáveis:** endpoints de auth (register, login, refresh, logout, verify-email, forgot/reset password); modelo de dados: users, profiles, refresh_tokens; frontend: landing page, login, cadastro, verificação de e-mail, recuperação de senha, perfil básico; envio de e-mail transacional (SendGrid); rate limiting e segurança básica; seed de super admin.

**Dependências:** nenhuma.
**Risco:** escolha e configuração do provedor de e-mail. **Mitigação:** usar SendGrid com sandbox para testes.
**Critérios de aceite:** usuário consegue criar conta, receber e-mail, verificar, fazer login, editar perfil; JWT + refresh token funcionando; rate limiting ativo; testes unitários de auth service.

## Fase 2: Bolões e Participantes (2 semanas)

**Objetivo:** organizar pode criar bolões, gerar convites, participantes podem entrar.

**Entregáveis:** CRUD de bolões; link de convite; sistema de membros; roles (organizer, participant); frontend: criar bolão, meus bolões, detalhes do bolão, convite.

**Dependências:** Fase 1 (auth).
**Risco:** complexidade do formulário de regras. **Mitigação:** usar templates pré-definidos no MVP, personalização na V2.
**Critérios de aceite:** criar bolão com regras padrão, gerar link, entrar por convite, listar membros.

## Fase 3: Times, Campeonatos e Partidas (2 semanas)

**Objetivo:** admin pode cadastrar a estrutura esportiva.

**Entregáveis:** CRUD de times, campeonatos, rodadas, partidas; frontend admin: telas de cadastro; importação por CSV.

**Dependências:** Fase 1 (auth + admin role).
**Risco:** modelagem de mata-mata vs pontos corridos. **Mitigação:** campo `isKnockout` flexível.
**Critérios de aceite:** admin cadastra campeonato completo com rodadas e partidas; vincula bolão a campeonato.

## Fase 4: Palpites e Ranking (3 semanas)

**Objetivo:** participantes palpitam, sistema apura e rankeia.

**Entregáveis:** registro de palpites com validação de prazo; travamento automático; scoring engine; tiebreaker engine; recálculo de ranking (BullMQ); frontend: tela de palpites com timer, ranking com destaque.

**Dependências:** Fases 2 e 3.
**Risco:** lógica de pontuação complexa. **Mitigação:** testes unitários extensivos do scoring engine.
**Critérios de aceite:** palpitar, travar no horário correto, registrar resultado, ranking recalculado corretamente; 100% dos cenários de pontuação testados.

## Fase 5: Pagamentos (3 semanas)

**Objetivo:** cobrar taxa de entrada e gerenciar ciclo financeiro.

**Entregáveis:** integração com Mercado Pago (PIX + cartão); geração de link de pagamento; webhook handler; status de pagamento; bloqueio de palpite sem pagamento; expiração automática; frontend: tela de pagamento, status visual.

**Dependências:** Fases 1, 2.
**Risco:** complexidade do webhook e conciliação. **Mitigação:** testes com sandbox do Mercado Pago; idempotência rigorosa.
**Critérios de aceite:** gerar link PIX, pagar no sandbox, webhook processar corretamente, participante liberado automaticamente, expiração funcional.

## Fase 6: Apuração e Campeão (2 semanas)

**Objetivo:** declarar campeão e processar prêmio ao final do bolão.

**Entregáveis:** lógica de encerramento do bolão; declaração de campeão; divisão de prêmio; pódio; frontend: tela do campeão com confetti, ranking final.

**Dependências:** Fases 4, 5.
**Risco:** cenários de empate. **Mitigação:** testes extensivos de desempate.
**Critérios de aceite:** bolão encerra automaticamente, campeão declarado, prêmio calculado, tela do campeão funcional, empates tratados.

## Fase 7: Devolução (1 semana)

**Objetivo:** processar devoluções em cenários de cancelamento ou sem vencedor.

**Entregáveis:** cálculo de devolução proporcional; processamento via API do provedor; frontend: tela de rateio/devolução.

**Dependências:** Fase 5 (pagamentos).
**Risco:** falhas no processamento de reembolso. **Mitigação:** retry com backoff; aprovação manual como fallback.
**Critérios de aceite:** cancelar bolão, devolução calculada e processada, status atualizado.

## Fase 8: Integração com API Esportiva (2 semanas)

**Objetivo:** automatizar cadastro de dados esportivos e resultados.

**Entregáveis:** integração com API-Football; sync de times, campeonatos, partidas, resultados; jobs agendados; tratamento de erros e retry; painel de status da integração.

**Dependências:** Fase 3.
**Risco:** instabilidade da API externa. **Mitigação:** fallback manual sempre disponível; circuit breaker.
**Critérios de aceite:** importar campeonato completo, sync de resultados automático, alerta em caso de divergência, fallback manual funcional.

## Fase 9: Odds Comparativas (1 semana)

**Objetivo:** exibir odds externas como informação comparativa.

**Entregáveis:** integração com The Odds API; snapshots de odds; exibição na tela de palpites; feature flag para ativar/desativar.

**Dependências:** Fase 4 (palpites).
**Risco:** API de odds com quota limitado. **Mitigação:** cache agressivo; feature flag para desligar sem impacto.
**Critérios de aceite:** odds exibidas nos palpites, feature flag funcional, bolão funciona 100% com módulo desligado.

## Fase 10: Auditoria, Relatórios e Hardening (2 semanas)

**Objetivo:** compliance, observabilidade e preparação para produção.

**Entregáveis:** trilha de auditoria completa; relatórios exportáveis; logs estruturados com Pino; error tracking com Sentry; healthchecks; rate limiting refinado; review de segurança; LGPD (export de dados, exclusão de conta); testes E2E com Playwright.

**Dependências:** todas as fases anteriores.
**Risco:** escopo de hardening pode crescer. **Mitigação:** priorizar itens críticos de segurança.
**Critérios de aceite:** auditoria funcional, relatórios exportáveis, zero vulnerabilidades conhecidas no OWASP Top 10, LGPD endpoints funcionais, testes E2E passando.

---

# 24. MVP, V1, V2 E BACKLOG

## MVP (Fases 1-4 + Pagamento simplificado — ~10 semanas)

Escopo: cadastro + login + bolão + convite + palpites + ranking + registro manual de resultados + pagamento via PIX (Mercado Pago). O que NÃO entra no MVP: integração automática com API esportiva (resultados manuais), odds comparativas, relatórios avançados, carteira/extrato, modo mata-mata completo, exportação de dados LGPD, notificações push.

## V1 (MVP + Fases 5-7 completas + Fase 8 — ~16 semanas total)

Adiciona: pagamento completo (cartão + boleto), integração com API esportiva, apuração automática, campeão e devolução, auditoria básica.

## V2 (V1 + Fases 9-10 + melhorias — ~20 semanas total)

Adiciona: odds comparativas, relatórios completos, LGPD, hardening de segurança, testes E2E, notificações avançadas, modo escuro refinado, tela do campeão premium.

## Backlog Futuro

App mobile (React Native/Expo). Login social (Google, Apple). 2FA via TOTP. Chat entre participantes do bolão. Bolões públicos (marketplace). Gamificação (badges, conquistas). Multi-tenant (white-label para empresas). Bolões para outros esportes (basquete, tênis, e-sports). Liga de bolões (meta-competição entre bolões). Integração com Telegram bot. Dashboard analytics avançado (BI). Machine learning para sugestão de palpites.

---

# 25. RECOMENDAÇÕES FINAIS

## 25.1 Stack Final Recomendada

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Next.js 14+ App Router + TypeScript | SSR, performance, ecossistema |
| UI | Tailwind CSS + shadcn/ui | Produtividade, qualidade, acessibilidade |
| Backend | NestJS + TypeScript | Arquitetura modular, type safety e2e |
| Banco | PostgreSQL 16 | Robustez, ACID, JSON, extensões |
| ORM | Prisma | Type safety, migrations, DX |
| Cache/Filas | Redis + BullMQ | Performance, jobs assíncronos |
| Auth | JWT RS256 + Refresh Token | Segurança, escalabilidade |
| Pagamentos | Mercado Pago (principal) + Asaas (backup) | Cobertura PIX/cartão/boleto no BR |
| E-mail | SendGrid | Deliverability, templates, tracking |
| API Esportiva | API-Football (RapidAPI) | Cobertura, tempo real, preço |
| Odds | The Odds API | Agregação, simplicidade |
| Observabilidade | Pino + Sentry + Prometheus | Logs, errors, métricas |
| Deploy Frontend | Vercel | Otimizado para Next.js |
| Deploy Backend | Railway ou Render | Docker, managed DB, DX |
| CI/CD | GitHub Actions | Integração nativa, marketplace |
| Testes | Jest + Supertest + Playwright | Unit + Integration + E2E |

## 25.2 Ordem Ideal para Começar

1. Configurar repositório monorepo com Turborepo (web/ e server/).
2. Configurar Prisma schema e rodar primeira migration.
3. Implementar módulo de auth (register, login, verify, JWT).
4. Criar landing page e fluxo de cadastro/login no frontend.
5. Implementar CRUD de bolões e sistema de membros.
6. Implementar CRUD esportivo (times, campeonatos, partidas).
7. Implementar palpites com travamento.
8. Implementar scoring engine + ranking.
9. Integrar Mercado Pago para pagamento.
10. Testes, hardening e deploy.

## 25.3 Riscos Principais

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| API esportiva indisponível | Média | Médio | Fallback manual, cache, circuit breaker |
| Webhook de pagamento não chega | Baixa | Alto | Conciliação periódica, consulta via polling |
| Chargeback/fraude em pagamento | Baixa | Alto | Audit trail, bloqueio imediato, alerta |
| Inconsistência de resultado | Baixa | Alto | Reprocessamento manual, audit log |
| Escopo creep no motor de regras | Alta | Médio | Templates fixos no MVP, personalização gradual |
| Performance do ranking com muitos participantes | Baixa | Médio | Cálculo assíncrono, cache, batch processing |

## 25.4 Compliance e Posicionamento Legal

> **RECOMENDAÇÃO:** antes de lançar publicamente, consulte um advogado especializado em direito digital e regulamentação de jogos/apostas no Brasil. O sistema foi projetado como bolão social privado, não como casa de apostas, mas a legislação brasileira sobre o tema está em evolução (Lei 14.790/2023 e regulamentações da SPAE/MF). O sistema inclui feature flags para ativar/desativar módulos sensíveis (odds, pagamento) conforme orientação jurídica.

## 25.5 Sugestão de Próximos Prompts

**Prompt 2:** "Agora gere apenas o schema.prisma completo e final para esse sistema, com todos os enums, models, relacionamentos, índices, e o arquivo seed.ts com dados de exemplo para desenvolvimento."

**Prompt 3:** "Agora gere o backend MVP completo em NestJS com TypeScript: módulos de auth (register, login, JWT, verify email), users, pools (CRUD + convite + membros), predictions (CRUD + travamento), rankings (scoring engine + recálculo), e payments (integração Mercado Pago com webhook). Inclua DTOs com validação, guards de role, interceptor de auditoria e testes unitários para o scoring engine."

**Prompt 4:** "Agora gere o frontend completo em Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui: landing page, fluxo de auth (login, cadastro, verify email, reset password), dashboard do usuário, meus bolões, detalhes do bolão com abas (palpites, ranking, jogos, participantes, pagamento), tela de palpites com timer e auto-save, ranking com destaque do líder, e painel admin com cadastro de times, campeonatos e partidas."

**Prompt 5:** "Agora crie o design system completo: paleta de cores (dark/light), tipografia, todos os componentes reutilizáveis (badges de status, cards de bolão, cards de jogo, tabela de ranking com destaque, pódio visual, tela do campeão com confetti, tela de devolução), microinterações e estados visuais. Gere tudo como componentes React com Tailwind + shadcn/ui."

---

*Documento gerado em 30 de março de 2026. Revisão humana obrigatória antes da implementação.*
