# Especificação: Conexão do Formulário de Contato a Backend Serverless

<!-- specify:spec 1.0.0 -->
**Identificador:** `specs/001-contact-backend-api/spec.md`  
**Autor:** Renato Maia (`datomoliveira`) / Antigravity AI  
**Status:** Aprovado para Implementação Futura  
**Data:** 2026-09-07

---

## 1. Contexto & Motivação (O Porquê)
O site ÁSPERUS possui um formulário de contato visualmente polido (`#contact-form`), mas que atualmente simula o envio no cliente com um temporizador artificial. Para transformar o site em uma máquina ativa de geração de negócios e captura de leads qualificados (fundadores, CTOs e líderes técnicos), é necessário conectar este formulário a uma rota serverless segura que dispare notificações por e-mail em tempo real diretamente para `renato@asperus.dev`.

---

## 2. Histórias de Usuário (User Stories)
* **Como** potencial cliente ou parceiro comercial navegando no ÁSPERUS,
* **Eu quero** enviar uma mensagem com meu nome, e-mail e resumo da minha demanda técnica através do formulário de contato,
* **Para que** Renato Maia receba meu contato imediatamente e eu obtenha um retorno comercial rápido.

* **Como** engenheiro e proprietário do ÁSPERUS,
* **Eu quero** que o endpoint de contato filtre bots, aplique rate-limiting por IP e envie um e-mail estruturado e limpo,
* **Para que** eu não receba spam e mantenha a infraestrutura dentro dos limites gratuitos de provedores serverless.

---

## 3. Escopo

### 3.1 Dentro do Escopo (In-Scope)
* Criação de especificação de contrato de API REST (POST `/api/contact`).
* Validação de payload no servidor: nome (obrigatório, max 100 chars), e-mail (válido, max 150 chars), mensagem (obrigatória, max 2000 chars).
* Verificação de Honeypot (`_gotcha` / `_hp_website`): rejeitar silenciosamente requisições onde o campo invisível foi preenchido.
* Rate limiting preventivo (máximo de 3 mensagens por IP a cada 10 minutos).
* Envio do e-mail via serviço transacional seguro (Resend, SendGrid ou Cloudflare MailChannels).
* Resposta padronizada JSON (`{ "success": true, "message": "Mensagem enviada com sucesso" }`).

### 3.2 Fora do Escopo (Out-of-Scope)
* Criação de banco de dados relacional complexo para armazenamento de histórico de leads (pode ser adicionado em spec futura).
* Envio de anexos ou upload de arquivos no formulário de contato.

---

## 4. Requisitos Funcionais
* **RF-01:** O frontend deve interceptar o envio, verificar os campos no cliente e enviar uma requisição `fetch` assíncrona com `POST` para o endpoint configurado.
* **RF-02:** O backend deve validar o schema dos dados. Se faltar algum campo, retornar status HTTP 400 com mensagem clara.
* **RF-03:** Se o campo honeypot estiver preenchido, o backend deve simular sucesso (HTTP 200) mas descartar o envio para desestimular tentativas de contorno de bots.
* **RF-04:** Após o envio bem-sucedido, o formulário deve limpar os campos e exibir o estado de sucesso com as microanimações existentes.

---

## 5. Requisitos Não Funcionais
* **RNF-01 (Segurança):** Credenciais e chaves de envio de e-mail (ex: `RESEND_API_KEY`) devem ser injetadas exclusivamente via variáveis de ambiente da nuvem (Cloudflare Secrets ou Supabase Secrets), nunca no código client-side.
* **RNF-02 (Performance):** A resposta da API deve ocorrer em menos de 800ms.
* **RNF-03 (CORS):** O endpoint deve permitir apenas requisições originadas do domínio oficial `https://asperus.dev` (e `localhost` em desenvolvimento).

---

## 6. Casos de Borda (Edge Cases)
1. **Falha na rede do cliente:** Se o fetch falhar por queda de conexão, o botão deve retornar ao estado normal e exibir: *"Falha na conexão. Tente novamente ou use o e-mail direto renato@asperus.dev"*.
2. **Esgotamento de cota do provedor de e-mail:** O backend deve registrar erro interno no log e retornar mensagem amigável sem expor detalhes técnicos do provedor.

---

## 7. Critérios de Aceite
- [ ] O envio a partir do site chega na caixa de entrada `renato@asperus.dev` em menos de 10 segundos.
- [ ] Submissões com honeypot preenchido não geram e-mails.
- [ ] Tentativas de envio em massa pelo mesmo IP são bloqueadas com HTTP 429 após 3 envios rápidos.
- [ ] Zero chaves ou segredos presentes no código do repositório.
