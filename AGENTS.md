# Krema Tabacaria — AI Engineering Guidelines

## Role

Você é um engenheiro de software trabalhando no projeto da Krema Tabacaria.

O objetivo é criar uma experiência digital premium para uma tabacaria e head shop física localizada em Arroio do Sal/RS.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion
- Lucide

## Visual identity

A Krema possui uma identidade:

- dark
- premium
- street
- head shop
- urbana
- visualmente forte

Cores principais:

- preto
- branco
- cinza
- laranja/vermelho inspirado na logo

Não utilizar cores aleatórias.

Não utilizar verde como cor estrutural da interface.

## Design principles

- mobile first
- responsivo
- visual premium
- poucos elementos por tela
- boa hierarquia visual
- animações sutis
- microinterações
- foco nos produtos
- fotografia como elemento principal
- evitar aparência de template genérico

## Animation principles

Use animações somente quando agregarem à experiência.

Preferir:

- fade
- slide
- parallax leve
- image reveal
- hover transitions
- scroll reveal
- marquee
- sticky transitions

Evitar:

- animações exageradas
- efeitos psicodélicos
- excesso de blur
- excesso de partículas
- animações que prejudiquem performance

## Responsive design

Desktop e mobile devem ser projetados juntos.

Nunca criar uma interface desktop e apenas tentar adaptá-la depois.

Interações de hover devem possuir alternativa para touch.

## Components

Priorizar componentes reutilizáveis.

Evitar duplicação de código.

Não criar componentes gigantes quando uma seção puder ser isolada.

## Brand rules

A logo real da Krema deve ser utilizada.

Não modificar a identidade da logo.

Não inventar slogans, informações comerciais ou produtos.

## Product rules

Não inventar:

- produtos
- preços
- marcas
- estoque
- informações comerciais

Durante a demo podem existir dados fictícios explicitamente identificados como mock data.

## Content rules

Não inventar endereço, horário ou informações sobre a loja.

Informações reais fornecidas pelo proprietário devem prevalecer.

## Accessibility

Priorizar:

- contraste
- navegação por teclado
- aria labels
- reduced motion
- alt text
- foco visível

## Performance

Evitar:

- bibliotecas desnecessárias
- JavaScript desnecessário
- imagens gigantes
- animações pesadas

## Architecture

A demo deve ser criada de forma que possa posteriormente evoluir para:

- catálogo real
- Supabase
- painel administrativo
- estoque
- pedidos
- autenticação

Não adicionar backend na demo.

## AI behavior

Antes de criar código:

1. Entenda o objetivo da seção.
2. Reutilize componentes existentes.
3. Verifique padrões do projeto.
4. Evite introduzir dependências sem necessidade.
5. Preserve consistência visual.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
