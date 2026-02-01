<?php
add_shortcode('mis_anuncios', function() {
    wp_enqueue_style('mapa-css', plugin_dir_url(__DIR__) . 'css/mapa.css', [], null);
    wp_enqueue_script('mapa-mis-anuncios', plugin_dir_url(__DIR__) . 'js/mapa-mis-anuncios.js', ['jquery'], null, true);

    if (!is_user_logged_in())
        return '<p>Debes iniciar sesion para ver tus anuncios.</p>';

    return '<div id="mis-anuncios-mini"></div>';
});