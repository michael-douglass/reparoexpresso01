import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Save, X, RotateCcw, Eye, Bell } from 'lucide-react';
import { toast } from "sonner";
import { base44 } from '@/api/base44Client';

const DEFAULT_TERMS = `CONTRATO DE INTERMEDIAÇÃO DE SERVIÇOS - CLIENTE

⚠️ AVISO IMPORTANTE — SÓ FAZEMOS EMERGÊNCIAS
A Reparo Expresso atende EXCLUSIVAMENTE serviços rápidos e emergenciais. NÃO fazemos pré-obra, obra, reforma, construção ou demolição. Se você precisa de qualquer serviço que envolva obra, contrate um profissional especializado por sua conta. Chamados fora do escopo serão cancelados no local com cobrança da taxa de deslocamento.

PARTES E BASE LEGAL
INTERMEDIADORA: REPARO EXPRESSO TECNOLOGIA, CNPJ 39.973.464/0001-10, com sede na Rua Leozino de Oliveira, 273, Bairro Filadélfia, Betim, Minas Gerais, CEP 32670-054.
CLIENTE: Pessoa física ou jurídica que aceita este termo eletronicamente ao solicitar um serviço via plataforma/app Reparo Expresso.
NATUREZA JURÍDICA: Contrato de intermediação de serviços, celebrado por meio eletrônico, nos termos do art. 421-L do Código Civil (Lei 10.406/2002), do Código de Defesa do Consumidor (Lei 8.078/1990), da Lei 12.965/2014 (Marco Civil da Internet) e da Lei 13.709/2018 (LGPD).

1. OBJETO
1.1 A REPARO EXPRESSO TECNOLOGIA é plataforma digital que conecta CLIENTE a prestadores autônomos EXCLUSIVAMENTE para serviços rápidos e emergenciais. A plataforma NÃO realiza pré-obra, obra, reforma, construção ou demolição sob nenhuma hipótese.
1.2 A INTERMEDIADORA não é parte na relação de prestação de serviços entre CLIENTE e prestador, limitando-se a disponibilizar ambiente tecnológico para aproximação das partes.
1.3 Prazo de atendimento estimado será informado na plataforma antes da confirmação do pagamento.

2. PAGAMENTO E TAXA DE URGÊNCIA
2.1 Valor do serviço apresentado antes da confirmação, composto por custo do serviço + taxa de intermediação.
2.2 Taxa de emergência aplicável para chamados noturnos, fins de semana e feriados, informada antes da confirmação.
2.3 Pagamento 100% antecipado via plataforma. Sem pagamento, sem deslocamento.
2.4 Direito de arrependimento no prazo de 7 dias, exclusivamente para serviços agendados ainda não iniciados (art. 49, CDC).

3. ESCOPO E LIMITES DO SERVIÇO EMERGENCIAL
3.1 Serviço emergencial = conter o problema rapidamente. NÃO inclui pré-obra, obra, reforma, construção ou demolição.
3.2 Se no local o prestador identificar necessidade além do emergencial, novo orçamento será gerado e aprovado pelo CLIENTE via app antes da execução.
3.3 Materiais não inclusos. Caso o prestador possua materiais, os valores serão apresentados para aprovação via app.

4. CANCELAMENTO E DESLOCAMENTO
4.1 Cancelamento pelo CLIENTE após o prestador sair para o local: cobrança de taxa de deslocamento.
4.2 Atraso do prestador: se não chegar no prazo informado, CLIENTE tem direito a estorno integral ou remarcação prioritária.
4.3 Cancelamento antes do deslocamento do prestador garante estorno integral.

5. OBRIGAÇÕES DO CLIENTE E SEGURANÇA
5.1 Garantir acesso seguro ao local do serviço.
5.2 PRESENÇA OBRIGATÓRIA: É proibido ao prestador adentrar o imóvel se não houver um maior de 18 anos presente durante toda a execução.
5.3 Sem maior de idade no local, o prestador não iniciará o serviço. Será cobrada taxa de deslocamento e o chamado será cancelado.
5.4 TOLERÂNCIA DE ESPERA: Se o prestador chegar e não encontrar ninguém, aguardará no máximo 15 minutos. Após isso, o chamado será encerrado com cobrança integral da taxa de deslocamento.

6. CONDIÇÕES OPERACIONAIS DO LOCAL
6.1 O CLIENTE declara que o local possui condições mínimas de segurança.
6.2 RECUSA JUSTIFICADA: O prestador pode recusar sem ônus se identificar risco à integridade física, insalubridade extrema ou impedimento técnico.
6.3 Na recusa por falta de condições, será cobrada taxa de deslocamento.
6.4 O prestador registrará com foto/vídeo o motivo da recusa.

7. SERVIÇOS ADICIONAIS NÃO PREVISTOS
7.1 Toda negociação de serviços adicionais deverá ocorrer exclusivamente através da plataforma/app.
7.2 É vedado combinar, executar ou pagar serviços por fora da plataforma.
7.3 Se identificado acordo particular, ambos poderão ser suspensos.

8. ESCOPO DOS SERVIÇOS - LIMITAÇÃO
8.1 SERVIÇOS COBERTOS: Exclusivamente emergenciais e pequenos reparos pontuais que não alterem estrutura principal do imóvel.
8.2 SERVIÇOS NÃO COBERTOS: Obras de qualquer porte, serviços estruturais, pintura de ambientes inteiros, instalações novas complexas, projetos com ART/RRT, serviços em altura superior a 6 metros.
8.3 Chamado fora de escopo: será devida a taxa de deslocamento, mesmo que nenhum serviço seja executado.

9. RESPONSABILIDADE E GARANTIA
9.1 A INTERMEDIADORA não executa o serviço e não garante solução definitiva, apenas o atendimento emergencial.
9.2 Garantia: prazo informado na plataforma, aplicável apenas ao serviço executado.
9.3 A responsabilidade da INTERMEDIADORA limita-se à intermediação.

10. NÃO ALICITAMENTO
10.1 CLIENTE se compromete a não contratar o prestador por fora da plataforma pelo prazo informado no app, sob multa.

11. PROTEÇÃO DE DADOS - LGPD
11.1 Coleta de dados nos termos da Lei 13.709/2018 (LGPD) e Decreto 10.022/2024.
11.2 Direitos do titular: confirmação, acesso, correção, anonimização, bloqueio, portabilidade ou eliminação de dados.
11.3 Dados mantidos pelo prazo necessário para cumprimento do contrato e obrigações legais.

12. BLACKLIST, SUSPENSÃO E RECUSA DE NOVOS CHAMADOS
12.1 A INTERMEDIADORA reserva-se o direito de incluir o CLIENTE em lista interna de restrição (blacklist) e recusar novos chamados em casos de:
  a) Cancelamento reiterado de chamados após deslocamento do prestador;
  b) Ausência injustificada no local por mais de 15 minutos, em mais de uma ocorrência;
  c) Comprovada prática de aliciamento de prestadores;
  d) Comportamento agressivo, ameaça, discriminação ou assédio;
  e) Fraude, chargeback indevido ou pagamento fraudulento;
  f) Falsificação de informações de cadastro;
  g) Violação reiterada dos termos deste contrato.
12.2 A inclusão em blacklist será comunicada ao CLIENTE por meio eletrônico, com indicação do motivo e prazo para defesa.
12.3 O CLIENTE poderá apresentar manifestação de defesa no prazo de 7 dias corridos.
12.4 A recusa de novos chamados não configura discriminação ilícita, tratando-se de exercício regular de direito da INTERMEDIADORA.

13. RESOLUÇÃO DE CONFLITOS
13.1 O CLIENTE tem acesso aos órgãos administrativos de defesa do consumidor (Procon).
13.2 Eventuais demandas judiciais serão dirimidas pelo foro da comarca de Betim/MG.

14. ACEITE E VIGÊNCIA
14.1 Ao solicitar o chamado e confirmar o pagamento, o CLIENTE declara que leu, compreendeu e concorda com todos os termos.
14.2 Este contrato tem validade a partir do aceite eletrônico e permanece vigente por prazo indeterminado.`;

export default function ClientTermsManager() {
  const [mode, setMode] = useState('view');
  const [content, setContent] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifySummary, setNotifySummary] = useState('');

  React.useEffect(() => {
    const stored = localStorage.getItem('client_terms_content');
    if (stored) {
      setContent(stored);
    } else {
      setContent(DEFAULT_TERMS);
      localStorage.setItem('client_terms_content', DEFAULT_TERMS);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('client_terms_content', content);
    localStorage.setItem('client_terms_updated', new Date().toISOString());
    toast.success('Termos salvos com sucesso');
    setMode('view');
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar os termos padrão?')) {
      setContent(DEFAULT_TERMS);
    }
  };

  const handleNotifyClients = async () => {
    try {
      await base44.functions.invoke('notifyClientTermsUpdate', {
        terms_content: content,
        change_summary: notifySummary
      });
      toast.success('Clientes notificados sobre as alterações');
      setShowNotifyModal(false);
      setNotifySummary('');
    } catch (error) {
      toast.error('Erro ao notificar clientes');
      console.error('Erro:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <h3 className="font-bold text-foreground mb-2">📋 Termos de Serviço para Clientes</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os termos e condições que os clientes devem aceitar. Alterações serão notificadas via email e in-app.
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
                <Button
                  onClick={() => setShowNotifyModal(true)}
                  size="sm"
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Bell className="w-4 h-4" /> Notificar Clientes
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
                Última atualização: {new Date(localStorage.getItem('client_terms_updated') || Date.now()).toLocaleDateString('pt-BR')}
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
              <Bell className="w-5 h-5 text-blue-600" />
              Notificar Clientes
            </DialogTitle>
            <DialogDescription>
              Deseja notificar todos os clientes sobre as alterações nos termos?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">
                Resumo da Alteração
              </label>
              <Textarea
                placeholder="Ex: Adicionada política de cancelamento com prazo de 24h..."
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
              onClick={handleNotifyClients}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Bell className="w-4 h-4 mr-2" /> Notificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}