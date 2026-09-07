# 07 — Limitações e Itens Não Testados (Limitations)

Em estrita conformidade com as regras éticas, de autorização e de não destruição do padrão de auditoria, este documento registra com total transparência os componentes, cenários e camadas que **NÃO foram testados dinamicamente** e os motivos correspondentes.

---

## 1. Limitações Metodológicas Declaradas

1. **Testes Ativos em Produção e Domínios Hospedados (NÃO REALIZADOS):**
   * Por determinação de escopo e autorização restrita a arquivos locais (`STATIC_ONLY`), nenhum teste ativo, escaneamento de portas, varredura de vulnerabilidades ou injeção de tráfego foi executado contra domínios web públicos ou infraestrutura de nuvem onde o site estiver publicado.
2. **Infraestrutura de Rede e Borda de Nuvem (Cloudflare / WAF / DNS):**
   * O código-fonte estático não contém as configurações de borda da nuvem (Cloudflare, Vercel ou GitHub Pages). Controles de WAF, taxa de requisições de DNS, certificados SSL de terminação e regras de cabeçalho de resposta HTTP dependem da inspeção direta no painel do provedor de nuvem.
3. **Backend e Envio Real de E-mails:**
   * O repositório atual de **ÁSPERUS** é um projeto frontend puro. A análise não cobriu eventuais microsserviços, funções serverless (como Edge Functions Supabase ou AWS Lambda) ou bancos de dados remotos que possam ser conectados futuramente ao formulário de contato.
4. **Projeto Paralelo "Personal Stylist":**
   * O projeto localizado no diretório irmão `../Personal Stylist`, embora com arquivos abertos no editor durante o início da sessão, foi formalmente excluído da auditoria a pedido do responsável para focar exclusivamente no **ÁSPERUS**.

---

## 2. Requisitos do OWASP ASVS Não Aplicáveis (N/A)

Os seguintes capítulos do padrão ASVS 5.0 foram avaliados e classificados como **Não Aplicáveis** devido à natureza 100% estática e pública do site:

* **V6 — Autenticação:** A aplicação não possui sistema de cadastro ou login de usuários.
* **V7 — Gerenciamento de Sessão:** O site não emite cookies de sessão autenticada.
* **V8 — Autorização e Controle de Acesso:** Não há distinção de papéis de usuários (admins, clientes, visitantes); todas as páginas e assets são públicos.
* **V9 — Tokens JWT / Self-contained Tokens:** Não há geração ou validação de tokens JWT.
* **V10 — Federação OAuth / OIDC:** Não há integração de login social.
* **V17 — WebRTC:** Não há comunicação multimídia ponto-a-ponto implementada.

---

## 3. Grau de Confiança e Recomendações Futuras

* **Nível de Confiança nos Resultados:** **ALTO** para a integridade, dependências e segurança do código-fonte client-side.
* **Recomendação para Próxima Etapa:** Após o deploy da aplicação em ambiente de testes (*staging*), realizar uma auditoria dinâmica com ferramentas de verificação de cabeçalhos de segurança (ex.: Mozilla Observatory e SecurityHeaders.com) para validar os headers HTTP efetivos injetados pelo servidor web.
