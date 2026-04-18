# Barbeflow

## Sistema de Gestão para Barbearias

**Barbeflow** é uma plataforma completa para gestão de barbearias, conectando barbeiros e clientes.

## Como usar

### Desenvolvimento local

```sh
# Clone o repositório
git clone <URL_DO_REPOSITORIO>

# Entre na pasta
cd barbeflow

# Instale dependências
npm i

# Inicie o servidor de desenvolvimento
npm run dev
```

### API de autenticação local (opcional)

Se você quiser usar endpoints REST (`/api/register`, `/api/login`, `/api/logout`, `/api/refresh`, `/api/me`) em vez de fallback direto no Supabase:

```sh
# 1) Suba a API de autenticação (porta 4000 por padrão)
npm run auth:dev

# 2) Configure o frontend para usar essa API
# no arquivo .env:
VITE_AUTH_API_BASE_URL=http://localhost:4000

# 3) Rode o frontend normalmente
npm run dev
```

Variáveis opcionais da API (`backend/server.js`):

- `AUTH_API_PORT` (default: `4000`)
- `AUTH_JWT_ACCESS_SECRET` (default dev, recomendado definir em produção)
- `AUTH_ACCESS_TOKEN_TTL_SECONDS` (default: `900` = 15 min)
- `AUTH_REFRESH_TOKEN_TTL_SECONDS` (default: `604800` = 7 dias)
- `AUTH_APP_ORIGIN` (default: `http://localhost:8080`)

## Tecnologias

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## Deploy

O projeto pode ser deployado em qualquer plataforma que suporte aplicações React/Vite.
