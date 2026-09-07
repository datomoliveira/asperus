# 05 — Controles Positivos Comprovados

Este documento registra as práticas seguras e controles defensivos que foram inspecionados e **validados positivamente com evidências concretas** no código-fonte do projeto **ÁSPERUS** (`datomoliveira/asperus`).

---

## 1. Ausência de Sinks Perigosos de Execução Dinâmica (XSS Prevention)

* **Controle:** Não utilização de funções de execução arbitrária de código (`eval`, `new Function`, `setTimeout(string)`) nem injeção de HTML não confiável via `document.write` ou `innerHTML`.
* **Evidência no Código:**
  * Toda a manipulação de status de interface no carregador e busca (ex.: `loader-status`, `search-status`) é feita atribuindo exclusivamente à propriedade `.textContent`:
    ```javascript
    // js/app.js:63
    if (status && step < steps.length) status.textContent = steps[step++];
    // js/app.js:480
    if (statusDiv) statusDiv.textContent = '✓ Mostrando seção de Projetos!';
    ```
* **Impacto Positivo:** Elimina a superfície primária de Cross-Site Scripting (DOM XSS) baseada em injeção de tags em sinks comuns do navegador.

---

## 2. Proteção contra Reverse Tabnabbing em Links Externos

* **Controle:** Uso correto do atributo `rel="noopener noreferrer"` em links que abrem em nova aba com `target="_blank"`.
* **Evidência no Código:**
  ```html
  <!-- index.html:285 -->
  <a href="https://github.com/datomoliveira" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="GitHub de Renato Maia">
  ```
* **Impacto Positivo:** Impede que a página de destino externa tenha acesso ao objeto `window.opener` da página original, prevenindo ataques onde um site de terceiro redireciona a aba do usuário para uma página de phishing.

---

## 3. Comunicação Segura e Transporte Estritamente em HTTPS

* **Controle:** Todos os recursos externos (fontes, scripts e módulos JS) utilizam URLs absolutas com o esquema de transporte criptografado `https://`.
* **Evidência no Código:**
  * Fontes: `https://api.fontshare.com/v2/css?...`
  * Módulos Three.js: `https://unpkg.com/three@0.158.0/...`
  * Scripts GSAP: `https://cdnjs.cloudflare.com/ajax/libs/...`
  * Agente: `https://cdn.jsdelivr.net/npm/...`
* **Impacto Positivo:** Previne que requisições ocorram em texto claro (HTTP), impedindo alertas de *Mixed Content* nos navegadores e mitigando ataques clássicos de interceptação na rede local (*Man-in-the-Middle*).

---

## 4. Gestão Defensiva de Ciclo de Vida e Recursos WebGL / DOM

* **Controle:** Uso sistemático de `IntersectionObserver` para pausar animações Three.js quando os elementos saem da área visível (*viewport*), além de métodos `destroy()` para liberar buffers de memória e ouvintes de eventos.
* **Evidência no Código:**
  * Em `js/sections.js` (linhas 53–63 e 75–81) e `js/scrub-engine.js`:
    ```javascript
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !frameId) animate();
      else if (!isVisible && frameId) { cancelAnimationFrame(frameId); frameId = null; }
    }, { threshold: 0.05 });
    ```
* **Impacto Positivo:** Previne esgotamento de memória da GPU (*GPU memory exhaustion*) e negação de serviço client-side (*Browser Freeze / Crash*), assegurando performance consistente e consumo seguro de recursos.
