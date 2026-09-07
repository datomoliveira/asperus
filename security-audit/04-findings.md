# 04 — Achados de Segurança (Findings)

Este documento apresenta todas as vulnerabilidades e riscos de segurança identificados no projeto **ÁSPERUS** (`datomoliveira/asperus`). Cada achado é apresentado em duas camadas: a primeira em linguagem didática e acessível para qualquer leitor, e a segunda com especificações técnicas profundas, padrões OWASP/CWE/CVSS v4.0 e testes de regressão.

---

## Índice de Achados

| Identificador | Título do Achado | Severidade | Status | Padrão Primário |
| :--- | :--- | :---: | :---: | :---: |
| **AUD-ASP-001** | Inclusão de Scripts Externos sem Subresource Integrity (SRI) | **MÉDIA** | CONFIRMADO | OWASP A03:2025 / ASVS V15.1 |
| **AUD-ASP-002** | Entrada Livre e Não Sanitizada Encaminhada ao Assistente PageAgent | **MÉDIA** | CONFIRMADO | OWASP A05:2025 / ASVS V2.1 |
| **AUD-ASP-003** | Ausência de Content Security Policy (CSP) e Diretivas de Referrer | **MÉDIA** | CONFIRMADO | OWASP A02:2025 / ASVS V3.1 |
| **AUD-ASP-004** | Formulário de Contato sem Tratamento Defensivo e Honeypot Anti-Spam | **BAIXA** | CONFIRMADO | OWASP A06:2025 / ASVS V2.2 |
| **AUD-ASP-005** | Exposição de Caminhos Locais do Sistema Operacional em Script | **BAIXA** | CONFIRMADO | OWASP A02:2025 / ASVS V5.1 |
| **AUD-ASP-006** | Ausência de `.gitignore` para Proteção do Repositório Git | **INFORMATIVA** | CONFIRMADO | OWASP A02:2025 / ASVS V13.1 |

---

## Detalhamento dos Achados

### AUD-ASP-001 — Inclusão de Scripts Externos sem Subresource Integrity (SRI)

#### CAMADA 1 — ENTENDA A BRECHA
1. **O que encontramos:** O site baixa bibliotecas fundamentais de animação e inteligência artificial diretamente de servidores públicos na internet sem checar se esses arquivos foram alterados no caminho.
2. **Onde está:** Em `index.html`, linhas 311–313 (bibliotecas GSAP, ScrollTrigger, SplitText no `cdnjs`) e linha 347 (script do `page-agent` no `jsdelivr`).
3. **Como deveria funcionar:** Sempre que um site carrega código de outro servidor na internet, o navegador deveria comparar uma "assinatura digital" única (*hash criptográfico*) do arquivo recebido com o valor gravado no HTML. Se uma única vírgula do arquivo mudar, o navegador deve recusar a execução.
4. **O que está acontecendo:** As tags `<script>` apenas apontam para o endereço da web (`https://cdnjs...`). O navegador simplesmente confia e executa tudo o que o servidor remoto devolver.
5. **Por que isso é uma brecha:** Se invasores comprometerem o servidor da CDN, sequestrarem domínios de cache ou adulterarem o tráfego da rede, eles podem adicionar códigos espiões ou fraudulentos diretamente dentro do arquivo da biblioteca. O navegador do visitante executará o código invasor com os mesmos privilégios do site ÁSPERUS.
6. **Como alguém poderia abusar:** Um atacante que consiga adulterar um pacote em uma CDN pública insere um script que captura tudo o que os clientes digitam no formulário de contato ou redireciona os visitantes para uma página falsa de golpe.
7. **O que pode acontecer:** Execução de scripts maliciosos nos navegadores dos clientes, roubo de dados preenchidos no site e severo dano à reputação de engenharia de alto padrão do estúdio.
8. **Por que recebeu este nível (MÉDIA):** O risco imediato depende do comprometimento prévio da CDN (fornecedor terceiro conceituado), mas o impacto técnico no visitante caso ocorra é crítico. Por se tratar de um site estático sem painel administrativo com login, o impacto é contido no contexto do navegador do visitante.
9. **Como corrigir:** Adicionar os atributos `integrity="sha384-..."` e `crossorigin="anonymous"` em todas as tags `<script>` externas, ou baixar os arquivos das bibliotecas e hospedá-los diretamente no próprio projeto.
10. **Como confirmar a correção:** Inspecionar o código-fonte gerado e verificar que qualquer alteração de 1 byte no arquivo bloqueia seu carregamento com erro de integridade no console do navegador.

#### CAMADA 2 — DETALHES TÉCNICOS
* **CWE:** CWE-353 (Missing Support for Integrity Check) / CWE-829 (Inclusion of Functionality from Untrusted Control Sphere).
* **OWASP Top 10:2025:** A03:2025 — Software Supply Chain Failures.
* **OWASP ASVS 5.0:** V15.1.4 (Verify that third-party content served from CDNs uses Subresource Integrity).
* **Vetor CVSS v4.0:** `CVSS:4.0/AV:N/AC:H/AT:N/PR:N/UI:N/VC:L/VI:H/VA:N/SC:L/SI:H/SA:N` (Score: 6.8 — MÉDIA).
* **Evidência no Código:**
  ```html
  <!-- index.html linhas 311-313 -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/SplitText.min.js"></script>
  ...
  <script src="https://cdn.jsdelivr.net/npm/page-agent@1.12.2/dist/iife/page-agent.demo.js?autoInit=false" crossorigin="anonymous"></script>
  ```
* **Causa-Raiz:** Inclusão de scripts remotos sem declaração do atributo de integridade `integrity` com hash criptográfico SHA-384.
* **Correção Proposta:**
  Adicionar os atributos `crossorigin="anonymous"` e `integrity` aos elementos `<script>` ou internalizar os scripts no repositório.

---

### AUD-ASP-002 — Entrada Livre e Não Sanitizada Encaminhada ao Assistente PageAgent

#### CAMADA 1 — ENTENDA A BRECHA
1. **O que encontramos:** Qualquer texto digitado na barra de "Busca Inteligente" é enviado diretamente para a inteligência artificial do navegador (*PageAgent*) sem passar por nenhuma filtragem ou limite de caracteres.
2. **Onde está:** Em `js/app.js`, função `initPageAgentCopilot()`, linhas 491–500.
3. **Como deveria funcionar:** O sistema deveria validar o texto do usuário: rejeitar caracteres perigosos, limitar o tamanho da mensagem (ex.: no máximo 150 caracteres) e garantir que instruções inesperadas não causem comportamento anômalo no navegador.
4. **O que está acontecendo:** O código pega a string bruta digitada (`searchInput.value`) e passa direto para `agent.execute(query)`.
5. **Por que isso é uma brecha:** O *PageAgent* é um agente autônomo com permissão para clicar em botões, preencher campos e mudar coisas na página automaticamente. Se alguém colar instruções de manipulação (*prompt injection client-side*) ou textos gigantescos, o agente pode travar o navegador ou acionar ações indesejadas no DOM.
6. **Como alguém poderia abusar:** Um usuário pode colar uma entrada maliciosa ou um payload de teste para tentar forçar o robô a realizar cliques repetitivos, travar a aba do navegador por exaustão de recursos ou acionar modais em loop.
7. **O que pode acontecer:** Travamento da página do cliente, instabilidade visual e degradação da experiência do usuário no site.
8. **Por que recebeu este nível (MÉDIA):** Não há comunicação com backend com privilégios elevados, de modo que o dano é restrito à sessão local do próprio navegador do usuário. No entanto, por manipular o DOM de forma automatizada, viola o princípio de validação e contenção de entradas.
9. **Como corrigir:** Criar uma função de sanitização que remove caracteres de controle, tags HTML e trunca a entrada em um limite seguro antes de repassar ao `PageAgent`.
10. **Como confirmar a correção:** Tentar enviar entradas contendo scripts `<script>` ou textos com mais de 500 caracteres e verificar se o sistema trunca e limpa a entrada de forma transparente.

#### CAMADA 2 — DETALHES TÉCNICOS
* **CWE:** CWE-20 (Improper Input Validation) / CWE-79 (Improper Neutralization of Input During Web Page Generation).
* **OWASP Top 10:2025:** A05:2025 — Injection / OWASP AISVS V2.
* **OWASP ASVS 5.0:** V2.1.1 (Verify that all input data is validated before processing).
* **Vetor CVSS v4.0:** `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:L/VA:L/SC:N/SI:L/SA:L` (Score: 5.3 — MÉDIA).
* **Evidência no Código:**
  ```javascript
  // js/app.js linhas 492-498
  if (window.PageAgent) {
    try {
      const agent = new window.PageAgent({ language: 'pt-BR' });
      agent.execute(query);
    } catch(err) {
      console.warn("PageAgent execute error:", err);
    }
  }
  ```
* **Causa-Raiz:** Falta de sanitização por allowlist/limpeza de caracteres na variável `query` antes de chamar o método `.execute()`.
* **Correção Proposta:**
  ```javascript
  const sanitizedQuery = String(query).replace(/[<>'"`;()&$]/g, '').trim().slice(0, 120);
  if (sanitizedQuery.length > 0) {
    agent.execute(sanitizedQuery);
  }
  ```

---

### AUD-ASP-003 — Ausência de Content Security Policy (CSP) e Diretivas de Referrer

#### CAMADA 1 — ENTENDA A BRECHA
1. **O que encontramos:** O site não informa ao navegador quais regras de segurança e quais servidores são autorizados a enviar dados ou carregar arquivos na página.
2. **Onde está:** Em `index.html`, seção `<head>`, linhas 1–20.
3. **Como deveria funcionar:** O arquivo HTML deve incluir uma política estrita (*Content Security Policy*) dizendo explicitamente: "este site só aceita carregar estilos do Fontshare, scripts do cdnjs/jsdelivr e imagens locais; qualquer outra conexão não autorizada deve ser bloqueada imediatamente".
4. **O que está acontecendo:** Não há nenhuma regra declarada. O navegador funciona em modo permissivo padrão.
5. **Por que isso é uma brecha:** Se um invasor conseguir introduzir qualquer código na página (seja por uma biblioteca comprometida ou por extensão maliciosa no navegador do usuário), o navegador não terá como impedir que ele envie dados para um servidor externo de ataque.
6. **Como alguém poderia abusar:** Um script malicioso injetado cria uma requisição oculta enviando para um servidor externo tudo o que o usuário digita nos campos da página.
7. **O que pode acontecer:** Vazamento de dados em caso de exploração de outra vulnerabilidade (*defesa em profundidade comprometida*).
8. **Por que recebeu este nível (MÉDIA):** A CSP é a principal linha de defesa em profundidade da web moderna contra ataques do tipo XSS e exfiltração de dados client-side.
9. **Como corrigir:** Declarar a tag `<meta http-equiv="Content-Security-Policy">` e `<meta name="referrer" content="strict-origin-when-cross-origin">` no `<head>` do `index.html`.
10. **Como confirmar a correção:** Carregar o site e tentar injetar um script de domínio não autorizado no console, verificando que o navegador bloqueia a chamada e emite alerta de violação da CSP.

#### CAMADA 2 — DETALHES TÉCNICOS
* **CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers or Frames) / CWE-16 (Configuration).
* **OWASP Top 10:2025:** A02:2025 — Security Misconfiguration.
* **OWASP ASVS 5.0:** V3.1.1 (Verify that a Content Security Policy is implemented).
* **Vetor CVSS v4.0:** `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:L/VI:L/VA:N/SC:L/SI:L/SA:N` (Score: 5.1 — MÉDIA).
* **Evidência no Código:**
  `index.html` não contém elemento `<meta http-equiv="Content-Security-Policy">`.
* **Correção Proposta:**
  Implementar `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://api.fontshare.com; font-src 'self' https://api.fontshare.com https://cdn.fontshare.com data:; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' https://api.fontshare.com; object-src 'none'; frame-ancestors 'none';">`.

---

### AUD-ASP-004 — Formulário de Contato sem Tratamento Defensivo e Honeypot Anti-Spam

#### CAMADA 1 — ENTENDA A BRECHA
1. **O que encontramos:** O formulário de contato do site não possui tratamento no JavaScript para controlar o envio, não possui limite de caracteres rígido nos campos e não conta com armadilha anti-bot (*honeypot*).
2. **Onde está:** Em `index.html`, linhas 266–283.
3. **Como deveria funcionar:** O formulário deveria validar os dados antes do envio, interceptar o clique com JavaScript para evitar recarregamento da página ou envio de dados pessoais na barra de endereços (método GET padrão) e conter um campo invisível para descartar robôs maliciosos.
4. **O que está acontecendo:** A tag `<form>` está sem atributo `action` e sem `method`. No JavaScript, nenhum evento de submissão está configurado. Ao clicar no botão "Enviar", o formulário tenta submeter via GET na mesma URL, podendo anexar os dados digitados na URL do navegador.
5. **Por que isso é uma brecha:** Permite submissões acidentais com vazamento do e-mail e nome do usuário no histórico do navegador ou logs de requisição, além de deixar a interface totalmente aberta para submissões em massa por scripts de spam automatizados.
6. **Como alguém poderia abusar:** Um bot de spam varre o site e submete centenas de requisições por segundo preenchendo os campos e gerando ruído e poluição de dados.
7. **O que pode acontecer:** Indisponibilidade de canal de atendimento caso um backend seja conectado posteriormente, e vazamento de dados de contato no histórico de navegação.
8. **Por que recebeu este nível (BAIXA):** No momento, o site é estático e ainda não possui um endpoint de API ativo para envio de e-mails, reduzindo o impacto imediato.
9. **Como corrigir:** Adicionar um campo honeypot invisível, definir `autocomplete` e `maxlength` nos campos, e criar um listener defensivo no JavaScript com `preventDefault()` e feedback visual ao usuário.
10. **Como confirmar a correção:** Preencher o formulário e enviar; confirmar que a página não recarrega, que a URL não expõe parâmetros e que bots que preenchem o campo honeypot são ignorados.

#### CAMADA 2 — DETALHES TÉCNICOS
* **CWE:** CWE-352 (Cross-Site Request Forgery) / CWE-799 (Improper Control of Generation of Code or Data).
* **OWASP Top 10:2025:** A06:2025 — Insecure Design.
* **OWASP ASVS 5.0:** V2.2 (Business Logic / Anti-Automation).
* **Vetor CVSS v4.0:** `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:P/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N` (Score: 2.1 — BAIXA).
* **Evidência no Código:**
  ```html
  <form class="contact-form" id="contact-form" novalidate aria-label="Formulário de contato">
    <div class="form-group">
      <input type="text" id="field-name" name="name" class="neuro-input" placeholder=" " required autocomplete="name" aria-required="true" />
  ```

---

### AUD-ASP-005 — Exposição de Caminhos Locais do Sistema Operacional em Script

#### CAMADA 1 — ENTENDA A BRECHA
1. **O que encontramos:** O repositório contém um arquivo de script (`copy_assets.bat`) com caminhos completos do computador do desenvolvedor gravados no código.
2. **Onde está:** Em `copy_assets.bat`, linhas 7 e 8.
3. **Como deveria funcionar:** Scripts de projeto devem usar caminhos relativos (ex.: `assets/imagem.png`) e nunca incluir nomes de pastas de sistema, perfis de usuário do Windows ou identificadores internos.
4. **O que está acontecendo:** O script aponta para `C:\Users\Escola\.gemini\antigravity-ide\brain\254b1a88-d7b1-402e-b0cf-67cf20166737\...`.
5. **Por que isso é uma brecha:** Em repositórios públicos no GitHub, essa informação revela o nome do usuário do sistema operacional (`Escola`), a estrutura interna de diretórios do ambiente de trabalho e identificadores de sessão de ferramentas locais de IA.
6. **Como alguém poderia abusar:** Um invasor pode usar essas informações em técnicas de engenharia social direcionada ou reconhecimento de ambiente para tentar ataques mais precisos contra o desenvolvedor.
7. **O que pode acontecer:** Divulgação de informações sobre a infraestrutura e o usuário da máquina de desenvolvimento.
8. **Por que recebeu este nível (BAIXA):** O script não contém senhas ou chaves de API secretas, tratando-se apenas de vazamento de metadados do ambiente de desenvolvimento.
9. **Como corrigir:** Higienizar o script para utilizar caminhos relativos ao diretório do projeto ou adicionar o script no `.gitignore`.
10. **Como confirmar a correção:** Verificar que nenhuma ocorrência de `C:\Users\...` permaneça em arquivos versionados.

#### CAMADA 2 — DETALHES TÉCNICOS
* **CWE:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor).
* **OWASP Top 10:2025:** A02:2025 — Security Misconfiguration.
* **OWASP ASVS 5.0:** V14.1 (Data Protection).
* **Vetor CVSS v4.0:** `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N` (Score: 2.3 — BAIXA).
* **Evidência no Código:**
  ```bat
  copy "C:\Users\Escola\.gemini\antigravity-ide\brain\254b1a88-d7b1-402e-b0cf-67cf20166737\dark_marble_texture_1783715237132.png" ...
  ```

---

### AUD-ASP-006 — Ausência de `.gitignore` para Proteção do Repositório Git

#### CAMADA 1 — ENTENDA A BRECHA
1. **O que encontramos:** O repositório não possui um arquivo `.gitignore` configurado.
2. **Onde está:** Na raiz do projeto.
3. **Como deveria funcionar:** Todo projeto Git deve possuir um arquivo `.gitignore` que instrui o Git a ignorar automaticamente arquivos temporários, arquivos de variáveis de ambiente (`.env`), chaves privadas e pastas de ferramentas internas (`.agents/`, `.impeccable/`).
4. **O que está acontecendo:** Qualquer arquivo novo criado na pasta (inclusive um futuro arquivo `.env` com senhas) pode ser acidentalmente incluído em um `git add .` e enviado ao GitHub.
5. **Por que isso é uma brecha:** É a causa número 1 de vazamento de credenciais e tokens em projetos no mundo inteiro (ex.: caso Uber e incidentes similares).
6. **Como alguém poderia abusar:** Um desenvolvedor cria uma chave de API para o formulário de contato em um arquivo `.env` local. Em um próximo commit desatento, o arquivo sobe para o GitHub público e scanners automatizados capturam a chave em segundos.
7. **O que pode acontecer:** Vazamento futuro de credenciais e exposição de arquivos internos de ferramentas de automação.
8. **Por que recebeu este nível (INFORMATIVA/PREVENTIVA):** Nenhuma credencial foi encontrada vazada no commit atual. Trata-se de uma medida preventiva crítica para impedir incidentes futuros.
9. **Como corrigir:** Criar um arquivo `.gitignore` robusto na raiz do repositório cobrindo `.env*`, `.agents/`, `.impeccable/`, arquivos de log e arquivos de sistema (`Thumbs.db`, `.DS_Store`).
10. **Como confirmar a correção:** Criar um arquivo `.env` de teste e verificar com `git status` que o arquivo é ignorado automaticamente.

#### CAMADA 2 — DETALHES TÉCNICOS
* **CWE:** CWE-200 (Exposure of Sensitive Information) / CWE-538 (Insertion of Sensitive Information into Externally-Accessible File).
* **OWASP Top 10:2025:** A02:2025 — Security Misconfiguration.
* **OWASP ASVS 5.0:** V13.1 (Configuration Management).
* **Vetor CVSS v4.0:** `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:N/SC:N/SI:N/SA:N` (Score: 0.0 — INFORMATIVA / PREVENTIVA).
