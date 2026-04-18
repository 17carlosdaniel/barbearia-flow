export const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

/** Principais cidades por estado (amostra para seleção). Em produção viria de API/banco. */
export const CIDADES_POR_ESTADO: Record<string, string[]> = {
  SP: ["São Paulo", "Campinas", "Santos", "Guarulhos", "Ribeirão Preto", "Outra"],
  RJ: ["Rio de Janeiro", "Niterói", "Nova Iguaçu", "Outra"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Outra"],
  RS: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Outra"],
  PR: ["Curitiba", "Londrina", "Maringá", "Outra"],
  SC: ["Florianópolis", "Joinville", "Blumenau", "Outra"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Outra"],
  PE: ["Recife", "Olinda", "Caruaru", "Outra"],
  CE: ["Fortaleza", "Caucaia", "Outra"],
  DF: ["Brasília", "Outra"],
  GO: ["Goiânia", "Aparecida de Goiânia", "Outra"],
  ES: ["Vitória", "Vila Velha", "Outra"],
  PB: ["João Pessoa", "Campina Grande", "Outra"],
  RN: ["Natal", "Mossoró", "Outra"],
  AL: ["Maceió", "Outra"],
  SE: ["Aracaju", "Outra"],
  MA: ["São Luís", "Outra"],
  PI: ["Teresina", "Outra"],
  PA: ["Belém", "Outra"],
  AM: ["Manaus", "Outra"],
  RO: ["Porto Velho", "Outra"],
  RR: ["Boa Vista", "Outra"],
  AC: ["Rio Branco", "Outra"],
  AP: ["Macapá", "Outra"],
  MT: ["Cuiabá", "Várzea Grande", "Outra"],
  MS: ["Campo Grande", "Outra"],
  TO: ["Palmas", "Outra"],
};

export function getCidades(estado: string): string[] {
  return CIDADES_POR_ESTADO[estado] ?? ["Outra"];
}
