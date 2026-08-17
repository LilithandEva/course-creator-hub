const clientToken = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Los pagos reales aún no están activados. Completa la activación de pagos para cobrar de verdad.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-accent/40 bg-accent/15 px-4 py-2 text-center text-sm text-foreground">
        Modo de prueba: usa la tarjeta 4242 4242 4242 4242 para simular una compra.
      </div>
    );
  }
  return null;
}
