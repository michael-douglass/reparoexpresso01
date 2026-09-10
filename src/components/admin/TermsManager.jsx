import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Check, X, Eye, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TermsManager() {
  const [termsContent, setTermsContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    try {
      setLoading(true);
      // Tenta carregar do localStorage primeiro (para fazer persistência local)
      const localTerms = localStorage.getItem('client_terms_content');
      if (localTerms) {
        setTermsContent(localTerms);
        setOriginalContent(localTerms);
      } else {
        // Termos padrão se não houver salvos
        const defaultTerms = getDefaultTerms();
        setTermsContent(defaultTerms);
        setOriginalContent(defaultTerms);
      }
    } catch (err) {
      console.error('Erro ao carregar termos:', err);
      const defaultTerms = getDefaultTerms();
      setTermsContent(defaultTerms);
      setOriginalContent(defaultTerms);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTerms = () => `CONTRATO DE INTERMEDIAÇÃO DE SERVIÇOS - CLIENTE

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

  const handleSave = async () => {
    try {
      setSaving(true);
      // Salva no localStorage para persistência
      localStorage.setItem('client_terms_content', termsContent);
      setOriginalContent(termsContent);
      toast.success('Termos atualizados com sucesso!');
      setEditing(false);
      // Mostra modal para notificar clientes
      setShowNotifyModal(true);
    } catch (err) {
      toast.error('Erro ao salvar termos');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleNotifyClients = async () => {
    try {
      setNotifying(true);
      const response = await base44.functions.invoke('notifyTermsUpdate', {
        terms_content: termsContent,
        change_summary: changeSummary,
      });
      
      if (response.data?.notified) {
        toast.success(`✅ ${response.data.notified} cliente(s) notificado(s) sobre a alteração dos termos`);
      } else {
        toast.info('Nenhum cliente para notificar');
      }
      setShowNotifyModal(false);
      setChangeSummary('');
    } catch (err) {
      toast.error('Erro ao notificar clientes');
      console.error(err);
    } finally {
      setNotifying(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Deseja restaurar os termos padrão? Esta ação não pode ser desfeita.')) {
      const defaultTerms = getDefaultTerms();
      setTermsContent(defaultTerms);
      localStorage.setItem('client_terms_content', defaultTerms);
      setEditing(false);
      toast.success('Termos restaurados para o padrão');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Termo de Uso - Cliente</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="rounded-lg"
            >
              <Eye className="w-4 h-4 mr-1" /> {showPreview ? 'Editar' : 'Visualizar'}
            </Button>
            {!editing && (
              <Button
                size="sm"
                onClick={() => setEditing(true)}
                className="rounded-lg bg-primary text-primary-foreground"
              >
                <Pencil className="w-4 h-4 mr-1" /> Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <Textarea
                value={termsContent}
                onChange={(e) => setTermsContent(e.target.value)}
                className="min-h-96 rounded-lg font-mono text-sm"
                placeholder="Edite o conteúdo do termo aqui..."
              />
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    loadTerms();
                  }}
                  className="rounded-lg"
                >
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetToDefault}
                  className="rounded-lg text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  Restaurar padrão
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </>
          ) : showPreview ? (
            <div className="bg-muted/30 rounded-lg p-6 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {termsContent}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-semibold mb-2">ℹ️ Informações</p>
              <ul className="space-y-1 text-xs">
                <li>• Este termo é exibido para clientes no momento do cadastro</li>
                <li>• O cliente deve aceitar para completar o registro</li>
                <li>• Alterações aplicam-se imediatamente a novos cadastros</li>
                <li>• Use a visualização para verificar como o termo aparecerá</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de notificação de clientes */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Notificar Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Os termos foram atualizados. Deseja notificar os clientes sobre a alteração?
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Resumo da alteração <span className="text-muted-foreground">(opcional)</span>
                </label>
                <Textarea
                  placeholder="Ex: Adicionada nova política de cancelamento..."
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="min-h-20 rounded-lg"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                <p className="font-semibold mb-1">ℹ️ O que acontece:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Email será enviado para todos os clientes cadastrados</li>
                  <li>Eles verão os novos termos na próxima solicitação de serviço</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNotifyModal(false);
                    setChangeSummary('');
                  }}
                  disabled={notifying}
                  className="rounded-lg"
                >
                  Não notificar
                </Button>
                <Button
                  onClick={handleNotifyClients}
                  disabled={notifying}
                  className="rounded-lg bg-primary text-primary-foreground"
                >
                  {notifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" /> Notificar Clientes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}