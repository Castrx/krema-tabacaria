// Primeira etapa do checkout com entrega (venda fora de Arroio do Sal) —
// só a coleta e validação dos dados de entrega. Sem gateway de pagamento,
// sem cálculo de frete, sem baixa de estoque: isso fica para uma etapa
// futura (ver lib/checkout.ts).

export type DeliveryDetails = {
  fullName: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  /** Único campo opcional da lista de campos do checkout. */
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

/** Estado bruto do formulário — mesmos campos de DeliveryDetails, mas antes
 * de validar/normalizar (o usuário pode digitar CEP sem máscara, telefone
 * com parênteses, etc.). */
export type DeliveryFormInput = DeliveryDetails;

export const DELIVERY_FIELDS = [
  "fullName",
  "phone",
  "cep",
  "street",
  "number",
  "complement",
  "neighborhood",
  "city",
  "state",
] as const;

export type DeliveryField = (typeof DELIVERY_FIELDS)[number];

/** Uma mensagem de erro por campo inválido — campo ausente do objeto =
 * campo válido. Usado tanto no client (feedback imediato) quanto na
 * resposta 400 da Route Handler (revalidação no servidor). */
export type DeliveryFormErrors = Partial<Record<DeliveryField, string>>;
