import { transporter } from './mailer';

class EmailService {
  async enviarNotificacaoAtendimento(
    clienteEmail: string,
    clienteNome: string,
    ticketId: number,
    ticketTitulo: string
  ): Promise<void> {
    const config = {
      from: process.env.EMAIL_USER,
      to: clienteEmail,
      subject: `[QuickTickets] Seu chamado #${ticketId} está em atendimento`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f62ac;">Olá, ${clienteNome}!</h2>
          <p style="color: #334155; font-size: 16px;">Boas notícias! O seu chamado <strong>#${ticketId} - ${ticketTitulo}</strong> foi assumido por um de nossos atendentes e agora está em <strong>atendimento</strong>.</p>
          <p style="color: #334155; font-size: 16px;">Você pode acessar o seu painel para acompanhar ou conversar com o atendente pelo chat do chamado.</p>
          <div style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 15px; color: #64748b; font-size: 12px; text-align: center;">
            Equipe QuickTickets - Suporte Acadêmico
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(config);
      console.log(`[Email] Notificação de atendimento enviada para: ${clienteEmail}`);
    } catch (erro) {
      console.error('[Email] Erro ao enviar notificação de atendimento:', erro);
    }
  }

  async enviarNotificacaoPergunta(
    clienteEmail: string,
    clienteNome: string,
    ticketId: number,
    ticketTitulo: string,
    atendenteNome: string,
    mensagem: string
  ): Promise<void> {
    const config = {
      from: process.env.EMAIL_USER,
      to: clienteEmail,
      subject: `[QuickTickets] Nova mensagem no chamado #${ticketId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f62ac;">Olá, ${clienteNome}!</h2>
          <p style="color: #334155; font-size: 16px;">O atendente <strong>${atendenteNome}</strong> enviou uma nova resposta ou pergunta sobre o seu chamado <strong>#${ticketId} - ${ticketTitulo}</strong>:</p>
          
          <div style="background: #f8fafc; border-left: 4px solid #0f62ac; padding: 15px; margin: 20px 0; border-radius: 4px; color: #334155; font-style: italic;">
            "${mensagem}"
          </div>

          <p style="color: #334155; font-size: 16px;">Por favor, acesse o painel e responda ao chamado se necessário.</p>
          <div style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 15px; color: #64748b; font-size: 12px; text-align: center;">
            Equipe QuickTickets - Suporte Acadêmico
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(config);
      console.log(`[Email] Notificação de mensagem enviada para: ${clienteEmail}`);
    } catch (erro) {
      console.error('[Email] Erro ao enviar notificação de mensagem:', erro);
    }
  }

  async enviarNotificacaoFinalizado(
    clienteEmail: string,
    clienteNome: string,
    ticketId: number,
    ticketTitulo: string,
    finalizadoPorNome: string
  ): Promise<void> {
    const config = {
      from: process.env.EMAIL_USER,
      to: clienteEmail,
      subject: `[QuickTickets] Chamado #${ticketId} finalizado`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #10b981;">Olá, ${clienteNome}!</h2>
          <p style="color: #334155; font-size: 16px;">O seu chamado <strong>#${ticketId} - ${ticketTitulo}</strong> foi <strong>finalizado / encerrado</strong> por <strong>${finalizadoPorNome}</strong>.</p>
          <p style="color: #334155; font-size: 16px;">Se o problema persistir ou você tiver novas dúvidas, você poderá abrir um novo chamado a qualquer momento.</p>
          <div style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 15px; color: #64748b; font-size: 12px; text-align: center;">
            Equipe QuickTickets - Suporte Acadêmico
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(config);
      console.log(`[Email] Notificação de finalização enviada para: ${clienteEmail}`);
    } catch (erro) {
      console.error('[Email] Erro ao enviar notificação de finalização:', erro);
    }
  }
}

export default new EmailService();
