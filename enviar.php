<?php
/* ==============================================================
   Marcos Cerrajeros · envío de los formularios de la web (bloque 58)
   Recibe «Que me llamen» (tipo=llamada) y «Enviar mensaje» (tipo=mensaje)
   de todas las páginas y manda un correo a Marcos.

   Responde de dos maneras:
   · Si lo llama el JavaScript de la web (fetch), devuelve JSON y la
     página enseña el aviso sin recargar.
   · Si el navegador no tiene JavaScript, redirige a /gracias/.

   Antispam sin captchas: campo trampa oculto («web»), tiempo mínimo
   de relleno y un límite de envíos por IP.
   ============================================================== */

/* ---------- CONFIGURACIÓN: lo único que puede hacer falta tocar ---------- */
const DESTINO   = 'marcoscerrajeros.es@gmail.com';
// Remitente: TIENE que ser un buzón que exista en el dominio, o el servidor
// de WebEmpresa rechaza o manda a spam el correo. Confirmar cuál antes de subir.
const REMITENTE = 'web@marcoscerrajeros.es';
const NOMBRE_REMITENTE = 'Web Marcos Cerrajeros';
const MAX_ENVIOS_POR_HORA = 5;
/* ------------------------------------------------------------------------- */

date_default_timezone_set('Europe/Madrid');
header('X-Robots-Tag: noindex, nofollow');

function responder(bool $ok, string $motivo = '', int $codigo = 200): void {
    $quiereJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;
    if ($quiereJson) {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'motivo' => $motivo], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($ok) {
        header('Location: /gracias/', true, 303);
        exit;
    }
    http_response_code($codigo);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
       . '<title>No se ha podido enviar | Marcos Cerrajeros Alcorcón</title>'
       . '<body style="font-family:system-ui,sans-serif;max-width:560px;margin:10vh auto;padding:0 24px;line-height:1.6">'
       . '<h1>No se ha podido enviar</h1><p>' . htmlspecialchars($motivo, ENT_QUOTES, 'UTF-8') . '</p>'
       . '<p>Llámenos al <a href="tel:+34663250778">663 250 778</a>, de lunes a viernes de 8:00 a 20:00, '
       . 'o <a href="javascript:history.back()">vuelva atrás</a> e inténtelo de nuevo.</p></body></html>';
    exit;
}

// Recorte seguro con tildes, aunque el servidor no tenga mbstring.
function corte(string $s, int $max): string {
    if (function_exists('mb_substr')) { return mb_substr($s, 0, $max, 'UTF-8'); }
    if (function_exists('iconv_substr')) { $r = iconv_substr($s, 0, $max, 'UTF-8'); return $r === false ? '' : $r; }
    return preg_match('/^.{0,' . $max . '}/us', $s, $m) ? $m[0] : substr($s, 0, $max);
}

function limpio(string $s, int $max): string {
    $s = str_replace(["\r", "\n", "\t"], ' ', $s);      // nada de saltos: evita inyección de cabeceras
    $s = trim(preg_replace('/\s+/u', ' ', $s));
    return corte($s, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: /', true, 303);
    exit;
}

// 1 · Campo trampa: una persona no lo ve; un robot lo rellena.
if (!empty($_POST['web'])) {
    responder(true);                                    // al robot se le dice que sí, y no se envía nada
}

// 2 · Tiempo mínimo: el JavaScript apunta cuándo se abrió la página.
$t = isset($_POST['t']) ? (int) $_POST['t'] : 0;
if ($t > 0 && (time() * 1000 - $t) < 3000) {
    responder(true);
}

// 3 · Límite de envíos por IP y hora.
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$marca = sys_get_temp_dir() . '/mc_form_' . md5($ip . date('YmdH'));
$cuenta = is_file($marca) ? (int) file_get_contents($marca) : 0;
if ($cuenta >= MAX_ENVIOS_POR_HORA) {
    responder(false, 'Ha enviado varios mensajes seguidos. Si es urgente, llámenos.', 429);
}

// 4 · Datos.
$tipo      = ($_POST['tipo'] ?? '') === 'mensaje' ? 'mensaje' : 'llamada';
$nombre    = limpio((string) ($_POST['nombre'] ?? ''), 80);
$telefono  = limpio((string) ($_POST['telefono'] ?? ''), 30);
$necesita  = trim(corte((string) ($_POST['necesita'] ?? ''), 2000));
$privacidad = !empty($_POST['privacidad']);
$digitos   = preg_replace('/\D/', '', $telefono);

if ($nombre === '' || strlen($digitos) < 9 || strlen($digitos) > 15) {
    responder(false, 'Revise el nombre y el teléfono: el teléfono necesita al menos 9 cifras.', 422);
}
if (!$privacidad) {
    responder(false, 'Para enviar el formulario hay que aceptar la política de privacidad.', 422);
}

// 5 · De qué página viene (solo la ruta, sin dominio).
$pagina = '/';
if (!empty($_SERVER['HTTP_REFERER'])) {
    $ruta = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_PATH);
    if (is_string($ruta) && $ruta !== '') { $pagina = $ruta; }
}

// 6 · El correo.
// Dos correos distintos: «Que me llamen» (solo nombre y teléfono) y «Mensaje» (con su texto).
if ($tipo === 'llamada') {
    $asunto = 'Web · Quiere que le llames: ' . $nombre . ' (' . $telefono . ')';
    $cuerpo = "$nombre ha pedido desde la web que le llames.\n\n"
            . "Nombre:   $nombre\n"
            . "Teléfono: $telefono\n"
            . ($necesita !== '' ? "\nComentario:\n$necesita\n" : '');
} else {
    $asunto = 'Web · Mensaje de ' . $nombre . ' (' . $telefono . ')';
    $cuerpo = "$nombre te ha dejado un mensaje en la web.\n\n"
            . "Nombre:   $nombre\n"
            . "Teléfono: $telefono\n"
            . "\nMensaje:\n" . ($necesita !== '' ? $necesita : '(No ha escrito nada. Llámale al teléfono de arriba.)') . "\n";
}
$cuerpo = $cuerpo
        . "\nPágina:   https://www.marcoscerrajeros.es$pagina\n"
        . 'Fecha:    ' . date('d/m/Y H:i') . "\n"
        . "\nAceptó la política de privacidad.\n";

$cabeceras = [
    'From: ' . '=?UTF-8?B?' . base64_encode(NOMBRE_REMITENTE) . '?= <' . REMITENTE . '>',
    'Reply-To: ' . REMITENTE,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: marcoscerrajeros.es',
];

$enviado = mail(DESTINO, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $cuerpo, implode("\r\n", $cabeceras), '-f' . REMITENTE);

if (!$enviado) {
    responder(false, 'El servidor no ha podido enviar el mensaje.', 500);
}

file_put_contents($marca, (string) ($cuenta + 1));
responder(true);
