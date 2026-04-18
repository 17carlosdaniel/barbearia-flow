# Headers de segurança em produção

No desenvolvimento e no `vite preview` os headers já são aplicados pelo Vite. **Em produção**, ao servir os arquivos da pasta `dist/` com nginx, Apache ou outro servidor, configure os mesmos headers para manter a proteção.

## Nginx (exemplo)

Dentro do `server` que serve o app:

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'" always;
```

Se o site for **apenas HTTPS**, adicione também:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

## Apache (exemplo)

No `.htaccess` ou na config virtual:

```apache
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"
Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"
Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
```

## O que cada header faz

| Header | Objetivo |
|--------|----------|
| **X-Content-Type-Options: nosniff** | Impede o navegador de interpretar o conteúdo com outro MIME type (reduz riscos de XSS). |
| **X-Frame-Options: SAMEORIGIN** | Evita que o site seja embutido em iframes de outros domínios (clickjacking). |
| **X-XSS-Protection** | Ativa filtro anti-XSS legado nos navegadores que ainda suportam. |
| **Referrer-Policy** | Controla quanto da URL é enviado em requisições para outros sites. |
| **Permissions-Policy** | Desativa acesso a câmera, microfone e geolocalização por padrão. |
| **Content-Security-Policy** | Restringe de onde podem vir scripts, estilos, imagens, etc. |
| **Strict-Transport-Security** | (Só em HTTPS) Força uso de HTTPS por um ano. |

Depois de alterar a configuração, recarregue o servidor e teste o site para garantir que nada quebrou (principalmente CSP).
