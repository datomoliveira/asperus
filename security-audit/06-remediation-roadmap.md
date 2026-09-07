# 06 — Roteiro de Remediação (Remediation Roadmap)

Este roteiro estabelece o plano de ação priorizado para corrigir as vulnerabilidades e implementar as defesas identificadas na auditoria do **ÁSPERUS** (`datomoliveira/asperus`). As ações estão ordenadas pelo impacto na redução de risco real.

---

## 1. Quick Wins (Ações Imediatas — 24h a 48h)

| Ação | Achado Relacionado | Esforço Técnico | Redução de Risco | Responsável |
| :--- | :---: | :---: | :---: | :---: |
| **Criação do `.gitignore`** | AUD-ASP-006 | Muito Baixo (5 min) | Alta (Prevenção de vazamentos) | datomoliveira |
| **Implementação de CSP e Referrer** | AUD-ASP-003 | Baixo (15 min) | Alta (Defesa em profundidade) | datomoliveira |
| **Subresource Integrity (SRI) nos scripts de CDN** | AUD-ASP-001 | Baixo (20 min) | Alta (Proteção de supply chain) | datomoliveira |
| **Sanitização de Caminhos em `copy_assets.bat`** | AUD-ASP-005 | Muito Baixo (5 min) | Média (Higienização de metadados) | datomoliveira |

---

## 2. Correções Estruturais e de Lógica (Curto Prazo — até 7 dias)

### 2.1 Sanitização Defensiva de Entrada para o PageAgent (AUD-ASP-002)
* **Objetivo:** Filtrar a string de busca digitada pelo usuário antes de acionar `agent.execute()`.
* **Implementação:**
  * Limitar a entrada a no máximo 120 caracteres.
  * Remover caracteres especiais que possam alterar a estrutura semântica de comandos (`<`, `>`, `"`, `'`, `;`, `&`, `$`).
  * Rejeitar consultas puramente vazias ou formadas apenas por espaços.
* **Critério de Aceitação:** Enviar payloads com tags HTML e comandos maliciosos no modal de busca e confirmar que são higienizados sem quebrar o agente.

### 2.2 Proteção e Defesa do Formulário de Contato (AUD-ASP-004)
* **Objetivo:** Evitar submissão automatizada de spam e impedir recarregamento indesejado com vazamento de dados em URL.
* **Implementação:**
  * Adicionar campo honeypot invisível para descarte de bots (`input.honeypot-field`).
  * Adicionar ouvinte `submit` no JavaScript com `e.preventDefault()`.
  * Adicionar atributos `maxlength` e `autocomplete` estritos nos campos.
  * Fornecer feedback visual animado de confirmação diretamente na interface.
* **Critério de Aceitação:** Testar preenchimento legítimo (exibe feedback com sucesso sem recarregar tela) e preenchimento com honeypot (descarta silenciosamente sem executar nada).

---

## 3. Ações Estratégicas e Arquiteturais (Médio a Longo Prazo — 30 a 90 dias)

### 3.1 Self-Hosting de Bibliotecas de Terceiros (Vendor Bundle)
* **Objetivo:** Hospedar Three.js e GSAP sob o mesmo domínio da aplicação (`/vendor/three.min.js`, `/vendor/gsap.min.js`), reduzindo a zero a dependência de disponibilidade e segurança de CDNs externas.
* **Esforço:** Médio.
* **Risco Residual Atual:** Baixo (após aplicação de SRI e CSP).

### 3.2 Conexão com Endpoint de API Serverless Seguro para Envio de E-mail
* **Objetivo:** Caso o estúdio deseje receber as mensagens reais do formulário, implementar uma Edge Function segura (ex.: Cloudflare Workers ou Supabase Edge Function) com rate-limiting por IP e integração com serviço de e-mail transacional (Resend/SendGrid) com credenciais armazenadas estritamente em Secrets Management.
