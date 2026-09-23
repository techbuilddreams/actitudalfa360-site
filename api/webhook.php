<?php
// POST /api/webhook.php — Stripe → checkout.session.completed
// Verifica la firma, guarda el pedido (una sola vez) y, si está activado, crea el pedido en Printify EN ESPERA.
declare(strict_types=1);
require __DIR__ . '/_lib/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(405, ['error' => 'method']);

$payload = file_get_contents('php://input', false, null, 0, 512000) ?: '';
$secret  = (string)env('STRIPE_WEBHOOK_SECRET', '');
$sigHdr  = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
if ($secret === '' || !verify_stripe_signature($payload, $sigHdr, $secret, 300)) {
  json_out(400, ['error' => 'signature']);
}

$event = json_decode($payload, true);
if (!is_array($event) || ($event['type'] ?? '') !== 'checkout.session.completed') {
  json_out(200, ['received' => true]);   // Otros eventos: se ignoran.
}

$s = $event['data']['object'] ?? [];
if (($s['payment_status'] ?? '') !== 'paid') json_out(200, ['received' => true]);

$sessionId = preg_replace('/[^A-Za-z0-9_]/', '', (string)($s['id'] ?? ''));
if ($sessionId === '') json_out(400, ['error' => 'session']);

// Idempotencia: Stripe puede reenviar el mismo evento.
$orderFile = storage_dir('orders') . '/' . $sessionId . '.json';
if (is_file($orderFile)) json_out(200, ['received' => true, 'duplicate' => true]);

$products = require __DIR__ . '/_lib/products.php';
$sku = (string)($s['metadata']['sku'] ?? '');
$qty = max(1, min(5, (int)($s['metadata']['qty'] ?? 1)));
$ship = $s['shipping_details'] ?? ($s['collected_information']['shipping_details'] ?? []);
$addr = $ship['address'] ?? [];
$cust = $s['customer_details'] ?? [];

$order = [
  'session_id' => $sessionId,
  'created'    => date('c'),
  'sku'        => $sku,
  'qty'        => $qty,
  'amount_total' => $s['amount_total'] ?? null,
  'email'      => $cust['email'] ?? null,
  'phone'      => $cust['phone'] ?? null,
  'name'       => $ship['name'] ?? ($cust['name'] ?? null),
  'address'    => $addr,
  'printify'   => null,
];

// Printify: pedido en espera (no se manda a producción automáticamente).
if (env_bool('PRINTIFY_AUTO_ORDER') && isset($products[$sku])) {
  try {
    $order['printify'] = printify_create_order($order, $products[$sku]);
  } catch (Throwable $e) {
    error_log('[aa360] Printify: ' . $e->getMessage());
    $order['printify'] = ['error' => 'no creado'];
  }
}

file_put_contents($orderFile, json_encode($order, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
@chmod($orderFile, 0600);

$notify = (string)env('ORDER_NOTIFY_EMAIL', '');
if ($notify !== '' && filter_var($notify, FILTER_VALIDATE_EMAIL)) {
  $pf = is_array($order['printify']) && isset($order['printify']['id']) ? 'Creado en Printify (en espera): ' . $order['printify']['id'] : 'Crear en Printify a mano.';
  @mail($notify, 'Nueva venta Actitud Alfa 360: ' . $sku . ' x' . $qty,
    "Pedido $sessionId\nProducto: $sku x$qty\nTotal: $" . number_format(((int)$order['amount_total']) / 100, 2) . "\n$pf\n",
    'From: tienda@' . parse_url((string)env('SITE_URL', 'https://actitudalfa360.com'), PHP_URL_HOST));
}

json_out(200, ['received' => true]);

// ───────────────────────── helpers ─────────────────────────

function verify_stripe_signature(string $payload, string $header, string $secret, int $tolerance): bool {
  $ts = null; $sigs = [];
  foreach (explode(',', $header) as $part) {
    [$k, $v] = array_pad(explode('=', trim($part), 2), 2, '');
    if ($k === 't') $ts = (int)$v;
    if ($k === 'v1') $sigs[] = $v;
  }
  if (!$ts || !$sigs || abs(time() - $ts) > $tolerance) return false;
  $expected = hash_hmac('sha256', $ts . '.' . $payload, $secret);
  foreach ($sigs as $sig) if (hash_equals($expected, $sig)) return true;
  return false;
}

function printify_create_order(array $o, array $p): array {
  $token = (string)env('PRINTIFY_API_TOKEN', '');
  $shop  = preg_replace('/\D/', '', (string)env('PRINTIFY_SHOP_ID', ''));
  if ($token === '' || $shop === '') throw new RuntimeException('Printify no configurado');
  [$first, $last] = array_pad(explode(' ', trim((string)$o['name']), 2), 2, '');
  $a = $o['address'];
  $body = [
    'external_id' => $o['session_id'],
    'label' => 'Web ' . substr($o['session_id'], -8),
    'line_items' => [[
      'product_id' => $p['printify_product_id'],
      'variant_id' => $p['printify_variant_id'],
      'quantity' => $o['qty'],
    ]],
    'shipping_method' => 1,
    'send_shipping_notification' => true,
    'address_to' => [
      'first_name' => $first, 'last_name' => $last,
      'email' => $o['email'], 'phone' => $o['phone'],
      'country' => $a['country'] ?? 'US', 'region' => $a['state'] ?? '',
      'address1' => $a['line1'] ?? '', 'address2' => $a['line2'] ?? '',
      'city' => $a['city'] ?? '', 'zip' => $a['postal_code'] ?? '',
    ],
  ];
  $ch = curl_init("https://api.printify.com/v1/shops/$shop/orders.json");
  curl_setopt_array($ch, [
    CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token, 'Content-Type: application/json', 'User-Agent: actitudalfa360'],
    CURLOPT_POSTFIELDS => json_encode($body),
  ]);
  $res = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  if ($code >= 300) throw new RuntimeException("HTTP $code");
  return json_decode((string)$res, true) ?: [];
}
