<?php
/*
Plugin Name: Mapa Interactivo
Description: Plugin para añadir y mostrar marcadores en Google Maps con categorías, colores personalizados y filtrado avanzado para compra, alquiler y compartir piso.
Version: 2.1
Author: Tu Nombre
*/

// INCLUYE EL NUEVO SHORTCODE DE "MIS ANUNCIOS YCATEGORIAS"
require_once plugin_dir_path(__FILE__) . 'includes/shortcode-mis-anuncios.php';
require_once plugin_dir_path(__FILE__) . 'includes/shortcode-anuncios-categoria.php';

// =============== FUNCIONES GLOBALES ===============
if (!function_exists('jbgl_normaliza_slug_provincia')) {
    function jbgl_normaliza_slug_provincia($nombre) {
        $slug = strtolower(trim($nombre));
        $slug = str_replace(['á','é','í','ó','ú','ü','ñ','ç'], ['a','e','i','o','u','u','n','c'], $slug);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        return $slug;
    }
}
if (!function_exists('slugify')) {
    function slugify($text) {
        $text = strtolower($text);
        $text = preg_replace('/[áàäâ]/u', 'a', $text);
        $text = preg_replace('/[éèëê]/u', 'e', $text);
        $text = preg_replace('/[íìïî]/u', 'i', $text);
        $text = preg_replace('/[óòöô]/u', 'o', $text);
        $text = preg_replace('/[úùüû]/u', 'u', $text);
        $text = preg_replace('/[ñ]/u', 'n', $text);
        $text = preg_replace('/[^a-z0-9]+/', '-', $text);
        $text = trim($text, '-');
        return $text;
    }
}
if (!function_exists('iconoMarcadorPorCategoriaPHP')) {
    function iconoMarcadorPorCategoriaPHP($cat) {
        if (!$cat) return "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        $cat = strtolower(trim($cat));
        if (strpos($cat, "alquilar plaza de garaje") !== false) {
            return "https://maps.google.com/mapfiles/ms/icons/orange-dot.png";
        }
        if (strpos($cat, "comprar plaza de garaje") !== false) {
            return "https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png";
        }
        if (strpos($cat, "comprar") !== false) {
            return "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
        }
        if (strpos($cat, "habitacion") !== false) {
            return "https://maps.google.com/mapfiles/ms/icons/purple-dot.png";
        }
        if (strpos($cat, "compartir") !== false) {
            return "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
        }
        if (strpos($cat, "vivienda") !== false) {
            return "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
        }
        return "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
    }
}
// =============== CREAR TABLA DE FAVORITOS AL ACTIVAR ===============
register_activation_hook(__FILE__, function() {
    global $wpdb;
    $table_name = $wpdb->prefix . "marcadores_favoritos";
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        marcador_id BIGINT NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY (user_id, marcador_id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
});

// =============== ADMIN ===============
add_action('admin_menu', function () {
    add_options_page('Mapa Interactivo', 'Mapa Interactivo', 'manage_options', 'mapa-interactivo', 'mapa_interactivo_config_page');
});

function mapa_interactivo_config_page() { ?>
    <div class="wrap">
        <h2>Mapa Interactivo</h2>
        <form method="post" action="options.php">
            <?php
            settings_fields('mapa_interactivo_opciones');
            do_settings_sections('mapa_interactivo');
            submit_button();
            ?>
        </form>
    </div>
<?php }

add_action('admin_init', function () {
    register_setting('mapa_interactivo_opciones', 'mapa_interactivo_apikey');
    add_settings_section('sec', 'Configuración API', null, 'mapa_interactivo');
    add_settings_field(
        'campo_apikey', 'Google Maps API Key', 'campo_apikey_cb',
        'mapa_interactivo', 'sec'
    );
});

function campo_apikey_cb() {
    echo "<input type='text' name='mapa_interactivo_apikey'
           value='" . esc_attr(get_option('mapa_interactivo_apikey')) . "'
           style='width:400px;'>";
}

// =============== SHORTCODE FRONT ===============
add_shortcode('mapa_interactivo', 'mostrar_mapa_shortcode');

function mostrar_mapa_shortcode($atts = []) {
    $atts = shortcode_atts([
        'provincia' => '',
    ], $atts);
    if (file_exists(__DIR__ . '/contenido_provincias.php')) {
        require_once __DIR__ . '/contenido_provincias.php';
    } else {
        $provincias_seo = [];
    }

    wp_enqueue_script('mapa-js', plugin_dir_url(__FILE__) . 'js/mapa.js', [], '1.3', true);
    wp_enqueue_style('mapa-css', plugin_dir_url(__FILE__) . 'css/mapa.css', [], null);

    if ($k = esc_attr(get_option('mapa_interactivo_apikey'))) {
        wp_enqueue_script('google-maps',
            "https://maps.googleapis.com/maps/api/js?key=$k&libraries=places,geometry&callback=initMap",
            [], null, true);
    }

    $is_provincia = false;
    $provincia_slug = '';
    $request_uri = $_SERVER['REQUEST_URI'];
    if (preg_match('#/provincias?/([^/?&]+)/?#', $request_uri, $matches)) {
        $provincia_slug = jbgl_normaliza_slug_provincia($matches[1]);
        if ($provincia_slug) {
            $is_provincia = true;
        }
    }

    wp_localize_script('mapa-js', 'mapa_ajax_obj', [
        'ajaxurl'          => admin_url('admin-ajax.php'),
        'usuario_logueado' => is_user_logged_in() ? '1' : '0',
        'user_id'          => get_current_user_id(),
        'is_admin'         => current_user_can('manage_options') ? '1' : '0',
        'siteurl'          => site_url(),
        'provincia'        => $provincia_slug,
        'modo'             => (is_front_page() || is_home()) ? 'estatico' : 'normal',
        'login_url'        => site_url('/login'),
    ]);

    ob_start();
    if ($is_provincia && isset($provincias_seo[$provincia_slug])) {
        echo '<div class="texto-seo-provincia">';
        echo "<h1>{$provincias_seo[$provincia_slug]['h1']}</h1>";
        echo $provincias_seo[$provincia_slug]['content'];
        echo '</div>';
    } elseif ($is_provincia) {
        foreach ($provincias_seo as $k => $v) {
            if ($provincia_slug == jbgl_normaliza_slug_provincia($k)) {
                echo '<div class="texto-seo-provincia">';
                echo "<h1>{$v['h1']}</h1>";
                echo $v['content'];
                echo '</div>';
                break;
            }
        }
    }
    ?>
    <div class="bloque-central">

        <?php if (!$is_provincia): ?>
            <div class="pd-cta-top" style="margin-top: 20px;">
              ¿Buscas vivienda o plaza de garaje? <b>¡Anúnciate gratis y deja que propietarios e inmobiliarias te encuentren!</b>
              Recibe ofertas en la zona que deseas y elige la mejor opción para ti.
            </div>
<div id="categoria-botones" style="text-align:center;margin-bottom:10px;">
    <button class="categoria-btn" data-categoria="">Todas</button>
    <a class="categoria-btn" href="/desean-alquilar-habitacion/">Desean compartir piso</a>
    <a class="categoria-btn" href="/desean-alquilar-vivienda/">Desean alquilar vivienda</a>
    <a class="categoria-btn" href="/desean-comprar-vivienda/">Desean comprar vivienda</a>
    <a class="categoria-btn" href="/desean-alquilar-plaza-de-garaje/">Desean alquilar plaza de garaje</a>
    <a class="categoria-btn" href="/desean-comprar-plaza-de-garaje/">Desean comprar plaza de garaje</a>
</div>
<div class="buscador-mapa-filtros" style="margin-bottom:10px;">
    <input id="map-search" type="text" placeholder="Busca una dirección o lugar..." style="width:60%;padding:8px;border-radius:4px;border:1px solid #ccc;">
    <select id="map-category" style="width:35%;padding:8px;border-radius:4px;border:1px solid #ccc;margin-left:5px;">
        <option value="">Todas las categorías</option>
        <option value="Desean alquilar habitacion">Desean compartir piso</option>
        <option value="Desean alquilar vivienda">Desean alquilar vivienda</option>
        <option value="Desean comprar vivienda">Desean comprar vivienda</option>
        <option value="Desean alquilar plaza de garaje">Desean alquilar plaza de garaje</option>
        <option value="Desean comprar plaza de garaje">Desean comprar plaza de garaje</option>
    </select>
</div>
        <?php endif; ?>

        <div class="mapa-interactivo-wrapper">
            <div id="mapa-interactivo" style="height:500px;margin-bottom:10px;"></div>
        </div>
<?php if ($is_provincia): ?>
<div class="mapa-instrucciones-usuario">
  <div class="mapa-instrucciones-titulo">
    📝 ¡Publica tu anuncio en solo 3 pasos!
  </div>
  <ol class="mapa-instrucciones-lista">
    <li>
      <b>Haz clic en el mapa</b>
      Amplía el mapa para marcar 
      <img src="https://maps.google.com/mapfiles/ms/icons/yellow-dot.png" alt="Marcador" style="width:20px;vertical-align:middle;margin-bottom:2px;">
      la localización exacta donde buscas vivienda o plaza de garaje.
    </li>
    <li>
      <b>Rellena el formulario</b> 📝 con tus preferencias y detalles.<br>
      <div class="pd-form-group" style="margin-top:8px;">
        <label for="categoria-selector" style="font-weight:500;">Formulario: 🗂️</label>
        <select id="categoria-selector" class="pd-input" name="categoria" style="margin-top:3px;">
          <option value="">Elige tu categoría</option>
          <option value="Desean alquilar habitacion">Busco vivienda (compartir)</option>
          <option value="Desean alquilar vivienda">Busco vivienda (alquiler)</option>
          <option value="Desean comprar vivienda">Busco vivienda (compra)</option>
          <option value="Desean alquilar plaza de garaje">Busco plaza de garaje (alquiler)</option>
          <option value="Desean comprar plaza de garaje">Busco plaza de garaje (compra)</option>
        </select>
      </div>
    </li>
    <li>
      <b>Pulsa en "Publicar mi anuncio"</b> … ¡y listo! Tu publicación aparecerá al instante.
      <div class="aplausos-centrados">👏👏👏👏👏</div>
    </li>
  </ol>
  <div class="mapa-instrucciones-tip">
    💡 <i>Consejo:</i> Cuantos más detalles añadas, más personas podrán encontrarte.
  </div>
</div>
<form id="formulario-marcador" class="pd-form-marcador">
  <div id="contenedor-titulo" style="margin-bottom:15px;display:none;">
    <h2>
      Publica tu anuncio en <?php echo ucwords(str_replace('-', ' ', $provincia_slug)); ?>
    </h2>
  </div>
  <div id="resto-formulario" style="display:none;">
    <div class="pd-form-group" id="titulo-group" style="display:none;">
      <label for="titulo-input" class="pd-label">Título <span style="font-size:0.93em; color:#888;">(máx. 40 caracteres)</span></label>
      <input type="text" id="titulo-input" class="pd-input" name="titulo" maxlength="40" required>
    </div>
    <div class="pd-form-group" id="comentarios-group" style="display:none;">
      <label for="comentario-input" class="pd-label">Detalles y preferencias</label>
      <textarea id="comentario-input" class="pd-input" name="comentario" rows="2"></textarea>
    </div>
    <div id="filtro-compra" style="display:none;">
      <div class="pd-form-group">
        <label for="precio_compra" class="pd-label">Precio máx. (€)</label>
        <input type="number" id="precio_compra" class="pd-input" name="precio_compra" min="0">
      </div>
      <div class="pd-form-group">
        <label for="metros_compra" class="pd-label">Metros mínimos</label>
        <input type="number" id="metros_compra" class="pd-input" name="metros_compra" min="0">
      </div>
      <div class="pd-form-group">
        <label for="dormitorios_compra" class="pd-label">Dormitorios</label>
        <input type="number" id="dormitorios_compra" class="pd-input" name="dormitorios_compra" min="0">
      </div>
      <div class="pd-form-group">
        <label for="banos_compra" class="pd-label">Baños</label>
        <input type="number" id="banos_compra" class="pd-input" name="banos_compra" min="0">
      </div>
    </div>
    <div id="filtro-alquiler" style="display:none;">
      <div class="pd-form-group">
        <label for="precio_alquiler" class="pd-label">Precio máx. (€)</label>
        <input type="number" id="precio_alquiler" class="pd-input" name="precio_alquiler" min="0">
      </div>
      <div class="pd-form-group">
        <label for="metros_alquiler" class="pd-label">Metros mínimos</label>
        <input type="number" id="metros_alquiler" class="pd-input" name="metros_alquiler" min="0">
      </div>
      <div class="pd-form-group">
        <label for="dormitorios_alquiler" class="pd-label">Dormitorios</label>
        <input type="number" id="dormitorios_alquiler" class="pd-input" name="dormitorios_alquiler" min="0">
      </div>
      <div class="pd-form-group">
        <label for="banos_alquiler" class="pd-label">Baños</label>
        <input type="number" id="banos_alquiler" class="pd-input" name="banos_alquiler" min="0">
      </div>
      <div class="pd-form-group">
        <label for="expectativas" class="pd-label">Expectativas</label>
        <select id="expectativas" class="pd-input" name="expectativas">
          <option value="">Selecciona una opción</option>
          <option value="corta">Corta estancia (hasta 6 meses)</option>
          <option value="media">Media estancia (6-12 meses)</option>
          <option value="larga">Larga estancia (más de 1 año)</option>
        </select>
      </div>
    </div>
    <div id="filtro-compartir" style="display:none;">
      <div class="pd-form-group">
        <label for="precio_alquiler_habitacion" class="pd-label">Precio máx. (€)</label>
        <input type="number" id="precio_alquiler_habitacion" class="pd-input" name="precio_alquiler_habitacion" min="0">
      </div>
      <div class="pd-form-group">
        <label for="expectativas" class="pd-label">Expectativas</label>
        <select id="expectativas" class="pd-input" name="expectativas">
          <option value="">Selecciona una opción</option>
          <option value="corta">Corta estancia (hasta 6 meses)</option>
          <option value="media">Media estancia (6-12 meses)</option>
          <option value="larga">Larga estancia (más de 1 año)</option>
        </select>
      </div>
    </div>
    <div id="filtro-garaje" style="display:none;">
      <div class="pd-form-group">
        <label for="precio_garaje" class="pd-label">Precio máx. (€)</label>
        <input type="number" id="precio_garaje" class="pd-input" name="precio_garaje" min="0">
      </div>
    </div>
    <div class="pd-form-group" style="text-align:center;margin-top:20px;">
      <button type="button" id="guardar-marcador-btn" class="pd-btn-primary">Publicar mi anuncio</button>
    </div>
  </div>
</form>
<script>
document.addEventListener('DOMContentLoaded', function() {
  var categoria = document.getElementById('categoria-selector');
  var resto = document.getElementById('resto-formulario');
  var titulo = document.getElementById('contenedor-titulo');
  var isLogged = <?php echo is_user_logged_in() ? 'true' : 'false'; ?>;
  var loginUrl = '<?php echo site_url('/login'); ?>';

  categoria.addEventListener('change', function() {
    if (categoria.value) {
      if (!isLogged) {
        localStorage.setItem('categoriaElegida', categoria.value);
        window.location.href = loginUrl;
        return;
      }
      resto.style.display = '';
      titulo.style.display = '';
    } else {
      resto.style.display = 'none';
      titulo.style.display = 'none';
    }
  });

  if (isLogged) {
    var catGuardada = localStorage.getItem('categoriaElegida');
    if (catGuardada) {
      categoria.value = catGuardada;
      resto.style.display = '';
      titulo.style.display = '';
      localStorage.removeItem('categoriaElegida');
    } else if (categoria.value) {
      resto.style.display = '';
      titulo.style.display = '';
    }
  }
});
</script>
<?php endif; ?>
        <?php if (!$is_provincia): ?>
            <div class="pd-cta-bloque-anuncio">
                <div class="pd-cta-bloque-anuncio-top">
                    ¿Cansado de buscar vivienda?
                </div>
                <button id="mostrar-formulario-btn" class="pd-btn-primary pd-btn-anuncio-azul-contorno destello-azul">
                    <span class="pd-btn-icon">★</span>
                    Publicar anuncio
                </button>
                <div class="pd-cta-bloque-anuncio-bottom">
                    ¡Dale la vuelta y deja que te encuentren!
                </div>
            </div>
        <?php endif; ?>

        <div id="modal-editar-marcador" class="pd-modal" style="display:none;">
          <div class="pd-modal-content">
            <span class="pd-modal-close" id="cerrar-modal-editar">&times;</span>
            <h2>Editar marcador</h2>
            <form id="form-editar-marcador">
              <label for="editar-comentario" class="pd-label">Comentario</label>
              <textarea id="editar-comentario" class="pd-input" rows="3"></textarea>
              <input type="hidden" id="editar-id-marcador">
              <div style="text-align:right;margin-top:15px;">
                <button type="submit" class="pd-btn-primary">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
        <div id="mini-anuncios-provincia"></div>
        <div id="marcadores-provincia-lista"></div>
        <?php if (is_front_page() || is_home()) : ?>
            <div id="ultimos-marcadores-seo" style="margin:35px 0 15px 0;">
              <h3>Últimos anuncios</h3>
              <div id="ultimos-marcadores"></div>
            </div>
        <?php endif; ?>

    </div>
    <?php
    return ob_get_clean();
}
// =============== AJAX BACKEND ===============

// GUARDAR MARCADOR
function guardar_marcador_callback() {
    if ( ! is_user_logged_in() ) wp_send_json_error();
    global $wpdb;
    $t = $wpdb->prefix . "marcadores";
    $user_id = get_current_user_id();
    $total_marcadores = $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM $t WHERE user_id = %d", $user_id
    ));
    if ($total_marcadores >= 5) {
        wp_send_json_error([
            'msg' => 'Has superado tu límite de marcadores. Elimina alguno para poder añadir uno nuevo.'
        ]);
    }

    // Validar título
    $titulo = isset($_POST['titulo']) ? trim(sanitize_text_field($_POST['titulo'])) : '';
    if (empty($titulo)) {
        wp_send_json_error(['msg' => 'El campo Título es obligatorio.']);
    }

    $data = [
        'lat'       => floatval( $_POST['lat'] ),
        'lng'       => floatval( $_POST['lng'] ),
        'titulo'    => $titulo,
        'comentario'=> sanitize_text_field( $_POST['comentario'] ?? '' ),
        'categoria' => sanitize_text_field( $_POST['categoria'] ?? '' ),
        'user_id'   => $user_id,
        'provincia' => sanitize_text_field( $_POST['provincia'] ?? '' ),
    ];

   if ( $data['categoria'] === "Desean comprar vivienda" ) {
    $data['precio_compra'] = intval($_POST['precio_compra'] ?? 0);
    $data['metros_compra'] = intval($_POST['metros_compra'] ?? 0);
    $data['dormitorios_compra'] = intval($_POST['dormitorios_compra'] ?? 0);
    $data['banos_compra'] = intval($_POST['banos_compra'] ?? 0);
}
if (
    $data['categoria'] === "Desean alquilar habitacion" ||
    $data['categoria'] === "Desean alquilar vivienda"
) {
    if ($data['categoria'] === "Desean alquilar habitacion") {
        $data['precio_alquiler_habitacion'] = intval($_POST['precio_alquiler_habitacion'] ?? 0);
        $data['metros_alquiler_habitacion'] = intval($_POST['metros_alquiler_habitacion'] ?? 0);
        $data['mascotas'] = intval($_POST['mascotas'] ?? -1);
        $data['fumador'] = intval($_POST['fumador'] ?? -1);
        $data['edad'] = intval($_POST['edad'] ?? 0);
        $data['trabajo'] = intval($_POST['trabajo'] ?? -1);
        $data['pareja'] = intval($_POST['pareja'] ?? -1);
        $data['contrato_alquiler'] = intval($_POST['contrato_alquiler'] ?? -1);
    }
    if ($data['categoria'] === "Desean alquilar vivienda") {
        $data['precio_alquiler'] = intval($_POST['precio_alquiler'] ?? 0);
        $data['metros_alquiler'] = intval($_POST['metros_alquiler'] ?? 0);
        $data['dormitorios_alquiler'] = intval($_POST['dormitorios_alquiler'] ?? 0);
        $data['banos_alquiler'] = intval($_POST['banos_alquiler'] ?? 0);
    }
    $data['expectativas'] = sanitize_text_field($_POST['expectativas'] ?? '');
}
// Guardar precio_garaje para las categorías de garaje
if (
    $data['categoria'] === "Desean alquilar plaza de garaje" ||
    $data['categoria'] === "Desean comprar plaza de garaje"
) {
    $data['precio_garaje'] = intval($_POST['precio_garaje'] ?? 0);
}
$data['categoria_slug'] = slugify($data['categoria']);
$data['provincia_slug'] = slugify($data['provincia']);
$data['titulo_slug']    = slugify($data['titulo']);
if ( ! $wpdb->insert( $t, $data ) ) wp_send_json_error();
wp_send_json_success();
}
add_action( 'wp_ajax_guardar_marcador', 'guardar_marcador_callback' );

// OBTENER MARCADORES (por provincia y categoría si se pasan por GET)
function obtener_marcadores_callback() {
    global $wpdb;
    $t = $wpdb->prefix . "marcadores";
    $provincia = isset($_GET['provincia']) ? sanitize_text_field($_GET['provincia']) : '';
    $categoria = isset($_GET['categoria']) ? sanitize_text_field($_GET['categoria']) : '';

    // Construye el WHERE según filtros disponibles (usando los campos *_slug)
    $where = "1=1";
    $params = [];

    if ($provincia !== '') {
        $provincia_slug = slugify($provincia);
        $where .= " AND provincia_slug = %s";
        $params[] = $provincia_slug;
    }
    if ($categoria !== '') {
        $categoria_slug = slugify($categoria);
        $where .= " AND categoria_slug = %s";
        $params[] = $categoria_slug;
    }

    // Construye la consulta
    $query = "SELECT * FROM $t WHERE $where";
    if (!empty($params)) {
        $r = $wpdb->get_results($wpdb->prepare($query, ...$params), ARRAY_A);
    } else {
        $r = $wpdb->get_results("SELECT * FROM $t", ARRAY_A);
    }

    foreach ($r as &$row) {
        $user_id = $row['user_id'];
        $row['usuario'] = get_userdata( $user_id )->user_login ?? 'Anónimo';

        // Avatar Ultimate Member o WP (solo usar la imagen personalizada de UM si existe)
        if (function_exists('um_get_avatar_url')) {
            $avatar_um = um_get_avatar_url($user_id);
            // Solo usar si es una imagen en uploads/ultimatemember y contiene profile_photo
            if ($avatar_um && preg_match('/\/uploads\/ultimatemember\/.*profile_photo.*\.jpg/i', $avatar_um)) {
                $row['avatar_url'] = $avatar_um;
            } else {
                $row['avatar_url'] = get_avatar_url($user_id, ['size'=>100]);
            }
        } else {
            $row['avatar_url'] = get_avatar_url($user_id, ['size'=>100]);
        }

        if (is_user_logged_in() && $user_id != get_current_user_id()) {
            $texto_plano = "&#9993; Mensaje";
            $row['boton_mensaje'] = do_shortcode('[better_messages_pm_button user_id="' . esc_attr($user_id) . '" text="' . $texto_plano . '" class="detalle-marcador-btn-profile principal-btn" fast_start="1"]');
        } else {
            $row['boton_mensaje'] = '';
        }
    }
    wp_send_json($r);
}
add_action( 'wp_ajax_obtener_marcadores',        'obtener_marcadores_callback' );
add_action( 'wp_ajax_nopriv_obtener_marcadores', 'obtener_marcadores_callback' );

// ULTIMOS MARCADORES - DEVOLVER SIEMPRE ARRAY
function ultimos_marcadores_callback() {
    global $wpdb;
    $t = $wpdb->prefix . "marcadores";
    $r = $wpdb->get_results( "SELECT *, fecha FROM $t ORDER BY id DESC LIMIT 20", ARRAY_A );
    foreach ( $r as &$row ) {
        $user_id = $row['user_id'];
        $row['usuario'] = get_userdata( $user_id )->user_login ?? 'Anónimo';

        // Avatar Ultimate Member o WP (solo usar la imagen personalizada de UM si existe)
        if (function_exists('um_get_avatar_url')) {
            $avatar_um = um_get_avatar_url($user_id);
            if ($avatar_um && preg_match('/\/uploads\/ultimatemember\/.*profile_photo.*\.jpg/i', $avatar_um)) {
                $row['avatar_url'] = $avatar_um;
            } else {
                $row['avatar_url'] = get_avatar_url($user_id, ['size'=>100]);
            }
        } else {
            $row['avatar_url'] = get_avatar_url($user_id, ['size'=>100]);
        }
    }
    wp_send_json( $r );
}
add_action( 'wp_ajax_ultimos_marcadores',        'ultimos_marcadores_callback' );
add_action( 'wp_ajax_nopriv_ultimos_marcadores', 'ultimos_marcadores_callback' );
// ELIMINAR MARCADOR
function eliminar_marcador_callback() {
    if ( ! is_user_logged_in() ) wp_send_json_error();
    global $wpdb;
    $id = intval( $_POST['id'] );
    $marcador = $wpdb->get_row($wpdb->prepare("SELECT user_id FROM {$wpdb->prefix}marcadores WHERE id=%d", $id));
    if (
        !$marcador ||
        ($marcador->user_id != get_current_user_id() && !current_user_can('manage_options'))
    ) wp_send_json_error();
    $wpdb->delete( $wpdb->prefix . "marcadores", [ 'id' => $id ] )
        ? wp_send_json_success() : wp_send_json_error();
}
add_action( 'wp_ajax_eliminar_marcador', 'eliminar_marcador_callback' );

// EDITAR MARCADOR (actualizado: acepta TODOS los campos relevantes)
function editar_marcador_callback() {
    if ( ! is_user_logged_in() ) wp_send_json_error();
    global $wpdb;
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $marcador = $wpdb->get_row($wpdb->prepare("SELECT user_id FROM {$wpdb->prefix}marcadores WHERE id=%d", $id));
    if (
        !$marcador ||
        ($marcador->user_id != get_current_user_id() && !current_user_can('manage_options'))
    ) wp_send_json_error();

    $data = [];
   if (isset($_POST['lat']))     $data['lat'] = floatval($_POST['lat']);
if (isset($_POST['lng']))     $data['lng'] = floatval($_POST['lng']);
if (isset($_POST['titulo']))  $data['titulo'] = sanitize_text_field($_POST['titulo']);
if (isset($_POST['comentario']))     $data['comentario'] = sanitize_text_field($_POST['comentario']);
if (isset($_POST['categoria']))      $data['categoria'] = sanitize_text_field($_POST['categoria']);
if (isset($_POST['provincia']))      $data['provincia'] = sanitize_text_field($_POST['provincia']);

if (isset($_POST['precio_compra']))        $data['precio_compra'] = intval($_POST['precio_compra']);
if (isset($_POST['metros_compra']))        $data['metros_compra'] = intval($_POST['metros_compra']);
if (isset($_POST['dormitorios_compra']))   $data['dormitorios_compra'] = intval($_POST['dormitorios_compra']);
if (isset($_POST['banos_compra']))         $data['banos_compra'] = intval($_POST['banos_compra']);

if (isset($_POST['precio_alquiler']))      $data['precio_alquiler'] = intval($_POST['precio_alquiler']);
if (isset($_POST['metros_alquiler']))      $data['metros_alquiler'] = intval($_POST['metros_alquiler']);
if (isset($_POST['dormitorios_alquiler'])) $data['dormitorios_alquiler'] = intval($_POST['dormitorios_alquiler']);
if (isset($_POST['banos_alquiler']))       $data['banos_alquiler'] = intval($_POST['banos_alquiler']);

if (isset($_POST['precio_alquiler_habitacion'])) $data['precio_alquiler_habitacion'] = intval($_POST['precio_alquiler_habitacion']);
if (isset($_POST['metros_alquiler_habitacion'])) $data['metros_alquiler_habitacion'] = intval($_POST['metros_alquiler_habitacion']);

if (isset($_POST['precio_garaje'])) $data['precio_garaje'] = intval($_POST['precio_garaje']);

if (isset($_POST['mascotas']))               $data['mascotas'] = intval($_POST['mascotas']);
if (isset($_POST['fumador']))                $data['fumador'] = intval($_POST['fumador']);
if (isset($_POST['edad']))                   $data['edad'] = intval($_POST['edad']);
if (isset($_POST['trabajo']))                $data['trabajo'] = intval($_POST['trabajo']);
if (isset($_POST['pareja']))                 $data['pareja'] = intval($_POST['pareja']);
if (isset($_POST['contrato_alquiler']))      $data['contrato_alquiler'] = intval($_POST['contrato_alquiler']);
if (isset($_POST['expectativas']))           $data['expectativas'] = sanitize_text_field($_POST['expectativas']);

if (empty($data)) wp_send_json_error(['msg' => 'No hay datos para actualizar']);
if (isset($data['categoria'])) {
    $data['categoria_slug'] = slugify($data['categoria']);
}
if (isset($data['provincia'])) {
    $data['provincia_slug'] = slugify($data['provincia']);
}
if (isset($data['titulo'])) {
    $data['titulo_slug'] = slugify($data['titulo']);
}

$wpdb->update($wpdb->prefix . "marcadores", $data, [ 'id' => $id ]);
wp_send_json_success();
}
add_action( 'wp_ajax_editar_marcador', 'editar_marcador_callback' );

// MIS MARCADORES (usuario o admin ve todos)
function obtener_mis_marcadores_callback() {
    global $wpdb;
    $t = $wpdb->prefix . "marcadores";
    $user_id = get_current_user_id();
    if (current_user_can('manage_options')) {
        $r = $wpdb->get_results( "SELECT * FROM $t ORDER BY id DESC LIMIT 100", ARRAY_A );
    } else {
        $r = $wpdb->get_results( $wpdb->prepare("SELECT * FROM $t WHERE user_id = %d ORDER BY id DESC", $user_id), ARRAY_A );
    }
    foreach ($r as &$row) {
        $row['usuario'] = get_userdata( $row['user_id'] )->user_login ?? 'Anónimo';

        // Avatar Ultimate Member o WP (solo usar la imagen personalizada de UM si existe)
        if (function_exists('um_get_avatar_url')) {
            $avatar_um = um_get_avatar_url($row['user_id']);
            if ($avatar_um && preg_match('/\/uploads\/ultimatemember\/.*profile_photo.*\.jpg/i', $avatar_um)) {
                $row['avatar_url'] = $avatar_um;
            } else {
                $row['avatar_url'] = get_avatar_url($row['user_id'], ['size'=>100]);
            }
        } else {
            $row['avatar_url'] = get_avatar_url($row['user_id'], ['size'=>100]);
        }

        $row['es_propio'] = ($row['user_id'] == $user_id) ? 1 : 0;
    }
    wp_send_json($r);
}
add_action('wp_ajax_obtener_mis_marcadores', 'obtener_mis_marcadores_callback');

// =============== BORRADO DE MARCADORES AL ELIMINAR USUARIO ===============
add_action('delete_user', function($user_id) {
    global $wpdb;
    $t = $wpdb->prefix . "marcadores";
    $wpdb->delete($t, ['user_id' => $user_id]);
});
// ====== FAVORITOS: MARCAR, DESMARCAR Y OBTENER ======
add_action('wp_ajax_marcar_favorito', 'marcar_favorito_callback');
add_action('wp_ajax_desmarcar_favorito', 'desmarcar_favorito_callback');
add_action('wp_ajax_obtener_favoritos', 'obtener_favoritos_callback');

function marcar_favorito_callback() {
    if (!is_user_logged_in()) wp_send_json_error();
    global $wpdb;
    $user_id = get_current_user_id();
    $marcador_id = intval($_POST['marcador_id']);
    $table = $wpdb->prefix . 'marcadores_favoritos';
    $wpdb->replace($table, [
        'user_id' => $user_id,
        'marcador_id' => $marcador_id,
        'fecha' => current_time('mysql')
    ]);
    wp_send_json_success();
}

function desmarcar_favorito_callback() {
    if (!is_user_logged_in()) wp_send_json_error();
    global $wpdb;
    $user_id = get_current_user_id();
    $marcador_id = intval($_POST['marcador_id']);
    $table = $wpdb->prefix . 'marcadores_favoritos';
    $wpdb->delete($table, [
        'user_id' => $user_id,
        'marcador_id' => $marcador_id
    ]);
    wp_send_json_success();
}

function obtener_favoritos_callback() {
    if (!is_user_logged_in()) wp_send_json([]);
    global $wpdb;
    $user_id = get_current_user_id();
    $table = $wpdb->prefix . 'marcadores_favoritos';
    $favoritos = $wpdb->get_col($wpdb->prepare("SELECT marcador_id FROM $table WHERE user_id = %d", $user_id));
    wp_send_json($favoritos);
}

// ========== SHORTCODE: MIS FAVORITOS (ESTILO MINI-ANUNCIO, con eliminación desde la página) ==========
add_shortcode('mis_favoritos', function() {
    // Forzar carga del CSS y los JS necesarios
    wp_enqueue_style('mapa-css', plugin_dir_url(__FILE__) . 'css/mapa.css', [], null);
    wp_enqueue_script('mapa-js', plugin_dir_url(__FILE__) . 'js/mapa.js', [], null, true);
    wp_enqueue_script('mapa-favoritos-extra', plugin_dir_url(__FILE__) . 'js/mapa-favoritos-extra.js', [], null, true);

    // ¡ATENCIÓN! Localiza siempre la variable JS para evitar errores:
    wp_localize_script('mapa-js', 'mapa_ajax_obj', [
        'ajaxurl'          => admin_url('admin-ajax.php'),
        'usuario_logueado' => is_user_logged_in() ? '1' : '0',
        'user_id'          => get_current_user_id(),
        'is_admin'         => current_user_can('manage_options') ? '1' : '0',
        'siteurl'          => site_url(),
        'provincia'        => '',
        'modo'             => '',
        'login_url'        => site_url('/login'),
    ]);

    if (!is_user_logged_in()) return '<p>Debes iniciar sesión para ver tus favoritos.</p>';
    global $wpdb;
    $user_id = get_current_user_id();
    $table_favs = $wpdb->prefix . 'marcadores_favoritos';
    $table_marks = $wpdb->prefix . 'marcadores';
    $ids = $wpdb->get_col($wpdb->prepare("SELECT marcador_id FROM $table_favs WHERE user_id = %d", $user_id));
    if (empty($ids)) return '<p>No tienes anuncios favoritos.</p>';
    $placeholders = implode(',', array_fill(0, count($ids), '%d'));
    $anuncios = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM $table_marks WHERE id IN ($placeholders)", $ids
    ));

    ob_start();
    echo '<div class="mini-anuncios-provincia-milanuncios">';
    echo '<div class="mini-anuncios-provincia-title"><span>❤️</span> Mis favoritos</div>';
    echo '<div class="mini-anuncios-cards">';
    foreach ($anuncios as $m) {
        $avatar_url = 'https://postaldream.com/wp-content/uploads/2025/06/postaldrem_avatar.jpg';

        // URL amigable o fallback
        if (!empty($m->categoria_slug) && !empty($m->provincia_slug) && !empty($m->titulo_slug)) {
            $url = '/' . $m->categoria_slug . '/' . $m->provincia_slug . '/' . $m->titulo_slug . '/';
        } else {
            $url = '/detalle-de-marcador/?id=' . $m->id;
        }

        // DETALLES
        $detalles = [];
        if (!empty($m->dormitorios_alquiler) || !empty($m->dormitorios_compra))
            $detalles[] = '<span>🛏️ '.($m->dormitorios_alquiler ?: $m->dormitorios_compra).'</span>';
        if (!empty($m->banos_alquiler) || !empty($m->banos_compra))
            $detalles[] = '<span>🛁 '.($m->banos_alquiler ?: $m->banos_compra).'</span>';
        if (!empty($m->metros_alquiler) || !empty($m->metros_compra) || !empty($m->metros_alquiler_habitacion))
            $detalles[] = '<span>📏 '.($m->metros_alquiler ?: $m->metros_compra ?: $m->metros_alquiler_habitacion).' m²</span>';

        // COMENTARIO
       $comentario = !empty($m->comentario)
    ? esc_html(mb_substr($m->comentario, 0, 80)).(mb_strlen($m->comentario) > 80 ? "..." : "")
    : esc_html($m->categoria ?: "");

$url_provincia = '/provincias/' . $m->provincia_slug . '/?focus=' . $m->id;

echo '<div class="mini-anuncio-card">';
echo '<span class="corazon-favorito activo" data-id="'.esc_attr($m->id).'" title="Quitar de favoritos">♥</span>';
echo '<div style="display:flex;flex-direction:column;align-items:center;gap:7px;">';
echo '<img src="'.esc_url($avatar_url).'" alt="Avatar" class="mini-anuncio-avatar">';
// --- PIN COMO ENLACE AL MAPA ---
echo '<a href="' . esc_url($url_provincia) . '" class="emoji-marcador" title="Ver marcador en el mapa">';
echo '<img src="'.esc_url(iconoMarcadorPorCategoriaPHP($m->categoria)).'" alt="Ir a marcador" class="google-pin-icon">';
echo '</a>';
echo '<div style="width:100%">';
if (!empty($m->titulo)) {
    // Ahora el título es el enlace al detalle del anuncio
    echo '<div class="mini-anuncio-titulo" style="font-size:1.07em;font-weight:600;margin-bottom:2px">'
       . '<a href="' . esc_url($url) . '" style="color:inherit;text-decoration:none;">'
       . esc_html($m->titulo)
       . '</a></div>';
}
// Precio
$precio = '';
if (!empty($m->precio_alquiler) && intval($m->precio_alquiler) > 0) {
    $precio = number_format($m->precio_alquiler, 0, ',', '.').' €';
} elseif (!empty($m->precio_compra) && intval($m->precio_compra) > 0) {
    $precio = number_format($m->precio_compra, 0, ',', '.').' €';
} elseif (!empty($m->precio_alquiler_habitacion) && intval($m->precio_alquiler_habitacion) > 0) {
    $precio = number_format($m->precio_alquiler_habitacion, 0, ',', '.').' €';
} elseif (!empty($m->precio_garaje) && intval($m->precio_garaje) > 0) {
    $precio = number_format($m->precio_garaje, 0, ',', '.').' €';
}
if ($precio) {
    echo '<div class="mini-anuncio-precio">'.esc_html($precio).'</div>';
}

echo '<div class="mini-anuncio-ciudad">'.esc_html($m->provincia ?: "").'</div>';

// --- Detalles: solo texto, usa esc_html. Si incluye HTML (iconos), NO escapes aquí. ---
// echo '<div class="mini-anuncio-detalles">'.esc_html(implode(" ", $detalles)).'</div>';
echo '<div class="mini-anuncio-detalles">'.implode(" ", $detalles).'</div>';

echo '<div class="mini-anuncio-comentario">'.esc_html($comentario).'</div>';
echo '</div></div></div>'; // cerrando los divs abiertos
    }
    echo '</div>'; // mini-anuncios-cards
    echo '</div>'; // mini-anuncios-provincia-milanuncios
    return ob_get_clean();
});
// ========== URL AMIGABLE BÚSQUEDA Y PLANTILLA ==========

// 1. Regla de reescritura
add_action('init', function() {
    add_rewrite_rule(
        '^buscar/([^/]+)/?',
        'index.php?search_term=$matches[1]',
        'top'
    );
});

// 2. Query var personalizada
add_filter('query_vars', function($vars) {
    $vars[] = 'search_term';
    return $vars;
});

// 3. Plantilla personalizada para búsqueda
add_filter('template_include', function($template) {
    $search_term = get_query_var('search_term');
    if ($search_term) {
        return plugin_dir_path(__FILE__).'templates/search-results.php';
    }
    return $template;
});
// ========== FIN DEL PLUGIN ==========