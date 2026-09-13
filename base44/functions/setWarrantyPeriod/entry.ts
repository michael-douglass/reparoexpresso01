import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { serviceRequestId, days, force = false } = await req.json();

    if (!serviceRequestId) {
      return Response.json({ error: 'serviceRequestId é obrigatório' }, { status: 400 });
    }

    // Busca o serviço
    const service = await base44.entities.ServiceRequest.get(serviceRequestId);
    if (!service) {
      return Response.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // Dias de garantia: informado > padrão da categoria > 90
    let warrantyDays = Number(days) && Number(days) > 0 ? Math.floor(Number(days)) : null;
    if (!warrantyDays) {
      try {
        const pricings = await base44.entities.ServicePricing.filter({ service_type: service.service_type });
        const catPricing = pricings.find(p => !p.city && !p.state);
        warrantyDays = (catPricing?.warranty_days && Number(catPricing.warranty_days) > 0)
          ? Math.floor(Number(catPricing.warranty_days))
          : 90;
      } catch {
        warrantyDays = 90;
      }
    }

    // Se já tem garantia definida e não forçou sobrescrita, não altera
    if (!force && service.warranty_end_date && service.warranty_status === 'ativa') {
      return Response.json({
        message: 'Garantia já estava definida',
        warranty_end_date: service.warranty_end_date,
      });
    }

    // Calcula data de término a partir da conclusão (updated_date) ou de agora
    const baseDate = service.status === 'concluido' && service.updated_date
      ? new Date(service.updated_date)
      : new Date();
    const warrantyEndDate = new Date(baseDate);
    warrantyEndDate.setDate(warrantyEndDate.getDate() + warrantyDays);

    const isExpired = warrantyEndDate < new Date();

    // Atualiza o serviço com a garantia
    await base44.entities.ServiceRequest.update(serviceRequestId, {
      warranty_end_date: warrantyEndDate.toISOString(),
      warranty_status: isExpired ? 'expirada' : 'ativa',
    });

    return Response.json({
      success: true,
      warranty_end_date: warrantyEndDate.toISOString(),
      warranty_days: warrantyDays,
      warranty_status: isExpired ? 'expirada' : 'ativa',
      message: `Garantia de ${warrantyDays} dias ${isExpired ? 'registrada (expirada retroativamente)' : 'ativada com sucesso'}`,
    });
  } catch (error) {
    console.error('Erro ao definir garantia:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});