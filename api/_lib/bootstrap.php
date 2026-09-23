<?php
// Carga de entorno, respuestas JSON y utilidades de seguridad. No accesible por web (.htaccess).
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

/** Raíz privada: domains/actitudalfa360.com (arriba de public_html). */
function aa_private_root(): string {
  return dirname(__DIR__, 3);
}

/** Lee .env una sola vez. Las variables reales del servidor tienen prioridad. */
function env(string $key, ?string $default = null): ?string {
  static $vars = null;
  if ($vars === null) {
    $vars = [];
    $file = aa_private_root() . '/.env';
    if (is_readable($file)) {
      foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) continue;
        [$k, $v] = array_map('trim', explode('=', $line, 2));
        $vars[$k] = trim($v, "\"'");
      }
    }
  }
  $real = getenv($key);
  if ($real !== false && $real !== '') return $real;
  return (isset($vars[$key]) && $vars[$key] !== '') ? $vars[$key] : $default;
}

function env_bool(string $key): bool {
  return in_array(strtolower((string)env($key, 'false')), ['1', 'true', 'yes', 'on'], true);
}

/** Carpeta privada para datos (pedidos, límites). Se crea con permisos 0700. */
function storage_dir(string $sub): string {
  $dir = aa_private_root() . '/storage/' . $sub;
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  return $dir;
}

function json_out(int $status, array $data): never {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header('X-Robots-Tag: noindex');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function client_ip(): string {
  return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/** Límite simple por IP: $max peticiones cada $window segundos. */
function rate_limit(string $bucket, int $max, int $window): void {
  $file = storage_dir('ratelimit') . '/' . $bucket . '-' . hash('sha256', client_ip()) . '.json';
  $now = time();
  $hits = [];
  if (is_file($file)) $hits = json_decode((string)file_get_contents($file), true) ?: [];
  $hits = array_values(array_filter($hits, fn($t) => $t > $now - $window));
  if (count($hits) >= $max) json_out(429, ['error' => 'Demasiados intentos. Espera un minuto.']);
  $hits[] = $now;
  file_put_contents($file, json_encode($hits), LOCK_EX);
}

/** Solo acepta peticiones del propio sitio (defensa CSRF para el checkout). */
function require_same_origin(): void {
  $site = rtrim((string)env('SITE_URL', 'https://actitudalfa360.com'), '/');
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $referer = $_SERVER['HTTP_REFERER'] ?? '';
  $ok = ($origin !== '' && rtrim($origin, '/') === $site)
     || ($origin === '' && str_starts_with($referer, $site . '/'));
  if (!$ok) json_out(403, ['error' => 'Origen no permitido.']);
}

/** Llamada a la API de Stripe (form-encoded). */
function stripe_request(string $method, string $path, array $params = [], ?string $idempotencyKey = null): array {
  $key = (string)env('STRIPE_SECRET_KEY', '');
  if ($key === '') throw new RuntimeException('STRIPE_SECRET_KEY no configurada');
  $ch = curl_init('https://api.stripe.com/v1/' . ltrim($path, '/'));
  $headers = ['Stripe-Version: 2024-06-20'];
  if ($idempotencyKey) $headers[] = 'Idempotency-Key: ' . $idempotencyKey;
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERPWD => $key . ':',
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_CUSTOMREQUEST => $method,
  ];
  if ($method === 'POST') $opts[CURLOPT_POSTFIELDS] = http_build_query($params);
  curl_setopt_array($ch, $opts);
  $body = curl_exec($ch);
  $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  $data = json_decode((string)$body, true) ?: [];
  if ($status >= 400) {
    error_log('[aa360] Stripe ' . $status . ': ' . ($data['error']['message'] ?? 'sin mensaje'));
    throw new RuntimeException('Stripe error ' . $status);
  }
  return $data;
}
