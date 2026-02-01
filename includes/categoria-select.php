<?php
global $wpdb;
$cats = $wpdb->get_results("SELECT id, nombre FROM {$wpdb->prefix}marcadores_categorias");
?>
<div class="pd-form-group">
  <label for="categoria_id" class="pd-label">Categoría</label>
  <select name="categoria_id" id="categoria_id" class="pd-input" required>
    <option value="">Elige tu categoría</option>
    <?php foreach($cats as $cat): ?>
      <option value="<?php echo esc_attr($cat->id); ?>"><?php echo esc_html($cat->nombre); ?></option>
    <?php endforeach; ?>
  </select>
</div>
<script>
document.addEventListener('DOMContentLoaded', function() {
  var categoria = document.getElementById('categoria_id');
  var resto = document.getElementById('resto-formulario');
  var titulo = document.getElementById('contenedor-titulo');
  var isLogged = <?php echo is_user_logged_in() ? 'true' : 'false'; ?>;
  var loginUrl = '<?php echo site_url('/login'); ?>';

  // Mapeo dinámico desde PHP:
  var categorias = {
    <?php foreach($cats as $cat): ?>
      <?php echo $cat->id; ?>: <?php echo json_encode($cat->nombre); ?>,
    <?php endforeach; ?>
  };

  categoria.addEventListener('change', function() {
    var catId = categoria.value;
    var catNombre = categorias[catId] || "";
    if (catId) {
      if (!isLogged) {
        localStorage.setItem('categoriaElegida', catId);
        window.location.href = loginUrl;
        return;
      }
      resto.style.display = '';
      titulo.style.display = '';

      // Oculta todos los filtros
      document.getElementById("filtro-compra").style.display = "none";
      document.getElementById("filtro-alquiler").style.display = "none";
      document.getElementById("filtro-compartir").style.display = "none";
      document.getElementById("filtro-garaje").style.display = "none";
      document.getElementById("titulo-group").style.display = "none";
      document.getElementById("comentarios-group").style.display = "none";

      // Muestra el filtro según el nombre
      if (catNombre === "Desean comprar vivienda") {
        document.getElementById("filtro-compra").style.display = "block";
        document.getElementById("titulo-group").style.display = "block";
        document.getElementById("comentarios-group").style.display = "block";
      }
      if (catNombre === "Desean alquilar vivienda") {
        document.getElementById("filtro-alquiler").style.display = "block";
        document.getElementById("titulo-group").style.display = "block";
        document.getElementById("comentarios-group").style.display = "block";
      }
      if (catNombre === "Desean alquilar habitacion" || catNombre === "Desean compartir piso") {
        document.getElementById("filtro-compartir").style.display = "block";
        document.getElementById("titulo-group").style.display = "block";
        document.getElementById("comentarios-group").style.display = "block";
      }
      if (
        catNombre === "Desean alquilar plaza de garaje" ||
        catNombre === "Desean comprar plaza de garaje"
      ) {
        document.getElementById("filtro-garaje").style.display = "block";
        document.getElementById("titulo-group").style.display = "block";
        document.getElementById("comentarios-group").style.display = "block";
      }
    } else {
      resto.style.display = 'none';
      titulo.style.display = 'none';
      document.getElementById("filtro-compra").style.display = "none";
      document.getElementById("filtro-alquiler").style.display = "none";
      document.getElementById("filtro-compartir").style.display = "none";
      document.getElementById("filtro-garaje").style.display = "none";
      document.getElementById("titulo-group").style.display = "none";
      document.getElementById("comentarios-group").style.display = "none";
    }
  });

  // Inicializa si hay una categoría guardada en localStorage
  if (isLogged) {
    var catGuardada = localStorage.getItem('categoriaElegida');
    if (catGuardada) {
      categoria.value = catGuardada;
      resto.style.display = '';
      titulo.style.display = '';
      localStorage.removeItem('categoriaElegida');
      categoria.dispatchEvent(new Event('change'));
    } else if (categoria.value) {
      resto.style.display = '';
      titulo.style.display = '';
      categoria.dispatchEvent(new Event('change'));
    }
  }
});
</script>