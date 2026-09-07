# Lista de Tarefas: Conexão do Formulário de Contato a Backend Serverless

<!-- specify:tasks 1.0.0 -->
**Especificação:** `specs/001-contact-backend-api/spec.md`  
**Plano Técnico:** `specs/001-contact-backend-api/plan.md`  
**Status Geral:** [0 / 6 Concluído]

---

## Checklist de Execução

### Fase 1: Infraestrutura de Nuvem & Provedor
- [ ] **TASK-01:** Criar conta gratuita no serviço de envio de e-mails (recomendado: [Resend.com](https://resend.com)) e gerar a API Key.
  * *Critério de Verificação:* API Key gerada no painel do Resend.
- [ ] **TASK-02:** Configurar a Edge Function (Cloudflare Worker ou Supabase Edge Function) e adicionar a variável de ambiente secreta `RESEND_API_KEY`.
  * *Critério de Verificação:* Rota responde a requisição `OPTIONS` com headers CORS corretos.

### Fase 2: Implementação da Rota Serverless
- [ ] **TASK-03:** Fazer deploy do código da função serverless (usando como base `specs/001-contact-backend-api/worker-example.js`).
  * *Critério de Verificação:* Teste manual via cURL/Postman dispara e-mail de teste para `renato@asperus.dev`.

### Fase 3: Conexão no Frontend
- [ ] **TASK-04:** Atualizar a função `initContactForm()` em `js/app.js` para enviar o payload JSON via `fetch` assíncrono para o endpoint da função.
  * *Critério de Verificação:* Envio a partir do navegador invoca a Edge Function e recebe resposta HTTP 200.
- [ ] **TASK-05:** Atualizar a diretiva `connect-src` na tag Content-Security-Policy do `index.html` para incluir a URL da Edge Function.
  * *Critério de Verificação:* O console do navegador não acusa erro de bloqueio de CSP durante o envio.
- [ ] **TASK-06:** Testar preenchimento legítimo e simular preenchimento com honeypot (garantindo que bots não gerem e-mails).
  * *Critério de Verificação:* Formulário exibe microanimação de sucesso em ambos os casos, mas apenas o envio legítimo chega na caixa postal.
