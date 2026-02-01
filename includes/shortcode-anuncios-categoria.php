<?php
add_shortcode('anuncios_categoria', 'mostrar_anuncios_por_categoria_shortcode');

if (!function_exists('iconoMarcadorPorCategoria')) {
    function iconoMarcadorPorCategoria($cat) {
        $cat = strtolower($cat);
        if (strpos($cat, "comprar") !== false) return "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
        if (strpos($cat, "habitacion") !== false) return "https://maps.google.com/mapfiles/ms/icons/purple-dot.png";
        if (strpos($cat, "compartir") !== false) return "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
        if (strpos($cat, "vivienda") !== false) return "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
        return "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
    }
}

add_shortcode('anuncios_categoria', 'mostrar_anuncios_por_categoria_shortcode');
function mostrar_anuncios_por_categoria_shortcode($atts = []) {
    global $wpdb;
    $atts = shortcode_atts([
        'categoria' => '',
    ], $atts);

    // --- OBTENER FAVORITOS DEL USUARIO ---
    $favoritos = [];
    if (is_user_logged_in()) {
        $user_id = get_current_user_id();
        $tabla_fav = $wpdb->prefix . "marcadores_favoritos";
        $favoritos = $wpdb->get_col($wpdb->prepare(
            "SELECT marcador_id FROM $tabla_fav WHERE user_id = %d", $user_id
        ));
    }

    $tabla = $wpdb->prefix . "marcadores";

    ob_start();

    echo '<div class="mini-anuncios-provincia-milanuncios">';
    echo '<div class="mini-anuncios-provincia-title"><span>📍</span> Últimos anuncios</div>';
    echo '<div class="mini-anuncios-cards">';
    // --- CONSULTA ANUNCIOS ---
    $where = [];
    $params = [];
    if (!empty($atts['categoria'])) {
        $where[] = 'categoria_slug = %s';
        $params[] = slugify($atts['categoria']);
    }
    $where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $sql = "SELECT * FROM $tabla $where_sql ORDER BY id DESC LIMIT 40";
    $anuncios = $params ? $wpdb->get_results($wpdb->prepare($sql, ...$params)) : $wpdb->get_results($sql);

    if (empty($anuncios)) {
        echo "<p>No hay anuncios disponibles.</p>";
    } else {
        foreach ($anuncios as $anuncio) {
            // --- AVATAR ---
            $avatar_url = '';
            if (function_exists('um_get_avatar_url')) {
                $avatar_um = um_get_avatar_url($anuncio->user_id);
                if ($avatar_um && preg_match('/\/uploads\/ultimatemember\/.*profile_photo.*\.jpg/i', $avatar_um)) {
                    $avatar_url = $avatar_um;
                } else {
                    $avatar_url = get_avatar_url($anuncio->user_id, ['size'=>80]);
                }
            } else {
                $avatar_url = get_avatar_url($anuncio->user_id, ['size'=>80]);
            }
            if (!$avatar_url) {
                $avatar_url = 'https://postaldream.com/wp-content/uploads/2025/06/postaldrem_avatar.jpg';
            }

            // --- FAVORITO ---
            $es_favorito = in_array($anuncio->id, $favoritos);

            // --- URL DETALLE ---
            if ($anuncio->categoria_slug && $anuncio->provincia_slug && $anuncio->titulo_slug) {
                $detalle_url = site_url('/' . $anuncio->categoria_slug . '/' . $anuncio->provincia_slug . '/' . $anuncio->titulo_slug . '/');
            } else {
                $detalle_url = site_url('/detalle-de-marcador/?id=' . $anuncio->id);
            }

            $pin_icon = iconoMarcadorPorCategoria($anuncio->categoria);

            // --- DETALLES RÁPIDOS ---
            $detalles = [];
            if (!empty($anuncio->dormitorios_alquiler)) $detalles[] = '<span>🛏️ ' . intval($anuncio->dormitorios_alquiler) . '</span>';
            elseif (!empty($anuncio->dormitorios_compra)) $detalles[] = '<span>🛏️ ' . intval($anuncio->dormitorios_compra) . '</span>';
            if (!empty($anuncio->banos_alquiler)) $detalles[] = '<span>🛁 ' . intval($anuncio->banos_alquiler) . '</span>';
            elseif (!empty($anuncio->banos_compra)) $detalles[] = '<span>🛁 ' . intval($anuncio->banos_compra) . '</span>';
            if (!empty($anuncio->metros_alquiler)) $detalles[] = '<span>📏 ' . intval($anuncio->metros_alquiler) . ' m²</span>';
            elseif (!empty($anuncio->metros_compra)) $detalles[] = '<span>📏 ' . intval($anuncio->metros_compra) . ' m²</span>';
            elseif (!empty($anuncio->metros_alquiler_habitacion)) $detalles[] = '<span>📏 ' . intval($anuncio->metros_alquiler_habitacion) . ' m²</span>';

            echo '<div class="mini-anuncio-card">';
            echo '<div style="display:flex;flex-direction:column;align-items:center;gap:7px;">';
            echo '<img src="' . esc_url($avatar_url) . '" alt="Avatar" class="mini-anuncio-avatar">';
            echo '<button type="button" class="corazon-favorito ' . ($es_favorito ? 'activo' : '') . '" data-id="' . intval($anuncio->id) . '">' . ($es_favorito ? '❤' : '♡') . '</button>';
            echo '<button type="button" class="ir-a-mapa-btn" style="background:none;border:none;padding:0;cursor:pointer;" onclick="window.location.href=\'' . esc_url($detalle_url) . '\'">';
            echo '<img src="' . esc_url($pin_icon) . '" alt="Ir a marcador" class="google-pin-icon">';
            echo '</button>';
            echo '<div style="width:100%">';
            echo '<div class="mini-anuncio-titulo">' . esc_html($anuncio->titulo) . '</div>';

            // Precio
            echo '<div class="mini-anuncio-precio">';
            if (!empty($anuncio->precio_alquiler) && $anuncio->precio_alquiler > 0) echo esc_html($anuncio->precio_alquiler) . ' €';
            if (!empty($anuncio->precio_compra) && $anuncio->precio_compra > 0) echo esc_html($anuncio->precio_compra) . ' €';
            if (!empty($anuncio->precio_alquiler_habitacion) && $anuncio->precio_alquiler_habitacion > 0) echo esc_html($anuncio->precio_alquiler_habitacion) . ' €';
            echo '</div>';

            echo '<div class="mini-anuncio-ciudad">' . esc_html($anuncio->provincia) . '</div>';
            echo '<div class="mini-anuncio-detalles">' . implode(" ", $detalles) . '</div>';

            // Comentario
            echo '<div class="mini-anuncio-comentario">' . esc_html(mb_substr($anuncio->comentario,0,80)) . (mb_strlen($anuncio->comentario) > 80 ? "..." : "") . '</div>';

            echo '</div>';
            echo '</div>';
            echo '</div>'; // mini-anuncio-card
        }
    }
    echo '</div>'; // mini-anuncios-cards
    echo '</div>'; // mini-anuncios-provincia-milanuncios

    // --- FUNCION slugify ---
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

    return ob_get_clean();
}
?>