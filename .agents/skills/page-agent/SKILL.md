---
name: page-agent
description: >
  In-page AI agent copilot for web applications by Alibaba (page-agent).
  Enables natural language web interaction, automated form filling, site navigation,
  and in-page assistant capabilities via text-based DOM manipulation.
---

# page-agent — In-Page GUI AI Agent

Page Agent (`alibaba/page-agent`) is a lightweight in-page AI agent that adds an interactive copilot to any web application. It performs text-based DOM manipulation to navigate pages, execute user prompts, fill forms, and assist visitors directly within the web interface.

## Features & Capabilities

1. **In-Page DOM Agent**: Operates directly inside browser DOM without requiring backend proxies or browser extensions.
2. **Natural Language Navigation**: Visitors can ask the agent to navigate, scroll, fill forms, or query information on the site.
3. **Multi-Model Support**: Compatible with OpenAI, Qwen (DashScope), DeepSeek, and custom OpenAI-compatible endpoints.
4. **Instant Evaluation / Demo Script**: Provides a zero-config CDN script (`page-agent.demo.js`) for quick testing.

## Integration Approaches

### Approach A: IIFE Script Tag (CDN)
```html
<!-- Load PageAgent script -->
<script
  src="https://cdn.jsdelivr.net/npm/page-agent@1.12.2/dist/iife/page-agent.demo.js"
  crossorigin="anonymous"
></script>
```

### Approach B: Programmatic ES Module / NPM
```javascript
import { PageAgent } from 'page-agent';

const agent = new PageAgent({
  model: 'qwen3.5-plus',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: 'YOUR_API_KEY',
  language: 'pt-BR',
});

await agent.execute('Preencha o formulário de contato com o nome João');
```

## Best Practices & UI Integration

- Include a floating AI Copilot button or toggle in the navigation bar to allow users to invoke or dismiss the agent.
- Pre-configure language parameters (e.g., `pt-BR`) for localized interaction.
- Use semantic HTML tags and descriptive `aria-label`s so the agent can accurately identify interactive elements on the page.
