# 02 — Arquitetura e Superfície de Ataque

**Projeto:** ÁSPERUS (`datomoliveira/asperus`)  
**Data:** 07 de setembro de 2026  
**Padrão:** OWASP Threat Modeling / ASVS 5.0 Chapter V15

---

## 1. Visão Arquitetural e Limites de Confiança (Trust Boundaries)

O **ÁSPERUS** adota uma arquitetura *Single-Page Web Application* essencialmente estática e orientada a gráficos interativos no cliente. A renderização de cena 3D (Three.js), timelines de scroll (GSAP ScrollTrigger) e o assistente de navegação (PageAgent) ocorrem 100% no contexto do navegador do usuário (*User Agent*).

### Diagrama de Fluxo e Fronteiras de Confiança (Mermaid)

```mermaid
flowchart TB
    subgraph Internet ["🌐 Internet / Terceiros"]
        CDN_GSAP["CDN: cdnjs (GSAP 3.12.2)"]
        CDN_THREE["CDN: unpkg (Three.js 0.158.0)"]
        CDN_PAGEAGENT["CDN: jsdelivr (PageAgent 1.12.2)"]
        CDN_FONTS["CDN: Fontshare (Clash Display / Cabinet)"]
        GITHUB["GitHub Repositories (datomoliveira)"]
    end

    subgraph TrustBoundary ["🛡️ Fronteira de Confiança: Navegador do Cliente"]
        DOM["Document Object Model (DOM)"]
        CANVAS["WebGL / 2D Canvases (Three.js Scenes)"]
        FORM["Formulário de Contato (#contact-form)"]
        MODAL["Modal de Busca Inteligente (#search-modal)"]
        PAGEAGENT_RUN["Runtime do PageAgent (DOM Controller)"]
    end

    subgraph InternalDev ["💻 Ambiente Local do Desenvolvedor"]
        WORKSPACE["Repositório Local (Git / VSCode)"]
        SCRIPTS["Scripts Utilitários (copy_assets.bat)"]
        MEDIA["Mídias / Texturas (dark-marble, hero-cap)"]
    end

    %% Relações e Fluxos
    CDN_GSAP -->|Scripts JS sem SRI| DOM
    CDN_THREE -->|Importmap JS| CANVAS
    CDN_PAGEAGENT -->|Script JS sem SRI| PAGEAGENT_RUN
    CDN_FONTS -->|Folhas de Estilo CSS| DOM

    MODAL -->|Entrada de Usuário Não Sanitizada| PAGEAGENT_RUN
    PAGEAGENT_RUN -->|Comandos de Manipulação| DOM
    FORM -->|Campos: Nome, Email, Mensagem| DOM
    WORKSPACE -->|Push Git| GITHUB
```

---

## 2. Inventário de Ativos de Maior Valor ("Crown Jewels")

1. **Reputação e Marca ÁSPERUS / Renato Maia:** Como estúdio solo de engenharia de software para clientes de alto padrão (CTOs e fundadores), qualquer adulteração de código (defacement), injeção de scripts maliciosos ou redirecionamento falso causaria dano desproporcional à credibilidade profissional.
2. **Privacidade dos Dados de Contato:** Informações inseridas no formulário de contato (nome, e-mail comercial e descrição confidencial de novos projetos ou orçamentos de potenciais clientes).
3. **Integridade da Execução Client-Side:** Garantia de que nenhum script de terceiro injete mineradores de criptomoeda, roubo de credenciais ou execute ações arbitrárias na máquina do visitante.

---

## 3. Superfície de Entrada e Egress

### 3.1 Pontos de Entrada de Dados (Ingress)
* **Campo de Busca Inteligente (`#search-input`):** Recebe strings de texto livre digitadas pelo usuário no modal de assistência em tempo real.
* **Formulário de Contato (`#contact-form`):**
  * `input#field-name` (nome do interessado)
  * `input#field-email` (e-mail para retorno)
  * `textarea#field-msg` (descrição da demanda técnica)
* **Parâmetros de URL e Fragmentos (`#hash`):** Utilizados para navegação suave interna entre âncoras (`#about`, `#services`, `#projects`, `#contact`).

### 3.2 Pontos de Saída de Dados (Egress)
* Requisições HTTP GET externas para carregamento inicial de assets nas CDNs (`cdnjs`, `unpkg`, `jsdelivr`, `fontshare`).
* Links externos para perfis públicos (`https://github.com/datomoliveira`, `mailto:renato@asperus.dev`).
