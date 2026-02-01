document.addEventListener("DOMContentLoaded", function() {
  // ========== FAVORITOS ==========
  document.body.addEventListener('click', function(e) {
    let el = e.target;
    if (el.classList.contains('corazon-favorito')) {
      e.stopPropagation();
      e.preventDefault();

      let marcadorId = el.dataset.id;
      fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=desmarcar_favorito&marcador_id=' + encodeURIComponent(marcadorId)
      })
      .then(response => response.json())
      .then(respuesta => {
        if (respuesta.success) {
          el.classList.remove('activo');
          el.textContent = '♡';
          // Si estamos en la página de favoritos, elimina la tarjeta
          if (window.location.pathname.includes('mis-favoritos')) {
            let card = el.closest('.mini-anuncio-card');
            if (card) {
              card.parentNode.removeChild(card);
              // Si ya no quedan cards, muestra mensaje
              let container = document.querySelector('.mini-anuncios-cards');
              if (container && container.children.length === 0) {
                container.innerHTML = "<p>No tienes anuncios favoritos.</p>";
              }
            }
          }
        } else {
          alert("No se pudo eliminar el favorito. Intenta de nuevo.");
        }
      })
      .catch(() => {
        alert("Error de comunicación con el servidor.");
      });
    }
  });

  // ========== FUNCION PARA CAPITALIZAR PROVINCIA ==========
  function capitalizarProvincia(provincia) {
    if (!provincia) return "";
    return provincia.replace(/[-_]/g, " ").toLowerCase().replace(/\b\w/g, function(l) { return l.toUpperCase(); });
  }

  // ========== MOSTRAR FAVORITOS ==========
  function cargarFavoritos() {
    const cont = document.getElementById("favoritos-contenedor");
    if (!cont) return;
    fetch('/wp-admin/admin-ajax.php?action=obtener_favoritos')
      .then(r => r.json())
      .then(favoritos => {
        let html = `<div class="mini-anuncios-provincia-milanuncios">
          <div class="mini-anuncios-provincia-title"><span>❤️</span> Mis favoritos</div>
          <div class="mini-anuncios-cards">`;
        if (!favoritos.length) {
          html += "<p>No tienes anuncios favoritos.</p></div></div>";
          cont.innerHTML = html;
          return;
        }
        favoritos.forEach(m => {
          let precio = "";
          if (m.precio_garaje && parseInt(m.precio_garaje) > 0)
            precio = `${parseInt(m.precio_garaje).toLocaleString()} €`;
          else if (m.precio_alquiler && parseInt(m.precio_alquiler) > 0)
            precio = `${parseInt(m.precio_alquiler).toLocaleString()} €`;
          else if (m.precio_compra && parseInt(m.precio_compra) > 0)
            precio = `${parseInt(m.precio_compra).toLocaleString()} €`;
          else if (m.precio_alquiler_habitacion && parseInt(m.precio_alquiler_habitacion) > 0)
            precio = `${parseInt(m.precio_alquiler_habitacion).toLocaleString()} €`;

          html += `<div class="mini-anuncio-card">
            <span class="corazon-favorito activo" data-id="${m.id}" title="Quitar de favoritos">♥</span>
            <div style="display:flex;flex-direction:column;align-items:center;gap:7px;">
              <img src="${m.avatar_url ? m.avatar_url : 'https://postaldream.com/wp-content/uploads/2025/06/postaldrem_avatar.jpg'}" alt="Avatar" class="mini-anuncio-avatar">
              <a href="/provincias/${m.provincia}/?focus=${m.id}" class="emoji-marcador" title="Ver marcador en el mapa">
                <img src="https://maps.google.com/mapfiles/ms/icons/green-dot.png" alt="Ir a marcador" class="google-pin-icon">
              </a>
              <div style="width:100%">
                <div class="mini-anuncio-titulo" style="font-size:1.07em;font-weight:600;margin-bottom:2px">
                  <a href="/desean-alquilar-vivienda/${m.provincia}/${m.titulo ? m.titulo.replace(/ /g,'-').toLowerCase() : ""}/" style="color:inherit;text-decoration:none;">
                    ${m.titulo ? m.titulo.replace(/</g, "&lt;") : ""}
                  </a>
                </div>
                ${precio ? `<div class="mini-anuncio-precio">${precio}</div>` : ""}
                <div class="mini-anuncio-ciudad">${capitalizarProvincia(m.provincia)}</div>
                <div class="mini-anuncio-detalles">
                  ${m.dormitorios_alquiler ? `<span>🛏️ ${m.dormitorios_alquiler}</span>` : ""}
                  ${m.banos_alquiler ? `<span>🛁 ${m.banos_alquiler}</span>` : ""}
                  ${m.metros_alquiler ? `<span>📏 ${m.metros_alquiler} m²</span>` : ""}
                </div>
                <div class="mini-anuncio-comentario">
                  ${m.comentario ? m.comentario.substring(0, 80) + (m.comentario.length > 80 ? "..." : "") : ""}
                </div>
              </div>
            </div>
          </div>`;
        });
        html += `</div></div>`;
        cont.innerHTML = html;
      });
  }

  // Solo llama cargarFavoritos si existe el contenedor
  if (document.getElementById("favoritos-contenedor")) {
    cargarFavoritos();
  }
});