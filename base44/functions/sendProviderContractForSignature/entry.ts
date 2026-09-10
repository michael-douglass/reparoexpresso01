import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { provider_id, contract_content } = body;

    if (!provider_id) {
      return Response.json({ error: 'provider_id is required' }, { status: 400 });
    }

    const provider = await base44.asServiceRole.entities.Provider.get(provider_id);
    if (!provider) {
      return Response.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Atualiza o contrato preenchido e marca o envio
    const now = new Date().toISOString();
    const updateData = {
      is_approved: true,
      contract_sent_at: now
    };
    if (contract_content) {
      updateData.contract_content = contract_content;
    }

    await base44.asServiceRole.entities.Provider.update(provider_id, updateData);

    // Envia e-mail com o contrato para assinatura
    if (provider.email) {
      const emailBody = `Olá ${provider.name},

Seu cadastro foi aprovado na Reparo Expresso! 🎉

Para começar a receber chamados, você precisa assinar eletronicamente o Contrato de Credenciamento.

Acesse o aplicativo, vá na aba "Termos" e revise/aceite o contrato personalizado com seus dados.

Contrato enviado em: ${new Date(now).toLocaleString('pt-BR')}

---
Reparo Expresso`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: provider.email,
        subject: '✅ Cadastro Aprovado — Assine seu Contrato de Credenciamento',
        body: emailBody
      }).catch(err => console.error('Erro ao enviar email:', err));
    }

    // Cria notificação in-app para o prestador
    await base44.asServiceRole.entities.ProviderNotification.create({
      provider_id: provider.id,
      provider_email: provider.email,
      type: 'terms_update',
      title: '✅ Cadastro Aprovado — Assine seu Contrato',
      message: 'Seu cadastro foi aprovado! Acesse a aba "Termos" no aplicativo para revisar e assinar eletronicamente seu Contrato de Credenciamento personalizado com seus dados.',
      action_url: '/prestador'
    }).catch(err => console.error('Erro ao criar notificação:', err));

    return Response.json({
      success: true,
      provider_id,
      sent_at: now
    });
  } catch (error) {
    console.error('Error in sendProviderContractForSignature:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}