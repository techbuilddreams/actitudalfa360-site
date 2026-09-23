<?php
// COPIA este archivo a: domains/actitudalfa360.com/aa360-config.php (un nivel ARRIBA de public_html).
// Nunca lo subas a GitHub.
return [
  'stripe_secret_key' => 'sk_live_...',   // o sk_test_... para probar
  'shipping_cents'    => 899,            // envío fijo por pedido
  'automatic_tax'     => false,          // true cuando Stripe Tax esté configurado
];
