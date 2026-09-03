---
name: ÁSPERUS
description: Tecnologia, Estratégia e Engenharia Solo de Alto Nível
colors:
  primary: "#C4A96B"
  neutral-bg: "#080808"
  neutral-surface: "#0D0D0D"
  neutral-text: "#E8E2D9"
  accent-red: "#E24B4A"
  success-green: "#4BE26B"
typography:
  display:
    fontFamily: "'Clash Display', 'Bebas Neue', sans-serif"
    fontSize: "clamp(4.5rem, 10vw, 9.5rem)"
    fontWeight: 700
    lineHeight: 0.88
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Clash Display', sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline-sm:
    fontFamily: "'Clash Display', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.1em"
  title:
    fontFamily: "'Clash Display', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
  title-sm:
    fontFamily: "'Clash Display', sans-serif"
    fontSize: "1.1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  body:
    fontFamily: "'Cabinet Grotesk', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  body-sm:
    fontFamily: "'Cabinet Grotesk', sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.05em"
  label:
    fontFamily: "'Cabinet Grotesk', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.15em"
  micro:
    fontFamily: "'Cabinet Grotesk', sans-serif"
    fontSize: "0.65rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.15em"
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  base: "8px"
  lg: "10px"
  xl: "12px"
  2xl: "16px"
  pill-sm: "20px"
  pill-md: "30px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.base}"
    padding: "14px 28px"
  button-glass:
    backgroundColor: "rgba(8, 8, 8, 0.5)"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "14px 28px"
  card-glass:
    backgroundColor: "rgba(255, 255, 255, 0.05)"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.xl}"
    padding: "32px 24px"
---

# Design System: ÁSPERUS

## Overview

**Creative North Star: "The Obsidian Atelier"**

O universo visual da ÁSPERUS combina a precisão técnica e o rigor da engenharia de ponta com a elegância atemporal de um ateliê de alta costura. Fundamentado em pretos profundos de mármore e obsidiana com toques de ouro nobre e creme mineral, o sistema transmite exclusividade, autoridade e sofisticação imediata.

A interface recua propositalmente para dar palco aos elementos 3D interativos em WebGL/Three.js e à tipografia escultural, mantendo uma densidade equilibrada e interações táteis e suaves.

**Key Characteristics:**
- Fundo escuro texturizado com mármore mineral sutil e gradientes radiais envolventes.
- Acentos metálicos em ouro nobre (`#C4A96B`) aplicados com parcimônia para guiar o olhar.
- Glassmorphism refinado com desfoque de alta fidelidade (20px blur) e bordas luminosas tênues.
- Tipografia display marcante em harmonia com uma grotesque altamente legível.
- Animações fluidas baseadas em curvas de desaceleração exponencial sem ruído ou saltos artificiais.

## Colors

Paleta inspirada em materiais nobres da terra — obsidiana, mármore escuro, ouro envelhecido e pergaminho creme.

### Primary
- **Noble Gold** (`#C4A96B`): Usado como o acento primário para estados ativos, bordas selecionadas, indicadores-chave e CTAs essenciais.

### Secondary
- **Crimson Spark** (`#E24B4A`): Usado estritamente como acento funcional secundário (tags especiais de performance e alertas).
- **Emerald Pulse** (`#4BE26B`): Usado estritamente para confirmação positiva e sucesso no envio de mensagens.

### Neutral
- **Obsidian Black** (`#080808`): Fundo primário da tela e base de contraste absoluto.
- **Deep Slate** (`#0D0D0D`): Superfície de cards internos, inputs e modais elevados.
- **Mineral Cream** (`#E8E2D9`): Cor primária de leitura tipográfica (títulos e textos destacados).
- **Muted Cream** (`rgba(232, 226, 217, 0.65)`): Texto de corpo e descrições secundárias.

### Named Rules
**The Precious Accent Rule.** O ouro primário (`#C4A96B`) é restrito a menos de 10% da área visível de qualquer viewport. A sua raridade confere o peso de autoridade e valor.

## Typography

**Display Font:** Clash Display (fallback: Bebas Neue, sans-serif)  
**Body Font:** Cabinet Grotesk (fallback: -apple-system, system-ui, sans-serif)

**Character:** A Clash Display traz formas geométricas esculpidas e modernas, enquanto a Cabinet Grotesk entrega leitura ritmada, neutra e sem fadiga visual.

### Hierarchy
- **Display** (700, `clamp(4.5rem, 10vw, 9.5rem)`, `0.88`): Título principal hero em caixa-alta e tracking levemente contraído (-0.03em).
- **Headline** (600, `clamp(2rem, 4vw, 3.5rem)`, `1.05`): Títulos de seções (`/ sobre`, `/ serviços`, `/ projetos`).
- **Headline Small** (600, `1.5rem`, `1.2`): Títulos intermediários de modais e rodapé.
- **Title** (600, `1.25rem`, `1.2`): Nomes de serviços, projetos e modais.
- **Title Small** (600, `1.1rem`, `1.3`): Subtítulos em cards secundários.
- **Body** (400, `1rem`, `1.75`): Parágrafos de leitura com medida confortável limitada a 65–75ch.
- **Body Small** (400, `0.85rem`, `1.6`): Descrições compactas em cards e itens de menu.
- **Label** (700, `0.75rem`, `1`): Tags de tecnologias, badges, subtítulos e marcadores de navegação em caixa-alta com letter-spacing de 0.15em.
- **Micro** (600, `0.65rem`, `1.2`): Metadados compactos em tags e numeração.

### Named Rules
**The Balanced Headline Rule.** Títulos de seção nunca recebem quebras órfãs; o espaçamento acima do título é sempre no mínimo o dobro do espaçamento abaixo dele.

## Layout

O layout baseia-se em um grid fluído de 12 colunas ou divisões simétricas (1fr 1fr no desktop, cards em repeat(4, 1fr) ou repeat(3, 1fr)) com margem máxima de 1400px centralizada.

- **Espaçamento de Seção:** 8rem no desktop, 5rem no mobile.
- **Gaps:** 1.25rem a 1.5rem entre cards; 5rem entre colunas principais.
- **Responsividade:** Breakpoints em 1100px (grid 2x2), 900px (1 coluna e hero empilhado) e 640px (menu drawer, cards em 1 coluna).

## Elevation & Depth

A profundidade é expressa através de estratificação de superfícies translúcidas (*glass cards*) combinada com relevo tátil (*neumorphic insets* em inputs) e sombras suaves difusas.

### Shadow Vocabulary
- **Glass Ambient** (`0 8px 32px rgba(0, 0, 0, 0.4)`): Aplicado em cards suspensos e modais.
- **Card Hover Glow** (`0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(196, 169, 107, 0.12)`): Feedback de hover em cards de serviço e projetos.
- **Neuro Outset** (`4px 4px 12px rgba(0,0,0,0.8), -2px -2px 8px rgba(255,255,255,0.03)`): Relevo padrão em campos de formulário e botões táteis.
- **Neuro Inset** (`inset 3px 3px 8px rgba(0,0,0,0.9), inset -2px -2px 6px rgba(255,255,255,0.03)`): Rebaixo de profundidade em inputs quando focados.

### Named Rules
**The Luminous Border Rule.** Cards translúcidos recebem borda sutil de 1px com transparência máxima de 8% a 15% de branco ou ouro, garantindo contorno nítido sobre o fundo de mármore sem criar ruído visual.

## Shapes

- **Contornos e Raios:** Cantos sutilmente suavizados com raios entre 6px e 16px para containers estruturais (`.glass-card`, `.service-card`, `.project-thumb`).
- **Pills e Badges:** Raios de 20px a 30px ou total (`9999px`) para tags, badges e botões de ação flutuantes.
- **Bordas:** 1px sólido de alta precisão.

## Components

### Buttons
- **Primary / Gold Glass:** Fundo em gradiente dourado translúcido com borda de 1px em `#C4A96B` e raio de 8px. No hover, eleva 2px (`transform: translateY(-2px)`) com difusão luminosa.
- **Glass Action:** Fundo `rgba(8, 8, 8, 0.5)` com desfoque de 12px e borda dourada suave. Easing de transição suave e feedback tátil.

### Cards
- **Service Card:** Fundo de vidro escuro, viewport superior para o canvas 3D e tag semântica inferior. Elevação suave no hover sem alterar dimensões de layout.
- **Project Card:** Thumbnail com imagem/visual 3D com transição de escala fluida (`transform: scale(1.05)`) e overlay gradiente que surge no foco/hover.

### Form Inputs
- **Neuro Input:** Superfície escura rebaixada (`#0D0D0D`) com rótulo flutuante (*floating label*) animado suavemente para cima no foco ou preenchimento.

### Navigation
- **Header:** Fixado no topo, com transição de fundo translúcido (`backdrop-filter: blur(20px)`) e borda inferior sutil ao rolar a página. Links com sublinhado animado por GPU (`transform: scaleX`).

## Do's and Don'ts

### Do:
- **Do** utilizar curvas de aceleração exponencial (`cubic-bezier(0.16, 1, 0.3, 1)`) para transições e micro-interações.
- **Do** garantir contraste de texto superior a 4.5:1 para corpo e 3:1 para títulos display.
- **Do** estilizar superfícies nativas do navegador (`::selection`, `:focus-visible`, scrollbars) dentro da paleta do sistema.
- **Do** usar propriedades de aceleração por GPU (`transform`, `opacity`) em todas as animações interativas para evitar layout thrashing.

### Don't:
- **Don't** utilizar animações de transição elásticas ou saltitantes (*bounce easing*).
- **Don't** animar propriedades estruturais de layout como `width`, `height`, `margin` ou `padding` em elementos interativos.
- **Don't** saturar a tela com mais de uma cor de acento chamando atenção concorrente.
- **Don't** aplicar bordas coloridas duras ou sombras sem desfoque (*hard offset box-shadows*).
