// Validação da primeira etapa do checkout com entrega — usada tanto no
// client (components/checkout/DeliveryCheckoutForm.tsx, feedback
// imediato) quanto no servidor (app/api/checkout/delivery/route.ts,
// revalidação — nunca confia só no client). Módulo isomórfico de
// propósito: nenhuma API de DOM/Node, só string/regex, pra poder ser
// importado dos dois lados sem duplicar a regra em dois lugares.
//
// Escopo desta etapa: só validar os dados de entrega. Nenhuma
// integração externa de CEP (sem busca de endereço por CEP), nenhum
// cálculo de frete, nenhuma baixa de estoque, e — de propósito — nenhuma
// ligação com a criação de pedido ainda: app/api/orders/route.ts e
// lib/orders.ts continuam exatamente como estavam antes desta etapa,
// sem saber que este módulo existe. A etapa futura de frete/pagamento é
// que vai conectar os dois.

import type {
  DeliveryDetails,
  DeliveryField,
  DeliveryFormErrors,
} from "@/types/checkout";

/** As 27 UFs — usado num <select> no formulário (evita erro de digitação
 * e cobre a validação de "estado obrigatório" sem precisar de lista
 * externa). Puramente estrutural (sigla + nome), não é informação
 * comercial da Krema. */
export const BRAZILIAN_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
] as const;

const STATE_CODES = new Set(BRAZILIAN_STATES.map((state) => state.code));

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** CEP brasileiro: sempre 8 dígitos (com ou sem hífen). Só o formato é
 * checado aqui — nenhuma consulta a serviço externo (ViaCEP ou
 * equivalente) para confirmar que o CEP existe de verdade; isso fica
 * para uma etapa futura, se vier a ser necessário. */
function isValidCep(digits: string): boolean {
  return digits.length === 8;
}

/** Telefone BR com DDD: 10 dígitos (fixo) ou 11 (celular com o 9º
 * dígito) — mesmo formato já usado em WHATSAPP_NUMBER (lib/constants.ts),
 * só que aqui sem o DDI 55 (é o telefone do cliente, não da loja). */
function isValidPhone(digits: string): boolean {
  return digits.length === 10 || digits.length === 11;
}

/** Raw = o que o formulário manda (qualquer string, inclusive undefined
 * pra campo não preenchido). Normaliza tudo pra string antes de validar,
 * pra nunca estourar em .trim() de um valor ausente. */
export type RawDeliveryFormInput = Partial<Record<DeliveryField, unknown>>;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export type DeliveryValidationResult =
  | { valid: true; errors: Record<string, never>; value: DeliveryDetails }
  | { valid: false; errors: DeliveryFormErrors; value: null };

/**
 * Valida e normaliza os dados de entrega. Sempre roda por inteiro (não
 * para no primeiro erro) — o formulário precisa mostrar todos os campos
 * inválidos de uma vez, não um por vez a cada submit.
 */
export function validateDeliveryDetails(
  input: RawDeliveryFormInput,
): DeliveryValidationResult {
  const errors: DeliveryFormErrors = {};

  const fullName = asString(input.fullName);
  if (fullName.length < 3) {
    errors.fullName = "Informe o nome completo.";
  }

  const phoneDigits = onlyDigits(asString(input.phone));
  if (!isValidPhone(phoneDigits)) {
    errors.phone = "Telefone inválido — inclua o DDD.";
  }

  const cepDigits = onlyDigits(asString(input.cep));
  if (!isValidCep(cepDigits)) {
    errors.cep = "CEP inválido — deve ter 8 dígitos.";
  }

  const street = asString(input.street);
  if (!street) {
    errors.street = "Informe o endereço.";
  }

  const number = asString(input.number);
  if (!number) {
    errors.number = "Informe o número (ou S/N).";
  }

  // Único campo opcional da lista — sem validação de presença.
  const complement = asString(input.complement);

  const neighborhood = asString(input.neighborhood);
  if (!neighborhood) {
    errors.neighborhood = "Informe o bairro.";
  }

  const city = asString(input.city);
  if (!city) {
    errors.city = "Informe a cidade.";
  }

  const state = asString(input.state).toUpperCase();
  if (!STATE_CODES.has(state as (typeof BRAZILIAN_STATES)[number]["code"])) {
    errors.state = "Selecione um estado válido.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors, value: null };
  }

  return {
    valid: true,
    errors: {} as Record<string, never>,
    value: {
      fullName,
      phone: phoneDigits,
      cep: cepDigits,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
    },
  };
}

// Formatação pra exibição (CEP com hífen, telefone com parênteses) e
// composição da mensagem do pedido (ex.: anexar o endereço à mensagem do
// WhatsApp) ficam para quando a etapa de frete/pagamento conectar esses
// dados validados a um pedido de verdade — não existe esse consumidor
// ainda nesta etapa, então não é criado agora (evita função sem uso real
// hoje, que só desatualiza sem ninguém notar até lá).
