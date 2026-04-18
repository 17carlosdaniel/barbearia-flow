# Wizard “Novo produto” — tipos e categorias (BarberFlow)

## Passos fixos

1. **Básico** — nome, categoria, tipo de produto, opcionais (foto/descrição)  
2. **Preço** — custo, venda, simulador  
3. **Embalagem** — dimensões (unidade cm/m), peso (kg/g); tudo opcional; dados em `attributes.embalagem` (JSON)  
4. **Estoque** — atual / mínimo; com variações (roupa/calçado) o total é a **soma** das linhas no passo Detalhes  
5. **Detalhes** — campos dinâmicos por `productType` + grade de estoque por tamanho (variações) + tags/vitrine  

### Embalagem (`attributes.embalagem`)

Objeto opcional persistido junto aos demais atributos:

| Campo | Descrição |
|-------|-----------|
| `unidadeDimensao` | `cm` \| `m` |
| `altura`, `largura`, `profundidade` | números ≥ 0 (opcionais) |
| `unidadePeso` | `kg` \| `g` |
| `peso` | número ≥ 0 (opcional) |

Rascunhos salvos antes do wizard de 5 passos usam `wizardVersion`; ao carregar sem versão atual, os passos antigos 3 (estoque) e 4 (detalhes) são mapeados para 4 e 5.

## Mapa categoria → tipo sugerido

Definido em [`src/lib/productCategoryTypeHints.ts`](../src/lib/productCategoryTypeHints.ts):

| Categoria | Tipo sugerido (`StoreProductType`) |
|-----------|--------------------------------------|
| Pomadas, Óleos, Barba | `barbearia` |
| Shampoo | `liquido` |
| Kits | `kit` |
| Outros | *(sem troca automática)* |

O usuário pode alterar o tipo manualmente após a sugestão.

## Tipos de produto (`StoreProductType`)

| Valor interno | Rótulo UI (resumo) |
|---------------|---------------------|
| `barbearia` | Produto de barbearia (pomada, cera, styling…) |
| `liquido` | Produto líquido |
| `roupa` | Roupa |
| `calcado` | Calçado |
| `acessorio` | Equipamento / acessório |
| `kit` | Kit |

## Variações / SKU

- Tabela: `store_product_variants` (ver migração `supabase/migrations/20260322220000_store_product_variants.sql`).  
- API: `getStoreProductVariants`, `replaceStoreProductVariants` em [`src/lib/storeV2.ts`](../src/lib/storeV2.ts).  
- Formulário: `form.variants` + `form.persistedProductId` (ID em `store_products` ao editar).

Atributos de combinação usam `attrs_key` JSON; no wizard, para roupa/calçado usamos chave **`tamanho`** com o número/letra do tamanho.

## Checklist QA manual

- [ ] Criar produto `barbearia` — salvar e reabrir rascunho (localStorage).  
- [ ] Mudar categoria para “Kits” — tipo sugerido e toast.  
- [ ] Roupa: selecionar tamanhos, preencher quantidades na grade, salvar — estoque total = soma.  
- [ ] Editar produto existente com variantes — linhas carregam do backend/fallback.  
- [ ] Kit: linhas + preço “separado” — preview mostra economia.  
- [ ] `npm run build` sem erros.
