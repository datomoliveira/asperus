# Constituição Técnica do ÁSPERUS

<!-- specify:constitution 1.0.0 -->
**Projeto:** ÁSPERUS (`datomoliveira/asperus`)  
**Autor & Arquiteto:** Renato Maia  
**Posicionamento:** "Solo. Direto. Funciona." / "Um dev. Zero bullshit."  
**Última Atualização:** Setembro de 2026

Este documento estabelece as leis técnicas, padrões arquiteturais e diretrizes inegociáveis que **TODO agente de inteligência artificial ou desenvolvedor DEVE obedecer** ao propor, planejar ou alterar código no repositório ÁSPERUS.

---

## 1. Princípios Inegociáveis do Produto

1. **Engenharia de Alto Padrão sem Overhead:** Não introduza dependências desnecessárias, frameworks inchados ou camadas burocráticas de abstração. O código deve ser direto, legível e de manutenção trivial.
2. **Imersão Gráfica com Propósito:** Elementos 3D e motion design (Three.js e GSAP) devem encantar o usuário sem comprometer a usabilidade, a acessibilidade ou o tempo de carregamento da página.
3. **Desempenho Estrito a 60 FPS:** Toda animação, cena WebGL ou transição deve rodar com aceleração por GPU. Renderizadores 3D fora da tela (*viewport*) devem ser pausados imediatamente via `IntersectionObserver`.
4. **Segurança por Padrão (Secure by Design):** Nenhuma entrada de usuário deve ser processada sem sanitização; nenhuma dependência de CDN deve ser carregada sem isolamento; nenhuma credencial deve ser exposta no código.

---

## 2. Stack Tecnológica & Restrições

| Camada | Tecnologia Adotada | O que é PROIBIDO |
| :--- | :--- | :--- |
| **Estrutura** | HTML5 semântico nativo | Proibido usar geradores estáticos complexos sem necessidade. |
| **Estilização** | CSS3 Moderno (Vanilla CSS), Flexbox/Grid, Custom Properties | Proibido adicionar TailwindCSS, Bootstrap ou pré-processadores pesados. |
| **Lógica** | JavaScript Moderno (ES6+ Modules nativos) | Proibido adicionar jQuery ou transpiladores complexos. |
| **3D & Gráficos** | Three.js (WebGL com shaders e materiais otimizados) | Proibido instanciar WebGLRenderer contínuo sem IntersectionObserver. |
| **Animações** | GSAP 3 (ScrollTrigger, SplitText, quickTo) | Proibido animar propriedades que forcem reflow pesado (ex: top/left); use transform/opacity. |
| **Tipografia** | Clash Display (títulos) & Cabinet Grotesk (corpo) | Proibido trocar as fontes sem alinhamento direto de marca. |
| **Idioma** | Português do Brasil (pt-BR) como padrão primário | Proibido textos ou mensagens em inglês solto na interface. |

---

## 3. Sistema de Design Canônico (*Obsidian Atelier*)

Todo novo componente deve utilizar rigorosamente a paleta canônica definida em `css/style.css`:

* **Preto Obsidiana (Fundo Principal):** `--bg: #080808`
* **Preto Profundo (Cartões e Modais):** `--bg-2: #0D0D0D`
* **Ouro Nobre (Destaques, Bordas e Acentos):** `--gold: #C4A96B`
* **Creme Suave (Textos e Contraste):** `--cream: #E8E2D9`
* **Carmesim (Pontos de Atenção e Erros):** `--red: #E24B4A`
* **Verde Esmeralda (Sucesso):** `--success: #6BE2A4`
* **Efeito Vidro (Glassmorphism):** `--glass-bg: rgba(255, 255, 255, 0.04)` com `--glass-border: rgba(255, 255, 255, 0.08)`
* **Curva de Easing Padrão:** `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`

---

## 4. Diretrizes de Cibersegurança & Resiliência (OWASP ASVS 5.0)

1. **Defesa em Profundidade:** Manter a política de segurança de conteúdo (`Content-Security-Policy`) estrita, permitindo apenas conexões para origens essenciais.
2. **Sanitização de Entradas:** Qualquer texto livre recebido de formulários ou da busca inteligente deve ser sanitizado (remover `< > " ' ; & $`) e limitado em comprimento antes de qualquer uso.
3. **Anti-Automação:** Formulários devem conter campo honeypot invisível para bots (`input#field-hp`) e validação client-side com `e.preventDefault()`.
4. **Proteção de Segredos:** Nunca comitar arquivos `.env`, chaves de API, senhas ou tokens no repositório. O `.gitignore` deve ser mantido íntegro.
5. **Isolamento de Janelas:** Todo link externo que use `target="_blank"` deve conter obrigatoriamente `rel="noopener noreferrer"`.

---

## 5. Fluxo de Trabalho Guiado por Especificação (Spec-Driven Development)

Antes de criar qualquer nova funcionalidade ou refatoração no ÁSPERUS:

1. **Spec (`specs/<feature>/spec.md`):** Defina os requisitos funcionais, não funcionais e critérios de aceite.
2. **Plan (`specs/<feature>/plan.md`):** Mapeie os arquivos alterados, riscos e impacto de performance.
3. **Tasks (`specs/<feature>/tasks.md`):** Crie uma lista de tarefas atômicas e marque o checkbox conforme avançar.
4. **Validação:** Teste no navegador local, valide no terminal e registre os resultados em `walkthrough.md`.
