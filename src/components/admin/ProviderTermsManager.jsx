import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Eye, RotateCcw, Save, X, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

export default function ProviderTermsManager() {
  const [mode, setMode] = useState('view');
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifySummary, setNotifySummary] = useState('');

  const DEFAULT_TERMS = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS - PRESTADOR

⚠️ AVISO IMPORTANTE — SÓ ATENDEMOS EMERGÊNCIAS
A Reparo Expresso atende EXCLUSIVAMENTE serviços rápidos e emergenciais. NÃO aceitamos pré-obra, obra, reforma, construção ou demolição. Você, prestador, está autorizado a recusar qualquer chamado que configure obra e encerrá-lo no local com cobrança da taxa de deslocamento. NÃO inicie qualquer serviço que envolva obra.

1. PARTES E BASE LEGAL
Contratante: REPARO EXPRESSO TECNOLOGIA, CNPJ 39.973.464/0001-10, com sede na Rua Leozino de Oliveira, 273, Filadélfia, Betim/MG, CEP 32670-054.
Contratado: Prestador de serviços, pessoa física ou jurídica, qualificado pelos dados informados em seu cadastro.
NATUREZA JURÍDICA: Contrato de prestação de serviços autônomos, sem vínculo empregatício, regido pelo Código Civil (Lei 10.406/2002), Marco Civil da Internet (Lei 12.965/2014) e LGPD (Lei 13.709/2018).
INEXISTÊNCIA DE VÍNCULO: A relação não configura vínculo empregatício (art. 442-B da CLT).

2. OBJETO
Prestação de serviços de natureza residencial e veicular EXCLUSIVAMENTE emergencial e rápida, sem subordinação jurídica, com autonomia do Contratado para aceitar ou recusar chamados. A plataforma NÃO realiza pré-obra, obra, reforma, construção ou demolição. O Contratado está autorizado a recusar e encerrar qualquer chamado que configure obra, cobrando a taxa de deslocamento.

3. REMUNERAÇÃO
3.1 Remuneração exclusivamente por serviço efetivamente realizado e concluído através da plataforma.
3.2 Fechamento quinzenal. Após envio da nota fiscal, pagamento em até 7 dias corridos via PIX ou TED.
3.3 Não há garantia de valor mínimo ou pagamento por período à disposição.
3.4 Tributos incidentes são de responsabilidade exclusiva do Contratado.

OBRIGATORIEDADE DE PJ E NOTA FISCAL:
A) ABERTURA DE PESSOA JURÍDICA (PJ): É OBRIGATÓRIO abrir CNPJ (MEI, EIRELI ou outra modalidade) para operar na plataforma.
B) EMISSÃO DE NOTA FISCAL (NF): É OBRIGATÓRIO emitir NF para cada serviço executado.
C) PRÉ-REQUISITO PARA RECEBIMENTO: A NF é pré-requisito obrigatório para recebimento. Sem NF válida, o pagamento é retido.
D) RESPONSABILIDADES FISCAIS: O prestador é 100% responsável por todas as obrigações fiscais, tributárias e previdenciárias.

4. PRAZO E VIGÊNCIA
4.1 Vigência de 12 meses a partir do aceite eletrônico, renovada automaticamente.
4.2 Rescisão a qualquer tempo, mediante aviso prévio de 30 dias.

5. OBRIGAÇÕES DO CONTRATADO
5.1 Emitir nota fiscal no prazo máximo de 2 dias úteis após cada fechamento quinzenal.
5.2 Cumprir prazos e qualidade acordados na plataforma.
5.3 Manter sigilo sobre dados e informações (LGPD).
5.4 Manter regularidade fiscal e cadastral.
5.5 Utilizar EPI adequado e observar normas de segurança do trabalho (NR-6 e NR-12).

6. INDEPENDÊNCIA E AUTONOMIA
6.1 O Contratado atua com total autonomia, sem subordinação jurídica.
6.2 Liberdade plena para aceitar ou recusar serviços, sem penalidade.
6.3 O Contratado define sua própria agenda e horários.
6.4 Não há exclusividade. Pode prestar serviços para terceiros.

7. PADRONIZAÇÃO E IMAGEM
7.1 Uso de uniforme e plotagem nos veículos conforme manual da Contratante.
7.2 Custos de aquisição do uniforme e plotagem suportados pela Contratante.
7.3 Em caso de rescisão, devolver uniformes e remover plotagem em 5 dias úteis.

8. QUALIDADE E REFAÇÃO DE SERVIÇOS
8.1 Se o serviço apresentar vício ou falha, a Contratante poderá acionar outro prestador para refazê-lo.
8.2 O Contratado que executou o serviço com falha não fará jus ao recebimento daquele atendimento.
8.3 Recusa do cliente registrada na plataforma. Contestação em até 48h.

9. RESPONSABILIDADE POR VALORES E INDENIZAÇÃO
9.1 Vedado ao Contratado receber valor diretamente do cliente final.
9.2 Saque ou retenção indevida obriga restituição integral em 48h.
9.3 Prática constitui falta grave e autoriza rescisão imediata por justa causa.

10. FUNDO DE RESERVA
10.1 Retenção de 3% do valor bruto dos serviços para fundo de reserva.
10.2 O fundo funciona também como poupança do Contratado.
10.3 Devolução do saldo após prazo de garantia de 3 meses do desligamento.

11. BÔNUS E INCENTIVOS
A plataforma oferece sistema de bônus baseado em avaliações, metas de qualidade e nível alcançado (Bronze, Prata, Ouro, Platina).

12. SUSPENSÃO E RESCISÃO
12.1 Rescisão imediata por descumprimento grave, uso indevido da marca ou condenação criminal.
12.2 Suspensão temporária em caso de investigação de irregularidade, garantindo contraditório.

13. EXIGÊNCIA DE MAIOR DE IDADE NA RESIDÊNCIA DO CLIENTE
O prestador NÃO PODE, SOB NENHUMA CIRCUNSTÂNCIA, entrar na residência do cliente se não houver um MAIOR DE IDADE (18 anos ou mais) presente.
Procedimento: recusar o serviço, informar via app e retirar-se do local. A plataforma cobrará do cliente a taxa de deslocamento.
Não há exceções. A presença de menores acompanhados apenas por outros menores NÃO atende ao requisito.

14. PROTEÇÃO DE DADOS - LGPD
14.1 O Contratado autoriza o tratamento de seus dados nos termos da Lei 13.709/2018.
14.2 O Contratado compromete-se a tratar com sigilo os dados de clientes acessados via plataforma.

15. SEGURO E RESPONSABILIDADE
O prestador é responsável por manter seguro adequado para sua atividade. A plataforma não se responsabiliza por danos causados por negligência.

16. DISPOSIÇÕES GERAIS
16.1 O Contratado declara não manter vínculo empregatício com a Contratante.
16.2 Alterações somente mediante aditivo ou aceite eletrônico na plataforma.

17. FORO
Fica eleito o foro de Betim/MG para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro.`;

  useEffect(() => {
    const stored = localStorage.getItem('provider_terms_content');
    if (stored) {
      setContent(stored);
      setOriginalContent(stored);
    } else {
      setContent(DEFAULT_TERMS);
      setOriginalContent(DEFAULT_TERMS);
      localStorage.setItem('provider_terms_content', DEFAULT_TERMS);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('provider_terms_content', content);
    setOriginalContent(content);
    setShowNotifyModal(true);
  };

  const handleReset = () => {
    setContent(DEFAULT_TERMS);
    localStorage.setItem('provider_terms_content', DEFAULT_TERMS);
    setOriginalContent(DEFAULT_TERMS);
    toast.success('Termos restaurados para padrão');
  };

  const handleNotifyProviders = async () => {
    if (!notifySummary.trim()) {
      toast.error('Adicione um resumo da alteração');
      return;
    }

    try {
      await base44.functions.invoke('notifyTermsUpdate', {
        terms_content: content,
        change_summary: notifySummary
      });
      toast.success('Prestadores notificados sobre as alterações');
      setShowNotifyModal(false);
      setNotifySummary('');
    } catch (error) {
      toast.error('Erro ao notificar prestadores');
      console.error('Erro:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <h3 className="font-bold text-foreground mb-2">📋 Termos de Serviço para Prestadores</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os termos e condições que os prestadores de serviço devem aceitar. Alterações serão notificadas via email.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Conteúdo dos Termos</CardTitle>
          <div className="flex gap-2">
            {mode === 'view' ? (
              <>
                <Button
                  onClick={() => setMode('edit')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" /> Editar
                </Button>
                <Button
                  onClick={() => setMode('preview')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" /> Visualizar
                </Button>
              </>
            ) : null}
            {mode === 'edit' ? (
              <>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4" /> Salvar
                </Button>
                <Button
                  onClick={() => setMode('view')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <X className="w-4 h-4" /> Cancelar
                </Button>
              </>
            ) : null}
            {mode === 'preview' ? (
              <Button
                onClick={() => setMode('view')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <X className="w-4 h-4" /> Fechar
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {mode === 'edit' && (
            <>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-96 font-mono text-sm"
                placeholder="Edite os termos aqui..."
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Restaurar Padrão
                </Button>
                <span className="text-xs text-muted-foreground self-center">
                  Alterações são salvas automaticamente no navegador.
                </span>
              </div>
            </>
          )}

          {mode === 'view' && (
            <div className="text-sm text-muted-foreground">
              ✓ Termos salvos
              <p className="mt-2 text-xs">
                Última atualização: {new Date(localStorage.getItem('provider_terms_updated') || Date.now()).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          {mode === 'preview' && (
            <div className="bg-background rounded-lg p-4 min-h-96 overflow-y-auto border border-border whitespace-pre-wrap text-sm leading-relaxed">
              {content}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Notificação */}
      <Dialog open={showNotifyModal} onOpenChange={setShowNotifyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              Notificar Prestadores
            </DialogTitle>
            <DialogDescription>
              Deseja notificar todos os prestadores sobre as alterações nos termos?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">
                Resumo da Alteração
              </label>
              <Textarea
                placeholder="Ex: Adicionada cláusula sobre horários de deslocamento..."
                value={notifySummary}
                onChange={(e) => setNotifySummary(e.target.value)}
                className="min-h-24"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              onClick={() => setShowNotifyModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleNotifyProviders}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              <Bell className="w-4 h-4 mr-2" /> Notificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}