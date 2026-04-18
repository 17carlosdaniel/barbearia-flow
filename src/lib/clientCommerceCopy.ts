import type { Identity } from "@/contexts/ThemeContext";

export type StoreCategoryItem = { key: string; label: string };

/** Copy da vitrine cliente — Modern vs Vintage (estrutura e tom diferentes). */
export type ClientStoreCommerceCopy = {
  pageTitle: string;
  pageSubtitle: string;
  categoriesSectionTitle: string;
  discoveryTitle: string;
  discoveryLead: string;
  searchSectionTitle: string;
  searchPlaceholder: string;
  filterSectionTitle: string;
  filterLabel: string;
  sortRelevance: string;
  sortBestsellers: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortRating: string;
  clearFilters: string;
  /** Atalhos Modern */
  quickDryHair: string;
  quickBeard: string;
  quickFinish: string;
  quickUnder50: string;
  quickBestsellers: string;
  /** Seleções Vintage */
  quickSelectionsTitle: string;
  chipPromo: string;
  chipRating: string;
  chipUnder50: string;
  chipFast: string;
  chipBarbershopChoice: string;
  timerTitle: string;
  timerEndsLabel: string;
  offersLead: string;
  bestsellersTitle: string;
  bestsellersLead: string;
  featuredTitle: string;
  flashTitle: string;
  recommendedTitle: string;
  recommendedLead: string;
  recommendedCta: string;
  packagesTitle: string;
  vitrineTitle: string;
  highlightsEyebrow: string;
  crossSellTitle: string;
  crossSellLead: string;
  allBarbershops: string;
  resultsCount: (n: number) => string;
  filterInStock: string;
  filterOnSale: string;
  priceAll: string;
  usageTypeLabel: string;
  usageAll: string;
  usageHair: string;
  usageBeard: string;
  usageFinish: string;
  categoryItems: StoreCategoryItem[];
  productCardAddCta: string;
  productCardViewCta: string;
  productCardTagProfile: string;
  productCardTagFast: string;
  productCardTagEditorial: string;
};

export type ClientProductCommerceCopy = {
  backToStore: string;
  productTaglinePrefix: string;
  productTaglineSuffix: string;
  productTaglineVintagePrefix: string;
  productTaglineVintageSuffix: string;
  primaryCta: string;
  secondaryAddToCart: string;
  choiceBlockTitle: string;
  idealForSectionTitle: string;
  idealForBullets: string[];
  idealForSummary: string;
  howToUseTitle: string;
  howToUseBody: string;
  profileBlockTitle: string;
  profileBlockBody: string;
  profileBlockCta: string;
  profileRelatedCta: string;
  deliverySectionTitle: string;
  deliveryPickupLine: string;
  idealForEyebrow: string;
  expectedResultEyebrow: string;
  idealForBody: string;
  expectedResultBody: string;
  tabHowToUse: string;
  tabIngredients: string;
  tabBenefits: string;
  reviewsTitle: string;
  reviewsCommunitySubtitle: string;
  reviewsPrompt: string;
  submitReviewCta: string;
  relatedTitle: string;
  relatedLead: string;
  bundleTitle: string;
  nearbyTitle: string;
  nearbyLead: string;
  trustSecure: string;
  trustPickup: string;
  trustPayment: string;
  satisfactionNote: string;
  /** Vintage */
  routineIntroTitle: string;
  routineIntroBody: string;
  whyChooseTitle: string;
  whyChooseBullets: string[];
};

export type ClientCommerceCopy = {
  store: ClientStoreCommerceCopy;
  pdp: ClientProductCommerceCopy;
  hero: {
    modern: { id: string; title: string; subtitle: string; cta: string; image: string }[];
    vintage: { id: string; title: string; subtitle: string; cta: string; image: string }[];
  };
};

const groomingChair =
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=80";
const barberTools =
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1400&q=80";
const barbershopInterior =
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=80";
const beardGrooming =
  "https://images.unsplash.com/photo-1622287162729-9b8789a888f9?auto=format&fit=crop&w=1400&q=80";
const hairProductsRoutine =
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=80";

const HERO_BANNERS: ClientCommerceCopy["hero"] = {
  modern: [
    {
      id: "m-grooming",
      title: "Tudo para sua rotina de grooming",
      subtitle: "Pomadas, shampoos e kits escolhidos por barbearias parceiras — envio ou retirada.",
      cta: "Ver vitrine",
      image: barberTools,
    },
    {
      id: "m-perfil",
      title: "Indicações alinhadas ao seu perfil",
      subtitle: "Use o diagnóstico capilar e volte aqui para achar o que combina com você.",
      cta: "Abrir diagnóstico",
      image: hairProductsRoutine,
    },
  ],
  vintage: [
    {
      id: "v-semana",
      title: "Escolhas da semana",
      subtitle: "Produtos em destaque para manter cabelo, barba e acabamento em dia.",
      cta: "Explorar seleção",
      image: barbershopInterior,
    },
    {
      id: "v-kits",
      title: "Kits e clássicos da barbearia",
      subtitle: "Ofertas por tempo limitado em itens que profissionais usam no dia a dia.",
      cta: "Ver ofertas",
      image: beardGrooming,
    },
    {
      id: "v-pos",
      title: "Do estilo ao pós-corte",
      subtitle: "Complete sua experiência BarberFlow com o que há de melhor na vitrine.",
      cta: "Começar",
      image: groomingChair,
    },
  ],
};

const modernCategoryItems: StoreCategoryItem[] = [
  { key: "Todos", label: "Todos" },
  { key: "Pomadas", label: "Pomadas" },
  { key: "Cuidados", label: "Shampoos" },
  { key: "Barba", label: "Barba" },
  { key: "Kits", label: "Kits" },
  { key: "Acessórios", label: "Acessórios" },
  { key: "CuidadosDiarios", label: "Cuidados diários" },
];

const vintageCategoryItems: StoreCategoryItem[] = [
  { key: "Todos", label: "Tudo" },
  { key: "Pomadas", label: "Finalização" },
  { key: "Cuidados", label: "Limpeza" },
  { key: "Barba", label: "Barba" },
  { key: "Kits", label: "Kits" },
  { key: "Acessórios", label: "Ferramentas" },
  { key: "Essenciais", label: "Essenciais da casa" },
];

const modernStore: ClientStoreCommerceCopy = {
  pageTitle: "Loja",
  pageSubtitle: "Encontre produtos compatíveis com seu perfil, rotina e objetivo de cuidado.",
  categoriesSectionTitle: "Categorias",
  discoveryTitle: "Encontre mais rápido",
  discoveryLead: "Busque por categoria, marca, resultado desejado ou recomendação para seu perfil.",
  searchSectionTitle: "Filtrar produtos",
  searchPlaceholder: "Buscar por nome, categoria, marca ou objetivo",
  filterSectionTitle: "Filtrar produtos",
  filterLabel: "Mais opções",
  sortRelevance: "Ordenar: relevância",
  sortBestsellers: "Mais vendidos",
  sortPriceAsc: "Menor preço",
  sortPriceDesc: "Maior preço",
  sortRating: "Melhor avaliados",
  clearFilters: "Limpar filtros",
  quickDryHair: "Para cabelo seco",
  quickBeard: "Para barba",
  quickFinish: "Para acabamento",
  quickUnder50: "Até R$ 50",
  quickBestsellers: "Mais vendidos",
  quickSelectionsTitle: "Seleções rápidas",
  chipPromo: "Em oferta",
  chipRating: "Mais procurados",
  chipUnder50: "Até R$ 50",
  chipFast: "Entrega rápida",
  chipBarbershopChoice: "Escolhas da barbearia",
  timerTitle: "Ofertas do dia",
  timerEndsLabel: "Termina em",
  offersLead: "Itens com preço especial por tempo limitado.",
  bestsellersTitle: "Mais vendidos hoje",
  bestsellersLead: "Produtos com maior saída nas barbearias da sua região.",
  featuredTitle: "Mais vendidos hoje",
  flashTitle: "Ofertas do dia",
  recommendedTitle: "Recomendados para você",
  recommendedLead: "Selecionados com base no seu perfil, diagnóstico ou histórico de cuidados.",
  recommendedCta: "Ver recomendações",
  packagesTitle: "Pacotes da barbearia",
  vitrineTitle: "Todos os produtos",
  highlightsEyebrow: "Curadoria BarberFlow",
  crossSellTitle: "Combine com sua rotina",
  crossSellLead: "Produtos que fazem sentido junto com outros itens no seu cuidado diário.",
  allBarbershops: "Todas as barbearias",
  resultsCount: (n) => `${n} resultado${n === 1 ? "" : "s"}`,
  filterInStock: "Em estoque",
  filterOnSale: "Em oferta",
  priceAll: "Selecionar faixa de preço",
  usageTypeLabel: "Tipo de uso",
  usageAll: "Todos",
  usageHair: "Cabelo",
  usageBeard: "Barba",
  usageFinish: "Acabamento / finalização",
  categoryItems: modernCategoryItems,
  productCardAddCta: "Adicionar",
  productCardViewCta: "Ver produto",
  productCardTagProfile: "Compatível com seu perfil",
  productCardTagFast: "Entrega rápida",
  productCardTagEditorial: "Oferta",
};

const vintageStore: ClientStoreCommerceCopy = {
  pageTitle: "Loja BarberFlow",
  pageSubtitle: "Seleções para cuidar do seu visual com mais intenção, estilo e presença.",
  categoriesSectionTitle: "Cuidados por categoria",
  discoveryTitle: "Descubra seu próximo cuidado",
  discoveryLead: "Busque por produto, tipo de uso ou objetivo do seu visual.",
  searchSectionTitle: "Descubra seu próximo cuidado",
  searchPlaceholder: "Buscar por produto, marca ou necessidade",
  filterSectionTitle: "Refinar a vitrine",
  filterLabel: "Refinar",
  sortRelevance: "Ordem: sugestão da casa",
  sortBestsellers: "Mais escolhidos",
  sortPriceAsc: "Do menor investimento",
  sortPriceDesc: "Do maior investimento",
  sortRating: "Melhor avaliados",
  clearFilters: "Limpar seleção",
  quickDryHair: "Para cabelo seco",
  quickBeard: "Para barba",
  quickFinish: "Para acabamento",
  quickUnder50: "Até R$ 50",
  quickBestsellers: "Mais vendidos",
  quickSelectionsTitle: "Seleções rápidas",
  chipPromo: "Em oferta",
  chipRating: "Mais procurados",
  chipUnder50: "Até R$ 50",
  chipFast: "Entrega rápida",
  chipBarbershopChoice: "Escolhas da barbearia",
  timerTitle: "Ofertas do dia",
  timerEndsLabel: "Encerra em",
  offersLead: "Condições especiais por tempo limitado.",
  bestsellersTitle: "Favoritos da casa",
  bestsellersLead: "Produtos mais escolhidos por clientes e profissionais.",
  featuredTitle: "Favoritos da casa",
  flashTitle: "Ofertas do dia",
  recommendedTitle: "Recomendados para você",
  recommendedLead: "Seleção alinhada ao que você já busca na BarberFlow.",
  recommendedCta: "Ver recomendações",
  packagesTitle: "Experiências em pacote",
  vitrineTitle: "Explorar produtos",
  highlightsEyebrow: "Curadoria da casa",
  crossSellTitle: "Leve junto com",
  crossSellLead: "Cuidados que combinam bem com este tipo de produto na sua rotina.",
  allBarbershops: "Todas as barbearias",
  resultsCount: (n) => `${n} peça${n === 1 ? "" : "s"} na vitrine`,
  filterInStock: "Disponível agora",
  filterOnSale: "Em promoção",
  priceAll: "Faixa de investimento",
  usageTypeLabel: "Tipo de cuidado",
  usageAll: "Todos",
  usageHair: "Fios e couro cabeludo",
  usageBeard: "Barba e contorno",
  usageFinish: "Textura e acabamento",
  categoryItems: vintageCategoryItems,
  productCardAddCta: "Levar produto",
  productCardViewCta: "Ver detalhes",
  productCardTagProfile: "Bom para rotina",
  productCardTagFast: "Entrega rápida",
  productCardTagEditorial: "Escolha da casa",
};

const modernPdp: ClientProductCommerceCopy = {
  backToStore: "Voltar à loja",
  productTaglinePrefix: "Ideal para quem busca ",
  productTaglineSuffix: " com aplicação prática no dia a dia.",
  productTaglineVintagePrefix: "Um cuidado pensado para trazer ",
  productTaglineVintageSuffix: " ao seu visual diário.",
  primaryCta: "Comprar agora",
  secondaryAddToCart: "Adicionar ao carrinho",
  choiceBlockTitle: "Escolha sua versão",
  idealForSectionTitle: "Ideal para",
  idealForBullets: [
    "Cabelo com frizz ou falta de definição",
    "Acabamento matte ou natural",
    "Uso diário na rotina de grooming",
    "Quem quer fixação leve a média sem pesar",
  ],
  idealForSummary:
    "Indicado para quem busca acabamento matte com fixação leve a média para uso diário.",
  howToUseTitle: "Como usar",
  howToUseBody:
    "Aplique pequena quantidade nas mãos, espalhe bem e modele no cabelo seco ou levemente úmido.",
  profileBlockTitle: "Compatível com seu perfil",
  profileBlockBody:
    "Com base no seu diagnóstico, este produto combina com objetivos como controle de frizz, definição e acabamento natural.",
  profileBlockCta: "Abrir diagnóstico",
  profileRelatedCta: "Ver produtos parecidos",
  deliverySectionTitle: "Entrega e retirada",
  deliveryPickupLine: "Retirada na barbearia",
  idealForEyebrow: "Ideal para",
  expectedResultEyebrow: "Resultado esperado",
  idealForBody:
    "Quem busca acabamento profissional no dia a dia e produtos pensados para uso após o corte na barbearia.",
  expectedResultBody: "Controle de textura, fixação estável e visual alinhado por mais tempo.",
  tabHowToUse: "Como usar",
  tabIngredients: "Ingredientes & ficha",
  tabBenefits: "Benefícios",
  reviewsTitle: "Avaliações",
  reviewsCommunitySubtitle: "Média geral e experiências de quem já usou",
  reviewsPrompt: "Como foi sua experiência com este produto?",
  submitReviewCta: "Enviar avaliação",
  relatedTitle: "Combine com sua rotina",
  relatedLead: "Produtos que fazem sentido junto com este item no seu cuidado diário.",
  bundleTitle: "Monte seu kit",
  nearbyTitle: "Disponível em barbearias próximas",
  nearbyLead: "Retire em casas parceiras ou combine entrega no checkout.",
  trustSecure: "Compra segura BarberFlow",
  trustPickup: "Retirada na barbearia parceira",
  trustPayment: "Pagamento protegido",
  satisfactionNote: "Garantia de satisfação ou suporte direto com a barbearia.",
  routineIntroTitle: "Como este cuidado entra na sua rotina",
  routineIntroBody:
    "Ideal para finalizar o cabelo com textura natural e presença discreta no dia a dia.",
  whyChooseTitle: "Por que escolher este produto",
  whyChooseBullets: [
    "Acabamento matte e controle de brilho",
    "Aplicação simples, sem complicar a manhã",
    "Combina com rotina diária e pós-corte",
    "Visual limpo e natural",
  ],
};

const vintagePdp: ClientProductCommerceCopy = {
  backToStore: "Voltar à loja",
  productTaglinePrefix: "Ideal para quem busca ",
  productTaglineSuffix: " com aplicação prática no dia a dia.",
  productTaglineVintagePrefix: "Um cuidado pensado para trazer ",
  productTaglineVintageSuffix: " ao seu visual diário.",
  primaryCta: "Levar este produto",
  secondaryAddToCart: "Adicionar ao carrinho",
  choiceBlockTitle: "Escolha sua versão",
  idealForSectionTitle: "Ideal para",
  idealForBullets: [
    "Rotinas que valorizam ritual e presença",
    "Quem sai da cadeira e quer manter o acabamento",
    "Textura natural sem exagero",
  ],
  idealForSummary:
    "Pomada de acabamento matte para definição natural, ideal para rotinas modernas e acabamento discreto.",
  howToUseTitle: "Como usar",
  howToUseBody:
    "Em pouca quantidade, aqueça entre as palmas e distribua no comprimento; modele com pente ou dedos.",
  profileBlockTitle: "Combina com seu perfil",
  profileBlockBody:
    "Se você busca acabamento natural, controle sem brilho e praticidade na rotina, este produto conversa bem com seu estilo.",
  profileBlockCta: "Ver meu perfil capilar",
  profileRelatedCta: "Ver outros cuidados parecidos",
  deliverySectionTitle: "Disponível perto de você",
  deliveryPickupLine: "Retirada na barbearia",
  idealForEyebrow: "Para quem é",
  expectedResultEyebrow: "Como incluir na sua rotina",
  idealForBody:
    "Quem valoriza ritual de grooming, acabamento natural e produtos que acompanham o estilo depois da cadeira.",
  expectedResultBody:
    "Inclua após o banho ou o corte: pouca quantidade, modelagem com as mãos ou pente, e constância na semana.",
  tabHowToUse: "Como entra na rotina",
  tabIngredients: "Composição",
  tabBenefits: "O que você sente",
  reviewsTitle: "Avaliações da comunidade",
  reviewsCommunitySubtitle: "Experiências de quem já incluiu este produto na rotina",
  reviewsPrompt: "Como esse produto funcionou no seu dia a dia?",
  submitReviewCta: "Enviar avaliação",
  relatedTitle: "Leve junto com",
  relatedLead: "Cuidados que combinam bem com este produto na sua rotina.",
  bundleTitle: "Sugestão de kit",
  nearbyTitle: "Disponível em barbearias próximas",
  nearbyLead: "Retire em casas parceiras ou receba no endereço informado no checkout.",
  trustSecure: "Compra com respaldo BarberFlow",
  trustPickup: "Retirar na sua barbearia de confiança",
  trustPayment: "Checkout protegido",
  satisfactionNote: "Satisfação em primeiro lugar — fale com a barbearia se precisar de troca ou dúvida.",
  routineIntroTitle: "Como este cuidado entra na sua rotina",
  routineIntroBody:
    "Ideal para finalizar o cabelo com textura natural e presença discreta no dia a dia.",
  whyChooseTitle: "Por que escolher este produto",
  whyChooseBullets: [
    "Acabamento matte e controle leve",
    "Aplicação simples, sem pesar o visual",
    "Boa presença na rotina diária",
    "Visual limpo e natural",
  ],
};

export function getClientCommerceCopy(identity: Identity): ClientCommerceCopy {
  const isVintage = identity === "vintage";
  return {
    hero: HERO_BANNERS,
    store: isVintage ? vintageStore : modernStore,
    pdp: isVintage ? vintagePdp : modernPdp,
  };
}

/** Benefício curto para tagline conforme categoria */
export function getProductBenefitHint(category: string): string {
  if (category === "Pomadas") return "acabamento e fixação";
  if (category === "Barba") return "barba alinhada e hidratada";
  if (category === "Kits") return "rotina completa de cuidado";
  if (category === "Acessórios") return "precisão e praticidade no visual";
  return "hidratação e nutrição do fio";
}
