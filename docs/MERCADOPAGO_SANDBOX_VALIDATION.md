# Validação Sandbox — Mercado Pago (Checkout Pro + Webhook)

## 1. Objetivo

Registrar a validação end-to-end, em ambiente SANDBOX, do fluxo de pagamento
via Checkout Pro do Mercado Pago integrado à Krema Tabacaria: criação de
preferência, pagamento real de teste, notificação de webhook, validação de
assinatura e confirmação atômica do pedido (com baixa de estoque) via RPC
`confirm_order_payment`.

## 2. Ambiente

- **Modo:** exclusivamente Sandbox do Mercado Pago — nenhuma credencial de
  produção utilizada em nenhuma etapa.
- **Vendedor:** aplicação de teste ("kremateste"), usando o Access Token de
  Credenciais de Teste do Checkout Pro.
- **Comprador:** Buyer Test User oficial da aplicação (conta de teste
  distinta da conta do vendedor, com saldo de sandbox).
- **Backend local:** `app/api/checkout/payment`, `app/api/webhooks/mercadopago`
  e a RPC `confirm_order_payment` (Supabase), rodando em ambiente de
  desenvolvimento local.

## 3. Fluxo validado

1. Criação de uma preferência de pagamento (Checkout Pro) via backend da
   Krema.
2. Abertura do Checkout Pro em sandbox e autenticação exclusivamente com a
   Buyer Test User oficial da aplicação (nunca com a conta real do
   vendedor).
3. Conclusão do pagamento dentro do Checkout Pro, com resultado aprovado.
4. Confirmação do `payment_id` diretamente pela API do Mercado Pago (nunca
   confiando apenas no retorno do client).
5. Envio da notificação de webhook ao endpoint local.
6. Validação da assinatura da notificação (`x-signature` e `x-request-id`)
   usando o segredo configurado no ambiente.
7. Resolução do `external_reference` da notificação até o pedido
   correspondente no banco.
8. Chamada da RPC `confirm_order_payment`, responsável por confirmar o
   pedido e dar baixa de estoque de forma atômica.

## 4. Cenários validados

| Cenário | Resultado |
| --- | --- |
| Checkout Pro concluído com a Buyer Test User oficial | ✅ Pagamento aprovado |
| Confirmação do `payment_id` via consulta direta à API do Mercado Pago | ✅ Confirmado |
| Processamento da notificação de webhook | ✅ HTTP 200 |
| Validação de `x-signature` / `x-request-id` com o segredo real | ✅ Assinatura válida |
| Confirmação do pedido após o webhook | ✅ Pedido confirmado |
| `payment_status` do pedido após confirmação | ✅ `approved` |
| Baixa de estoque após confirmação | ✅ Decrementada corretamente, uma única vez |
| Reenvio (replay) da mesma notificação de webhook | ✅ Reconhecido como idempotente — não duplicou a baixa de estoque |
| Notificação com assinatura adulterada | ✅ Rejeitada com HTTP 401 |
| Notificação com `payment_id` inexistente | ✅ Rejeitada com HTTP 400 |
| Notificação de pagamento não aprovado | ✅ Validado em rodada anterior desta mesma sessão — pedido não confirmado |
| Remoção dos dados de teste (QA) após a validação | ✅ Concluída |

## 5. Resultado

O fluxo de pagamento em Sandbox — do Checkout Pro até a confirmação
atômica do pedido via webhook — foi validado ponta a ponta com sucesso,
incluindo os principais cenários de erro e o comportamento idempotente em
caso de reenvio de notificação. Nenhum dado sensível (token, segredo,
e-mail de conta de teste, `payment_id` ou qualquer credencial) é
registrado neste documento.

## 6. Limitações

- Validação realizada manualmente em ambiente Sandbox local; ainda não
  há automação contínua (CI) cobrindo este fluxo.
- O cenário de pagamento não aprovado foi validado em uma rodada anterior
  da mesma sessão, não reexecutado junto com os demais cenários desta
  validação específica.
- Nenhuma integração de frontend de checkout foi validada nesta etapa —
  o teste cobre exclusivamente o backend (preferência, webhook e RPC de
  confirmação).
- Nenhuma integração com Melhor Envio foi validada nesta etapa.
- Esta validação não substitui testes em produção com credenciais reais,
  que devem ocorrer em uma etapa própria e futura.
