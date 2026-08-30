// Constantes compartilhadas do site público — fonte única de verdade para
// valores hoje duplicados entre vários componentes.

/**
 * Número de WhatsApp da Krema (formato E.164 sem "+", como o wa.me espera:
 * DDI 55 + DDD 51 + número). Usado tanto para montar links `wa.me/...`
 * (Header, Footer, Hero, Location) quanto para montar a mensagem final do
 * pedido (WhatsAppOrderLink). Mudar o número da loja é alterar só esta
 * linha — nunca editar um `wa.me/...` hardcoded de novo.
 */
export const WHATSAPP_NUMBER = "5551992729284";
