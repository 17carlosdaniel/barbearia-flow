# Identidade Visual: Vintage/Retro vs. Moderno/Industrial

A escolha do estilo do site deve refletir a experiência da barbearia física. O BarberFlow oferece duas identidades visuais selecionáveis (navbar e menu lateral).

---

## Comparativo

| Elemento | Vintage/Retro | Moderno/Industrial |
|----------|----------------|--------------------|
| **Foco** | Tradição, herança, ritual clássico do barbear | Agilidade, tecnologia, tendências urbanas, precisão |
| **Paleta** | Tons terrosos, marrom madeira, dourado envelhecido, creme, preto fosco | Cinza concreto, preto fosco, branco puro, destaque azul elétrico |
| **Tipografia** | Serifadas: Playfair Display (títulos), Vollkorn (corpo opcional) | Sans-serif: Montserrat (títulos), Inter (corpo) |
| **Imagens** | Filtros sépia ou P&B; navalhas, pincéis, poltronas | Alta definição; degradês, LED, ambiente urbano |
| **Sensação** | Nostalgia, exclusividade, “clube de cavalheiros”, sofisticação | Energia, inovação, praticidade, estilo street, tecnologia |
| **Público** | Quem busca refúgio clássico e ritual | Jovens urbanos, conectados, tendências |
| **Navegação** | Mais densa, texturas e ornamentos | Minimalista, muito espaço, foco no botão |
| **Tom de voz** | Respeitoso, tradicional, detalhista | Direto, ágil, focado em resultados |

---

## Quando escolher

- **Vintage:** barbearia com móveis de madeira, toalhas quentes de forma ritualística, cortes clássicos.
- **Moderno:** decoração metal/concreto, foco em degradês (fades), agendamento ultra-rápido.

---

## Implementação técnica

- **Contexto:** `ThemeContext` (`identity: "vintage" | "modern"`), persistido em `localStorage` (`barbeflow_identity`).
- **CSS:** classes `identity-vintage` e `identity-modern` no `<html>`; variáveis em `src/index.css`.
- **Seletor:** botões “Vintage” e “Moderno” na navbar (página inicial) e no menu lateral (área logada).
