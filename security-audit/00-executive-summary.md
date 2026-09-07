# 00 — Sumário Executivo de Segurança da Informação

**Projeto Auditado:** ÁSPERUS (`datomoliveira/asperus`)  
**Data da Auditoria:** 07 de setembro de 2026  
**Versão do Framework:** OWASP ASVS 5.0 (Nível 2) / OWASP Top 10:2025 / NIST CSF 2.0  
**Commit Analisado:** `df375d61cb6473eab6f8c0dd9bcf2fa7dc33c9be` (Branch `main`)  
**Ambiente:** Código-Fonte Estático Local (`STATIC_ONLY`)  
**Responsável Autorizado:** Renato Maia (`datomoliveira`)  
**Veredicto Geral:** **POSTURA DEFENSIVA BASELINE COM RISCOS MODERADOS DE SUPPLY CHAIN E EXECUÇÃO CLIENT-SIDE** (Confiança: ALTA para análise de código-fonte estático).

---

## 1. Visão Geral e Veredicto Executivo

O **ÁSPERUS** é um estúdio digital e portfólio de engenharia de software de alta performance técnica, implementado como aplicação web estática client-side (HTML5, CSS3 moderno, ES Modules, Three.js e GSAP). A arquitetura local examinada não possui componentes de backend legados, banco de dados relacional ou servidores dinâmicos sob este repositório, o que reduz substancialmente a superfície clássica de ataques como SQL Injection no servidor e Server-Side Request Forgery (SSRF).

Contudo, a aplicação depende criticamente de **scripts externos carregados em tempo de execução via CDNs públicas** sem verificação criptográfica de integridade (*Subresource Integrity — SRI*) e sem uma política restritiva de segurança de conteúdo (*Content Security Policy — CSP*). Além disso, a presença de uma ferramenta de agente autônomo em página (*PageAgent*) exposta a entradas livres do usuário e a ausência de proteções contra bots no formulário de contato representam exposições que devem ser mitigadas para garantir a resiliência do produto.

---

## 2. Métricas de Vulnerabilidades por Severidade

| Severidade | Confirmado | Provável | Hipótese | Total |
| :--- | :---: | :---: | :---: | :---: |
| **Crítica** | 0 | 0 | 0 | **0** |
| **Alta** | 0 | 0 | 0 | **0** |
| **Média** | 2 | 0 | 0 | **2** |
| **Baixa** | 2 | 0 | 0 | **2** |
| **Informativa** | 1 | 0 | 1 | **2** |
| **Total** | **5** | **0** | **1** | **6** |

*Nota metodológica: Nenhuma vulnerabilidade teórica foi classificada como confirmada sem evidência de rastreamento estático no código.*

---

## 3. Os 5 Principais Riscos em Linguagem de Negócio

1. **Comprometimento de Cadeia de Suprimentos via CDN (Risco Médio/Alto Potencial):** Scripts essenciais para o funcionamento do site (Three.js, GSAP, PageAgent) são baixados diretamente de servidores de terceiros sem validação de hash (`integrity`). Caso uma dessas CDNs ou redes intermediárias sofra sequestro ou injeção maliciosa, atacantes poderiam alterar o código executado nos navegadores dos clientes da ÁSPERUS para exibir conteúdo fraudulento ou capturar informações.
2. **Execução Irrestrita de Comandos no Assistente Client-Side (Risco Médio):** A barra de busca inteligente delega termos de pesquisa não sanitizados ao `PageAgent.execute()`. Como agentes em página possuem capacidade de interagir com o DOM e acionar cliques/navegação, entradas maliciosas ou complexas poderiam desestabilizar a interface do visitante.
3. **Ausência de Content Security Policy (CSP) (Risco Médio):** O navegador não recebe diretivas restritivas sobre quais fontes de script, estilos ou conexões são permitidas. Na ocorrência de um XSS ou script adulterado, a política do navegador não bloquearia a exfiltração de dados.
4. **Formulário de Contato Desprotegido contra Abuso Automatizado (Risco Baixo):** O formulário `#contact-form` não possui validação de submissão no cliente, mecanismos de honeypot ou rate limiting preventivo, abrindo brecha para spam ou submissão acidental de dados pessoais em URLs não criptografadas.
5. **Vazamento de Metadados e Caminhos do Sistema Operacional (Risco Baixo):** O script `copy_assets.bat` presente no repositório público expõe caminhos absolutos do sistema de arquivos local (`C:\Users\Escola\...`) e identificadores internos de conversas do ambiente de desenvolvimento.

---

## 4. Controles Fortes Comprovados

* **Ausência de Sinks de Risco Crítico:** Não foram encontradas chamadas a `eval()`, `document.write()` ou injeções arbitrárias de `innerHTML` com entradas de usuários no código desenvolvido internamente.
* **Isolamento de Links Externos:** Os links externos principais (como o GitHub) já empregam `rel="noopener noreferrer"`, prevenindo ataques de *reverse tabnabbing*.
* **Sem Segredos em Repositório:** A varredura de credenciais confirmou ausência de tokens de API, senhas ou chaves privadas no código estático.

---

## 5. Plano de Remediação Temporal

* **Imediato (24h a 48h):** Implementar `.gitignore` para bloquear artefatos locais; aplicar tags `<meta>` de Content Security Policy (CSP) e Subresource Integrity (SRI) nos scripts de CDN; higienizar `copy_assets.bat`.
* **Curto Prazo (até 7 dias):** Sanitizar a entrada de consultas fornecidas ao assistente `PageAgent` e adicionar listener com prevenção de envio indevido e honeypot anti-spam no formulário de contato.
* **Médio Prazo (até 30 dias):** Avaliar hospedagem local (*self-hosting*) das bibliotecas críticas (Three.js e GSAP) sob o mesmo domínio, eliminando integralmente a dependência de CDNs de terceiros.
* **Estratégico (até 90 dias):** Estabelecer pipeline de CI/CD com linters de segurança automatizados e escaneamento contínuo de dependências.
