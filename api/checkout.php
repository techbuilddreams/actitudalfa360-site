<?php
// POST /api/checkout.php  { sku, qty }  →  { url }  (Stripe Checkout)
declare(strict_types=1);
require __DIR__ . '/_lib/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(405, ['error' => 'Método no permitido.']);
require_same_origin();
rate_limit('checkout', 10, 60);

if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) json_out(415, ['error' => 'Formato no válido.']);
$raw = file_get_contents('php://input', false, null, 0, 2048) ?: '';
$in = json_decode($raw, true);
if (!is_array($in)) json_out(400, ['error' => 'Petición no válida.']);

$sku = is_string($in['sku'] ?? null) ? $in['sku'] : '';
$qty = filter_var($in['qty'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 5]]);
if ($qty === false) json_out(400, ['error' => 'Cantidad no válida.']);

$products = require __DIR__ . '/_lib/products.php';
if (!isset($products[$sku])) json_out(400, ['error' => 'Producto no encontrado.']);
$p = $products[$sku];   // El precio SIEMPRE sale del servidor, nunca del navegador.

$site = rtrim((string)env('SITE_URL', 'https://actitudalfa360.com'), '/');

$params = [
  'mode' => 'payment',
  'payment_method_types' => ['card'],   // tarjeta + Apple Pay + Google Pay; sin métodos diferidos
  'locale' => 'es',
  'line_items' => [[
    'quantity' => $qty,
    'price_data' => [
      'currency' => 'usd',
      'unit_amount' => $p['amount'],
      'product_data' => ['name' => $p['name'], 'images' => [$p['image']]],
    ],
  ]],
  'shipping_address_collection' => ['allowed_countries' => ['US']],
  'shipping_options' => [[
    'shipping_rate_data' => [
      'type' => 'fixed_amount',
      'display_name' => 'Envío estándar EE.UU.',
      'fixed_amount' => ['amount' => (int)env('SHIPPING_CENTS', '899'), 'currency' => 'usd'],
      'delivery_estimate' => [
        'minimum' => ['unit' => 'business_day', 'value' => 5],
        'maximum' => ['unit' => 'business_day', 'value' => 10],
      ],
    ],
  ]],
  'phone_number_collection' => ['enabled' => 'true'],
  'automatic_tax' => ['enabled' => env_bool('AUTOMATIC_TAX') ? 'true' : 'false'],
  'success_url' => $site . '/gracias.html?session_id={CHECKOUT_SESSION_ID}',
  'cancel_url'  => $site . '/#tienda',
  'metadata' => ['sku' => $sku, 'qty' => (string)$qty],
  'payment_intent_data' => ['metadata' => ['sku' => $sku, 'qty' => (string)$qty]],
];

try {
  $session = stripe_request('POST', 'checkout/sessions', $params, bin2hex(random_bytes(16)));
} catch (Throwable $e) {
  json_out(502, ['error' => 'No se pudo iniciar el pago.']);
}
if (empty($session['url'])) json_out(502, ['error' => 'No se pudo iniciar el pago.']);
json_out(200, ['url' => $session['url']]);
