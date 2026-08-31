"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { BRAZILIAN_STATES, validateDeliveryDetails } from "@/lib/checkout";
import type { DeliveryField, DeliveryFormErrors } from "@/types/checkout";

// Primeira etapa do checkout com entrega (venda fora de Arroio do Sal) —
// só coleta e valida os dados de entrega (client + server), nada além
// disso. Sem gateway de pagamento, sem cálculo de frete, sem baixa de
// estoque, e — de propósito, nesta etapa — sem criar pedido nem enviar
// nada pro WhatsApp: o fluxo de pedido existente (WhatsAppOrderLink.tsx
// → app/api/orders/route.ts → lib/orders.ts) continua exatamente como
// estava, intocado, pra quem quiser usar o atalho rápido sem entrega.
//
// Ao validar com sucesso (client E server, via POST /api/checkout/delivery
// — que só valida, não grava nada em orders/order_items), mostra uma
// confirmação e para por aí. A etapa futura de frete/pagamento é que vai
// conectar esses dados validados a um pedido de verdade.

type FormValues = Record<DeliveryField, string>;

const emptyValues: FormValues = {
  fullName: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

const inputClassName =
  "w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30";
const labelClassName = "text-xs uppercase tracking-[0.14em] text-white/50";
const errorClassName = "text-xs text-red-400";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className={errorClassName}>
          {error}
        </p>
      )}
    </div>
  );
}

export function DeliveryCheckoutForm({ onBack }: { onBack: () => void }) {
  const { items } = useCart();
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<DeliveryFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const setField = (field: DeliveryField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    // Validação client-side primeiro — nenhuma requisição sai antes disso
    // passar. Mesma função usada no servidor (lib/checkout.ts), então o
    // que passa aqui é exatamente o que o servidor também aceitaria.
    const clientResult = validateDeliveryDetails(values);
    if (!clientResult.valid) {
      setErrors(clientResult.errors);
      setFormError("Corrija os campos destacados antes de continuar.");
      return;
    }

    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      // Só valida no servidor — não cria pedido, não grava nada, não
      // abre WhatsApp. Ver app/api/checkout/delivery/route.ts.
      const response = await fetch("/api/checkout/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery: clientResult.value }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        if (body?.fieldErrors) {
          setErrors(body.fieldErrors as DeliveryFormErrors);
        }
        throw new Error(
          body?.error ?? `Não foi possível validar os dados (${response.status}).`,
        );
      }

      setConfirmed(true);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Não foi possível validar os dados. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <CheckCircle2 className="size-10 text-white" />
        <div>
          <p className="text-sm font-medium text-white">
            Dados de entrega confirmados.
          </p>
          <p className="mt-1.5 text-xs leading-5 text-white/50">
            Frete e pagamento para fora de Arroio do Sal ainda são
            combinados diretamente com a Krema — em breve essa etapa
            passa a acontecer aqui. Por enquanto, fale com a Krema pelo
            WhatsApp pra fechar o pedido com esses dados em mãos.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
        >
          Voltar ao carrinho
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      // noValidate: a validação é a nossa (client + server, lib/checkout.ts)
      // — evita o navegador mostrar seu próprio balão de erro em paralelo
      // com o nosso texto de erro abaixo do campo.
      noValidate
      className="flex flex-1 flex-col overflow-y-auto px-4"
    >
      <button
        type="button"
        onClick={onBack}
        className="w-fit py-3 text-xs text-white/50 transition hover:text-white"
      >
        ← Voltar ao carrinho
      </button>

      <p className="mb-4 text-xs leading-5 text-white/50">
        Dados para entrega fora de Arroio do Sal. Frete e forma de
        pagamento ainda são combinados com a Krema pelo WhatsApp — esta
        etapa só confirma se o endereço está completo e válido.
      </p>

      <div className="flex flex-col gap-4 pb-4">
        <Field id="fullName" label="Nome completo" error={errors.fullName}>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            className={inputClassName}
          />
        </Field>

        <Field id="phone" label="Telefone" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(51) 99999-9999"
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={inputClassName}
          />
        </Field>

        <Field id="cep" label="CEP" error={errors.cep}>
          <input
            id="cep"
            name="cep"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="99999-999"
            value={values.cep}
            onChange={(e) => setField("cep", e.target.value)}
            aria-invalid={Boolean(errors.cep)}
            aria-describedby={errors.cep ? "cep-error" : undefined}
            className={inputClassName}
          />
        </Field>

        <Field id="street" label="Endereço" error={errors.street}>
          <input
            id="street"
            name="street"
            type="text"
            autoComplete="address-line1"
            value={values.street}
            onChange={(e) => setField("street", e.target.value)}
            aria-invalid={Boolean(errors.street)}
            aria-describedby={errors.street ? "street-error" : undefined}
            className={inputClassName}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="number" label="Número" error={errors.number}>
            <input
              id="number"
              name="number"
              type="text"
              placeholder="S/N"
              value={values.number}
              onChange={(e) => setField("number", e.target.value)}
              aria-invalid={Boolean(errors.number)}
              aria-describedby={errors.number ? "number-error" : undefined}
              className={inputClassName}
            />
          </Field>

          <Field id="complement" label="Complemento (opcional)">
            <input
              id="complement"
              name="complement"
              type="text"
              autoComplete="address-line2"
              value={values.complement}
              onChange={(e) => setField("complement", e.target.value)}
              className={inputClassName}
            />
          </Field>
        </div>

        <Field id="neighborhood" label="Bairro" error={errors.neighborhood}>
          <input
            id="neighborhood"
            name="neighborhood"
            type="text"
            value={values.neighborhood}
            onChange={(e) => setField("neighborhood", e.target.value)}
            aria-invalid={Boolean(errors.neighborhood)}
            aria-describedby={
              errors.neighborhood ? "neighborhood-error" : undefined
            }
            className={inputClassName}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="city" label="Cidade" error={errors.city}>
            <input
              id="city"
              name="city"
              type="text"
              autoComplete="address-level2"
              value={values.city}
              onChange={(e) => setField("city", e.target.value)}
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? "city-error" : undefined}
              className={inputClassName}
            />
          </Field>

          <Field id="state" label="Estado" error={errors.state}>
            <select
              id="state"
              name="state"
              autoComplete="address-level1"
              value={values.state}
              onChange={(e) => setField("state", e.target.value)}
              aria-invalid={Boolean(errors.state)}
              aria-describedby={errors.state ? "state-error" : undefined}
              className={inputClassName}
            >
              <option value="" disabled>
                UF
              </option>
              {BRAZILIAN_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.code}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto flex flex-col gap-2 border-t border-white/10 bg-[#0b0b0b] py-4">
        {formError && (
          <p role="alert" className="text-center text-xs text-red-400">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Validando..." : "Confirmar dados de entrega"}
        </button>

        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-white/30">
          Preços demonstrativos
        </p>
      </div>
    </form>
  );
}
