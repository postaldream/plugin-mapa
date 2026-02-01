<?php
/**
 * Plantilla personalizada para resultados de búsqueda en Mapa Interactivo
 * Muestra los anuncios filtrados por el término de búsqueda
 * No indexa las páginas de búsqueda para SEO óptimo.
 */

// --- OBLIGA A NO SER 404 ---
global $wp_query;
$wp_query->is_404 = false;
status_header(200);

// --- Impide indexar las búsquedas ---
add_action('wp_head', function() {
    echo '<meta name="robots" content="noindex, follow">' . "\n";
}, 1);

// Obtén el término de búsqueda desde la query var personalizada
$search_term = get_query_var('search_term');
$search_term = sanitize_text_field($search_term);

if (!empty($search_term)) {
    // <title> y títulos SEO
    add_filter('pre_get_document_title', function($title) use ($search_term) {
        return 'Resultados de búsqueda para: ' . esc_html($search_term) . ' | ' . get_bloginfo('name');
    });
    add_filter('wpseo_title', function($title) use ($search_term) {
        return 'Resultados de búsqueda para: ' . esc_html($search_term) . ' | ' . get_bloginfo('name');
    });
    add_filter('rank_math/frontend/title', function($title) use ($search_term) {
        return 'Resultados de búsqueda para: ' . esc_html($search_term) . ' | ' . get_bloginfo('name');
    });

    // Meta descripción SEO:
    $custom_meta_desc = 'Anuncios encontrados para "' . esc_html($search_term) . '" en ' . get_bloginfo('name') . '. Descubre las mejores ofertas, pisos y casas filtradas por tu búsqueda.';
    add_action('wp_head', function() use ($custom_meta_desc) {
        echo '<meta name="description" content="' . esc_attr($custom_meta_desc) . '">' . "\n";
    }, 0); // prioridad 0 para salir lo más arriba posible
    // Para Yoast SEO
    add_filter('wpseo_metadesc', function($desc) use ($custom_meta_desc) {
        return $custom_meta_desc;
    });
    // Para Rank Math
    add_filter('rank_math/frontend/description', function($desc) use ($custom_meta_desc) {
        return $custom_meta_desc;
    });
}

get_header();

// --- CTA Arriba de resultados ---
$cta_url = '/?abrir_publicar=1'; // Redirige a la home y abre el formulario
?>
<style>
.cta-btn {
    background: #1976d2;
    color: white !important;
    font-weight: 600;
    padding: 10px 22px;
    border-radius: 6px;
    text-decoration: none !important;
    box-shadow: 0 2px 6px #1976d25a;
    transition: background .2s,box-shadow .2s;
    display: inline-block;
}
.cta-btn:hover {
    background: #1259a9;
    box-shadow: 0 4px 12px #1976d230;
}
.search-page-cta {
    background: #e3f2fd;
    padding: 18px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 25px;
    box-shadow: 0 2px 8px #0001;
    flex-wrap: wrap;
    gap: 14px;
}
@media (max-width: 700px) {
    .search-page-cta {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 14px;
        text-align: center;
    }
}
.no-results .cta-btn {
    margin-top: 12px;
}
</style>
<?php
echo '<div class="search-page-cta">';
echo '<div style="display:flex;align-items:center;gap:14px">';
echo '<span style="font-size:2em">📢</span>';
echo '<span style="font-size:1.16em;font-weight:500;color:#1976d2">¿No encuentras lo que buscas?</span>';
echo '</div>';
echo '<a href="' . esc_url($cta_url) . '" class="cta-btn">¡Publica tu anuncio gratis!</a>';
echo '</div>';

// --- Título de resultados ---
echo '<div class="search-results-title" style="margin:30px 0 15px 0;">';
echo '<h1>Resultados de búsqueda para: <span style="color:#1976d2;">' . esc_html($search_term) . '</span></h1>';
echo '</div>';

// Consulta personalizada
global $wpdb;
$table = $wpdb->prefix . "marcadores";
$results = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT * FROM $table WHERE titulo LIKE %s OR comentario LIKE %s ORDER BY id DESC LIMIT 50",
        '%' . $wpdb->esc_like($search_term) . '%',
        '%' . $wpdb->esc_like($search_term) . '%'
    )
);

if ($results && count($results) > 0) {
    echo '<div class="mini-anuncios-cards">';
    foreach ($results as $m) {
        // URL amigable o fallback
        if (!empty($m->categoria_slug) && !empty($m->provincia_slug) && !empty($m->titulo_slug)) {
            $url = '/' . $m->categoria_slug . '/' . $m->provincia_slug . '/' . $m->titulo_slug . '/';
        } else {
            $url = '/detalle-de-marcador/?id=' . $m->id;
        }

        // Avatar (puedes personalizar o sacar de campo)
        $avatar_url = 'https://postaldream.com/wp-content/uploads/2025/06/postaldrem_avatar.jpg';

        // Detalles (escapa valores)
        $detalles = [];
        if (!empty($m->dormitorios_alquiler) || !empty($m->dormitorios_compra))
            $detalles[] = '<span>🛏️ ' . esc_html($m->dormitorios_alquiler ?: $m->dormitorios_compra) . '</span>';
        if (!empty($m->banos_alquiler) || !empty($m->banos_compra))
            $detalles[] = '<span>🛁 ' . esc_html($m->banos_alquiler ?: $m->banos_compra) . '</span>';
        if (!empty($m->metros_alquiler) || !empty($m->metros_compra) || !empty($m->metros_alquiler_habitacion))
            $detalles[] = '<span>📏 ' . esc_html($m->metros_alquiler ?: $m->metros_compra ?: $m->metros_alquiler_habitacion) . ' m²</span>';

        // Comentario recortado y escapado
        $comentario = !empty($m->comentario)
            ? esc_html(mb_substr($m->comentario, 0, 80)) . (mb_strlen($m->comentario) > 80 ? "..." : "")
            : esc_html($m->categoria ?: "");

        // Provincia URL para el pin
        $url_provincia = '/provincias/' . $m->provincia_slug . '/?focus=' . $m->id;

        echo '<div class="mini-anuncio-card">';
        echo '<div style="display:flex;flex-direction:column;align-items:center;gap:7px;">';
        echo '<img src="' . esc_url($avatar_url) . '" alt="Avatar" class="mini-anuncio-avatar">';
        // --- PIN COMO ENLACE AL MAPA ---
        echo '<a href="' . esc_url($url_provincia) . '" class="emoji-marcador" title="Ver marcador en el mapa">';
        if (function_exists('iconoMarcadorPorCategoriaPHP')) {
            echo '<img src="' . esc_url(iconoMarcadorPorCategoriaPHP($m->categoria)) . '" alt="Ir a marcador" class="google-pin-icon">';
        }
        echo '</a>';
        echo '<div style="width:100%">';
        if (!empty($m->titulo)) {
            echo '<div class="mini-anuncio-titulo" style="font-size:1.07em;font-weight:600;margin-bottom:2px">'
                . '<a href="' . esc_url($url) . '" style="color:inherit;text-decoration:none;">'
                . esc_html($m->titulo)
                . '</a></div>';
        }
        // Precio
        $precio = '';
        if (!empty($m->precio_alquiler) && intval($m->precio_alquiler) > 0) {
            $precio = number_format($m->precio_alquiler, 0, ',', '.') . ' €';
        } elseif (!empty($m->precio_compra) && intval($m->precio_compra) > 0) {
            $precio = number_format($m->precio_compra, 0, ',', '.') . ' €';
        } elseif (!empty($m->precio_alquiler_habitacion) && intval($m->precio_alquiler_habitacion) > 0) {
            $precio = number_format($m->precio_alquiler_habitacion, 0, ',', '.') . ' €';
        }
        if ($precio) {
            echo '<div class="mini-anuncio-precio">' . esc_html($precio) . '</div>';
        }

        echo '<div class="mini-anuncio-ciudad">' . esc_html($m->provincia ?: "") . '</div>';
        echo '<div class="mini-anuncio-detalles">' . implode(" ", $detalles) . '</div>';
        echo '<div class="mini-anuncio-comentario">' . esc_html($comentario) . '</div>';
        echo '</div></div></div>'; // cerrando los divs abiertos
    }
    echo '</div>'; // mini-anuncios-cards

    // CTA secundaria al final
    echo '<div class="search-page-cta" style="margin:35px 0 0 0;text-align:center">';
    echo '<a href="' . esc_url($cta_url) . '" class="cta-btn" style="padding:13px 30px;">Publicar mi anuncio ahora</a>';
    echo '</div>';
} else {
    // --- Mensaje sin resultados + llamada a la acción ---
    echo '<div class="no-results" style="margin:35px 0; text-align:center; font-size:1.23em; color:#888;">';
    echo 'No se encontraron anuncios para "<strong>' . esc_html($search_term) . '</strong>".<br><br>';
    echo '<span style="color:#1976d2;font-weight:500;font-size:1.1em">¡Sé el primero en anunciar tu vivienda o busca habitación aquí!</span><br><br>';
    echo '<a href="' . esc_url($cta_url) . '" class="cta-btn" style="padding:13px 30px;">Publicar mi anuncio gratis</a>';
    echo '</div>';
}

get_footer();
?>