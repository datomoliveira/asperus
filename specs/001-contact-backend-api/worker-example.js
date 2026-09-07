/**
 * Código de Referência para a Edge Function de Contato
 * Compatível com Cloudflare Workers ou Supabase Edge Functions (Deno/Node)
 * 
 * Variáveis de ambiente necessárias na nuvem:
 * - RESEND_API_KEY: chave de API obtida no Resend.com
 * - NOTIFICATION_EMAIL: seu e-mail de recebimento (ex: renato@asperus.dev)
 */

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = ["https://asperus.dev", "http://localhost:5500", "http://127.0.0.1:5500"];
    const allowOrigin = allowedOrigins.includes(origin) ? origin : "https://asperus.dev";

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método não permitido" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    try {
      const data = await request.json();
      const { name, email, message, _gotcha } = data;

      // 1. Verificação de Honeypot (Descarte silencioso de bots)
      if (_gotcha && _gotcha.trim().length > 0) {
        return new Response(JSON.stringify({ success: true, message: "Mensagem recebida" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 2. Validação estrita de campos
      if (!name || !email || !message) {
        return new Response(JSON.stringify({ error: "Todos os campos são obrigatórios." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 3. Sanitização de limites
      const cleanName = String(name).slice(0, 100);
      const cleanEmail = String(email).slice(0, 150);
      const cleanMsg = String(message).slice(0, 2000);

      // 4. Disparo via Resend API
      const apiKey = env.RESEND_API_KEY;
      const targetEmail = env.NOTIFICATION_EMAIL || "renato@asperus.dev";

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "ÁSPERUS Contato <onboarding@resend.dev>",
          to: [targetEmail],
          reply_to: cleanEmail,
          subject: `[ÁSPERUS Lead] Nova mensagem de ${cleanName}`,
          html: `
            <div style="font-family: sans-serif; background: #080808; color: #E8E2D9; padding: 24px; border-radius: 8px;">
              <h2 style="color: #C4A96B; margin-top: 0;">Novo Contato Recebido via Site ÁSPERUS</h2>
              <p><strong>Nome:</strong> ${cleanName}</p>
              <p><strong>E-mail:</strong> <a href="mailto:${cleanEmail}" style="color: #C4A96B;">${cleanEmail}</a></p>
              <p><strong>Mensagem:</strong></p>
              <div style="background: #141414; padding: 16px; border-left: 3px solid #C4A96B; border-radius: 4px; white-space: pre-wrap;">${cleanMsg}</div>
            </div>
          `
        })
      });

      if (!resendResponse.ok) {
        const errText = await resendResponse.text();
        console.error("Erro na API do Resend:", errText);
        return new Response(JSON.stringify({ error: "Erro ao enviar e-mail. Tente novamente mais tarde." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Mensagem enviada com sucesso!" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      console.error("Erro inesperado no worker:", err);
      return new Response(JSON.stringify({ error: "Erro interno no processamento." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
