# 01 — Escopo e Metodologia da Auditoria

**Projeto:** ÁSPERUS (`datomoliveira/asperus`)  
**Data:** 07 de setembro de 2026  
**Responsável Técnico:** Renato Maia (`datomoliveira`)  
**Modo de Auditoria:** `STATIC_ONLY` (Análise estática de código-fonte e arquitetura client-side)

---

## 1. Escopo Efetivo e Fronteiras de Teste

### 1.1 Inclusões no Escopo
* **Diretório Raiz do Projeto:** `c:\Users\Escola\Downloads\product_for_asperustech\asperus`
* **Arquivos Estruturais e de Marca:** `index.html`, `DESIGN.md`, `PRODUCT.md`.
* **Módulos de Código JavaScript:** `js/app.js`, `js/cap.js`, `js/global-cap.js`, `js/hero.js`, `js/scrub-engine.js`, `js/sections.js`.
* **Estilos e Folhas CSS:** `css/style.css`.
* **Integrações de Bibliotecas Externas:** Three.js 0.158.0 (unpkg CDN), GSAP 3.12.2 (cdnjs CDN), Fontshare CDN, Alibaba PageAgent 1.12.2 (jsdelivr CDN).
* **Scripts Operacionais do Repositório:** `copy_assets.bat`, `skills-lock.json`.
* **Configurações de Controle de Versão:** Repositório Git local e remoto `origin` (`https://github.com/datomoliveira/asperus.git`).

### 1.2 Exclusões Explícitas e Regras de Segurança
* **Ambiente de Produção e Hospedagem em Nuvem:** Nenhum tráfego ativo, fuzzing, DoS/DDoS ou injeção direcionada a domínios de produção, DNS ou CDNs de terceiros foi realizado.
* **Projetos Adjacentes:** O projeto `Personal Stylist` localizado fora da raiz do workspace não fez parte do escopo autorizado desta análise.
* **Terceiros / Fornecedores:** unpkg.com, cdnjs.cloudflare.com, jsdelivr.net e api.fontshare.com foram analisados apenas quanto aos aspectos de integração segura de clientes, sem tentativas de testes de intrusão contra suas infraestruturas.

---

## 2. Metodologia e Padrões de Conformidade

A auditoria foi estruturada tendo como referência os principais frameworks e diretrizes de cibersegurança defensiva:

1. **OWASP ASVS 5.0 (Application Security Verification Standard):** Nível 2 (alvo de segurança para aplicações corporativas e SaaS modernos), com foco nos capítulos aplicáveis ao frontend, manuseio de arquivos, codificação e proteção de dados.
2. **OWASP Top 10:2025:** Mapeamento taxonômico das falhas modernas (A02 Security Misconfiguration, A03 Software Supply Chain Failures, A05 Injection, A06 Insecure Design).
3. **OWASP Client-Side Security & Cheat Sheet Series:** Melhores práticas de Content Security Policy (CSP), Subresource Integrity (SRI), sanitização de inputs de DOM e isolamento de janelas com `rel="noopener noreferrer"`.
4. **OWASP AISVS / LLM Security:** Avaliação de risco referente à inclusão de agentes em página (PageAgent) e canais de entrada de texto livre de usuários.
5. **NIST CSF 2.0 & NIST SSDF SP 800-218:** Diretrizes para desenvolvimento seguro de software, proveniência e integridade da cadeia de suprimentos.

---

## 3. Classificação de Certeza e Níveis de Evidência

Cada constatação na auditoria obedece a critérios rigorosos de evidência:
* **CONFIRMADO:** O comportamento foi demonstrado diretamente no código-fonte através de análise léxica e lógica reproduzível.
* **PROVÁVEL:** Evidência estrutural forte identificada no código, dependendo apenas de fatores externos do ambiente de execução.
* **HIPÓTESE:** Risco plausível no modelo de ameaça da aplicação, mas sem comprovação de explorabilidade direta no código analisado.
* **NÃO TESTADO:** Controles que exigem acesso dinâmico à infraestrutura ativa, provedores de nuvem, WAF ou backend remoto.
* **CONTROLE VALIDADO:** Medida defensiva testada e aprovada com evidência negativa de falha.
