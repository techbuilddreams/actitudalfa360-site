<?php
// Crea una sesión de Stripe Checkout y devuelve su URL.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function fail(int $code, string $msg): void {
  http_response_code($code);
  echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Método no permitido.');

// La llave secreta vive FUERA del repo y de public_html (ver README).
$configFile = dirname(__DIR__, 2) . '/aa360-config.php';
$config = is_file($configFile) ? require $configFile : [];
$secret = $config['stripe_secret_key'] ?? getenv('STRIPE_SECRET_KEY') ?: '';
if ($secret === '') fail(500, 'La tienda todavía no está conectada a Stripe.');

$in = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
$sku = (string)($in['sku'] ?? '');
$qty = max(1, min(5, (int)($in['qty'] ?? 1)));

$products = require __DIR__ . '/products.php';
if (!isset($products[$sku])) fail(400, 'Producto no encontrado.');
$p = $products[$sku];

$site = 'https://actitudalfa360.com';
$shippingCents = (int)($config['shipping_cents'] ?? 899);

$params = [
  'mode' => 'payment',
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
      'fixed_amount' => ['amount' => $shippingCents, 'currency' => 'usd'],
      'delivery_estimate' => [
        'minimum' => ['unit' => 'business_day', 'value' => 5],
        'maximum' => ['unit' => 'business_day', 'value' => 10],
      ],
    ],
  ]],
  'phone_number_collection' => ['enabled' => 'true'],
  'automatic_tax' => ['enabled' => !empty($config['automatic_tax']) ? 'true' : 'false'],
  'success_url' => $site . '/gracias.html?session_id={CHECKOUT_SESSION_ID}',
  'cancel_url'  => $site . '/#tienda',
  'metadata' => [
    'sku' => $sku,
    'qty' => (string)$qty,
    'printify_product_id' => $p['printify_product_id'],
    'printify_variant_id' => (string)$p['printify_variant_id'],
  ],
];

$ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_USERPWD => $secret . ':',
  CURLOPT_POSTFIELDS => http_build_query($params),
  CURLOPT_TIMEOUT => 20,
]);
$body = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode((string)$body, true);
if ($status !== 200 || empty($data['url'])) {
  error_log('Stripe checkout error: ' . $body);
  fail(502, 'No se pudo iniciar el pago.');
}
echo json_encode(['url' => $data['url']]);
