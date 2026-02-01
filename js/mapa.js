// =========== MAPA.JS ===========

let map;
let marcadoresData = {};
let marcadorTemporal = null;
window.markersOnMap = [];
let esProvincia = false; // variable global

// ========== FUNCIONES AUXILIARES ==========

const esAdmin = () => mapa_ajax_obj.is_admin === "1";
const esPropio = id => mapa_ajax_obj.usuario_logueado === "1" && +mapa_ajax_obj.user_id === +id;
const puedeEditar = id => esAdmin() || esPropio(id);

function comentarioCorto(texto) {
    if (!texto) return "";
    if (texto.length > 38) return texto.substring(0, 38) + "...";
    return texto;
}

function capitalizeWords(str) {
    if (!str) return "";
    // Convierte guiones y subrayados a espacios antes de capitalizar cada palabra
    return str.replace(/[-_]/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

const detalleUrl = id => `${mapa_ajax_obj.siteurl}/detalle-de-marcador/?id=${encodeURIComponent(id)}`;

function iconoMarcadorPorCategoria(cat) {
    if (!cat) return "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
    cat = cat.toLowerCase();
    if (cat === "desean alquilar plaza de garaje") return "https://maps.google.com/mapfiles/ms/icons/orange-dot.png";
    if (cat === "desean comprar plaza de garaje") return "https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png";
    if (cat.includes("comprar")) return "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
    if (cat.includes("habitacion")) return "https://maps.google.com/mapfiles/ms/icons/purple-dot.png";
    if (cat.includes("compartir")) return "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
    if (cat.includes("vivienda")) return "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
    return "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
}

function emojiPorCategoria(cat) {
    if (!cat) return "📍";
    cat = cat.toLowerCase();
    if (cat === "desean alquilar plaza de garaje") return "🟧"; // naranja
    if (cat === "desean comprar plaza de garaje") return "🟦"; // azul (más cercano al light blue, no existe light blue en emojis)
    if (cat.includes("comprar")) return "🟥";
    if (cat.includes("habitacion")) return "🟪";
    if (cat.includes("compartir")) return "🟦";
    if (cat.includes("vivienda")) return "🟩";
    return "📍";
}

window.centrarEnMarcador = function(id) {
    const mapDiv = document.getElementById("mapa-interactivo");
    if (mapDiv) {
        mapDiv.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(function() {
        const marker = window.markersOnMap.find(m => marcadoresData[m.id]?.id == id || m?.marcadorId == id);
        if (marker) {
            map.setCenter(marker.getPosition());
            map.setZoom(15);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => marker.setAnimation(null), 1500);
        }
    }, 600);
};

function getInitialZoom() {
    // En home: zoom bajo, en provincias: zoom ajustado tras geocodificar
    if (window.innerWidth <= 600) return 5;
    return 6;
}

// ========== INICIALIZACIÓN DEL MAPA ==========
window.initMap = function () {
    var mapDiv = document.getElementById("mapa-interactivo");
    if (!mapDiv) {
        console.warn("No se encontró #mapa-interactivo para inicializar el mapa");
        return;
    }

    // Robustez: detecta si es provincia
    esProvincia = mapa_ajax_obj.provincia && mapa_ajax_obj.provincia.trim() !== "";
    var zoomDefault = getInitialZoom();
    var centroDefault = { lat: 40.4168, lng: -3.7038 };

   map = new google.maps.Map(mapDiv, {
    center: centroDefault,
    zoom: zoomDefault,
    gestureHandling: 'cooperative', // <-- Cambiado de 'greedy' a 'cooperative'
    streetViewControl: false // <-- Esto oculta el muñequito de Street View
});

    if (esProvincia) {
        // Página de provincia: zoom especial tras geocodificar
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
            { address: mapa_ajax_obj.provincia + ', España' },
            function(results, status) {
                if (status === 'OK' && results[0]) {
                    map.setCenter(results[0].geometry.location);
                    setTimeout(() => {
                        // Zoom más cercano para la provincia
                        map.setZoom(window.innerWidth <= 600 ? 8 : 10);
                    }, 500);
                }
            }
        );
    }

    configurarBuscadorYFiltro();
    configurarFormulario();
    configurarEventosMapa();
    actualizarMarcadores();

    cargarUltimosMarcadores();
    setInterval(cargarUltimosMarcadores, 180000);

    cargarMisMarcadores();
    cargarMiniAnunciosProvincia();
    cargarListaMarcadoresProvincia();
    setTimeout(agregarSelectorProvinciaGlobal, 1000);
};

// ========== FIX ZOOM: EVITA RESET EN MÓVIL AL INTERACTUAR ==========
window.addEventListener('resize', function() {
    // Solo resetea el zoom en la home, nunca en páginas de provincia
    if (map && !esProvincia) {
        map.setZoom(getInitialZoom());
    }
});

// ========== FORMULARIO ==========
function configurarFormulario() {
    const btn = document.getElementById("mostrar-formulario-btn");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (typeof mapa_ajax_obj !== "undefined" && mapa_ajax_obj.modo === "estatico") {
            return;
        }
        if (mapa_ajax_obj.usuario_logueado !== "1") {
            window.location.href = mapa_ajax_obj.login_url + "?redirect_to=" + encodeURIComponent(window.location.href);
            return;
        }
        const f = document.getElementById("formulario-marcador");
        if (f) {
            f.style.display = (f.style.display === "none" || f.style.display === "") ? "block" : "none";
        }
    });
}

// ========== FILTROS ==========
function configurarFiltros() {
    document.querySelectorAll(".categoria-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const f = document.getElementById("formulario-marcador");
            if (f) f.style.display = "none";
            const fc = document.getElementById("filtro-compra");
            if (fc) fc.style.display = "none";
            const fa = document.getElementById("filtro-alquiler");
            if (fa) fa.style.display = "none";
            const fcomp = document.getElementById("filtro-compartir");
            if (fcomp) fcomp.style.display = "none";
            const detalles = document.getElementById("comentarios-group");
            if (detalles) detalles.style.display = "none";
            window.__mapa_busqueda_centro = null;
            filtrarMarcadoresBoton(btn.dataset.categoria);
        });
    });
}

function filtrarMarcadoresBoton(categoria) {
    const select = document.getElementById('map-category');
    if (select) select.value = categoria || "";
    filtrarMarcadoresPorBusquedaYCategoria();
}

function configurarBuscadorYFiltro() {
    const input = document.getElementById('map-search');
    if (input && google.maps.places) {
        let autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', map);
        autocomplete.addListener('place_changed', function () {
            let place = autocomplete.getPlace();
            if (!place.geometry) {
                mostrarMensajeMapa("No se encontró el lugar", true);
                return;
            }
            let position = place.geometry.location;
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(position);
                map.setZoom(getInitialZoom());
            }
            window.__mapa_busqueda_centro = position;
            filtrarMarcadoresPorBusquedaYCategoria();
        });
    }
    const select = document.getElementById('map-category');
    if (select) {
        select.addEventListener('change', filtrarMarcadoresPorBusquedaYCategoria);
    }
}

function filtrarMarcadoresPorBusquedaYCategoria() {
    const select = document.getElementById('map-category');
    const categoria = select ? select.value : "";
    const center = window.__mapa_busqueda_centro || null;
    const radio = 10000;
    window.markersOnMap.forEach(marker => {
        let mostrar = true;
        if (categoria && marker.categoria !== categoria) mostrar = false;
        if (center) {
            let dist = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(marker.getPosition()),
                new google.maps.LatLng(center)
            );
            if (dist > radio) mostrar = false;
        }
        marker.setVisible(mostrar);
        if (mostrar && center) map.setCenter(center);
    });
}

function configurarEventosMapa() {
    if (mapa_ajax_obj.modo === "estatico") return;
    if (map.addEventListener) {
        map.addEventListener("click", e => {
            if (mapa_ajax_obj.usuario_logueado !== "1") {
                mostrarMensajeMapa("Debes iniciar sesión para añadir marcadores.", true);
                return;
            }
            colocarMarcadorTemporal(e.latLng);
        });
    }
    if (map.addListener) {
        map.addListener("click", e => {
            if (mapa_ajax_obj.usuario_logueado !== "1") {
                mostrarMensajeMapa("Debes iniciar sesión para añadir marcadores.", true);
                return;
            }
            colocarMarcadorTemporal(e.latLng);
        });
    }
}

function colocarMarcadorTemporal(loc) {
    if (marcadorTemporal) marcadorTemporal.setMap(null);
    marcadorTemporal = new google.maps.Marker({
        position: loc,
        map,
        icon: { url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png", scaledSize: new google.maps.Size(30, 30) }
    });
}

// =========== FUNCIÓN GUARDAR MARCADOR ===========

function guardarMarcador() {
    if (mapa_ajax_obj.usuario_logueado !== "1") { 
        mostrarMensajeMapa("Debes iniciar sesión o registrarte si aún no lo has hecho", true); 
        return; 
    }

    const titulo = document.getElementById("titulo-input").value.trim();
    const comentario = document.getElementById("comentario-input").value.trim();
    const categoria = document.getElementById("categoria-selector").value;
    let provincia = "";
    if (typeof mapa_ajax_obj !== "undefined" && mapa_ajax_obj.provincia && mapa_ajax_obj.provincia.trim() !== "") {
        provincia = mapa_ajax_obj.provincia;
    } else {
        provincia = document.getElementById("provincia-selector").value;
    }
    if (!titulo) {
        mostrarMensajeMapa("Es necesario que rellenes el campo de Título.", true);
        return;
    }
    if (!comentario || !marcadorTemporal) { 
        mostrarMensajeMapa("Es necesario que rellenes el campo de Detalles y añadas tu marcador.", true); 
        return; 
    }

    const d = new FormData();
    d.append("action", "guardar_marcador");
    d.append("lat", marcadorTemporal.getPosition().lat());
    d.append("lng", marcadorTemporal.getPosition().lng());
    d.append("titulo", titulo);
    d.append("comentario", comentario);
    d.append("categoria", categoria);
    d.append("provincia", provincia);

    if (categoria === "Desean comprar vivienda") {
        d.append("precio_compra", document.getElementById("precio_compra").value);
        d.append("metros_compra", document.getElementById("metros_compra").value);
        d.append("dormitorios_compra", document.getElementById("dormitorios_compra").value);
        d.append("banos_compra", document.getElementById("banos_compra").value);
    }
    if (categoria === "Desean alquilar vivienda") {
        d.append("precio_alquiler", document.getElementById("precio_alquiler").value);
        d.append("metros_alquiler", document.getElementById("metros_alquiler").value);
        d.append("dormitorios_alquiler", document.getElementById("dormitorios_alquiler").value);
        d.append("banos_alquiler", document.getElementById("banos_alquiler").value);
        d.append("expectativas", document.getElementById("expectativas").value);
    }
    if (categoria === "Desean alquilar habitacion") {
        d.append("precio_alquiler_habitacion", document.getElementById("precio_alquiler_habitacion").value);
        d.append("metros_alquiler_habitacion", document.getElementById("metros_alquiler_habitacion").value);
        d.append("mascotas", document.getElementById("mascotas").value);
        d.append("fumador", document.getElementById("fumador").value);
        d.append("edad", document.getElementById("edad").value);
        d.append("trabajo", document.getElementById("trabajo").value);
        d.append("pareja", document.getElementById("pareja").value);
        d.append("contrato_alquiler", document.getElementById("contrato_alquiler").value);
        d.append("expectativas", document.getElementById("expectativas").value);
    }
    // ---------- BLOQUE PARA GARAJE ----------
    if (categoria === "Desean alquilar plaza de garaje" || categoria === "Desean comprar plaza de garaje") {
        d.append("precio_garaje", document.getElementById("precio_garaje").value);
    }
    // ----------------------------------------

    fetch(mapa_ajax_obj.ajaxurl, { method: "POST", body: d })
        .then(r => r.json())
        .then(res => {
            if (!res.success) {
                if (res.msg) {
                    mostrarMensajeMapa(res.msg, true);
                } else {
                    mostrarMensajeMapa("Has superado tu límite de marcadores. Elimina alguno para poder añadir uno nuevo.", true);
                }
                return;
            }
            mostrarMensajeMapa("Marcador añadido correctamente", false);
            limpiarFormulario();
            actualizarMarcadores();
            cargarMisMarcadores();
        })
        .catch(err => mostrarMensajeMapa("Error de red o servidor", true));
}

function limpiarFormulario() {
    document.getElementById("titulo-input").value = "";
    document.getElementById("comentario-input").value = "";
    if (marcadorTemporal) marcadorTemporal.setMap(null);
    marcadorTemporal = null;
}

function cargarMisMarcadores() {
    const cont = document.getElementById("mis-marcadores-contenedor");
    if (!cont) return;
    fetch(mapa_ajax_obj.ajaxurl + "?action=obtener_mis_marcadores")
        .then(r => r.json())
        .then(data => {
            let html = `<div class="mis-marcs-title">${esAdmin() ? 'Todos los anuncios' : 'Mis anuncios'}</div>`;
            if (!data.length) {
                cont.innerHTML = "";
                return;
            }
            html += `<ul class="mis-marcs-list">`;
            data.forEach(m => {
                html += `<li>
                    <div><b>${m.categoria || 'Sin categoría'}</b> <span style="color:#1976d2;">${m.provincia || ''}</span></div>
                    <div>${m.comentario ? m.comentario.replace(/</g, "&lt;") : ''}</div>
                    <div class="marcador-btns">
                        <button type="button"
                                onclick="centrarEnMarcador(${m.id});event.preventDefault();event.stopPropagation();"
                                style="background:#1976d2;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;margin-top:7px;">
                            Ver en mapa
                        </button>
                        ${puedeEditar(m.user_id) ? `
                            <button class="editar" data-id="${m.id}">Editar</button>
                            <button class="eliminar" data-id="${m.id}">Eliminar</button>
                        ` : ``}
                    </div>
                </li>`;
            });
            html += `</ul>`;
            cont.innerHTML = html;

            cont.querySelectorAll('.eliminar').forEach(btn => {
                btn.onclick = function() {
                    if (!confirm("¿Seguro que deseas eliminar este marcador?")) return;
                    fetch(mapa_ajax_obj.ajaxurl, {
                        method: "POST",
                        body: new URLSearchParams({ action: "eliminar_marcador", id: btn.dataset.id })
                    })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) {
                            mostrarMensajeMapa("Marcador eliminado", false);
                            cargarMisMarcadores();
                            actualizarMarcadores();
                        } else {
                            mostrarMensajeMapa("No se pudo eliminar", true);
                        }
                    });
                }
            });

            cont.querySelectorAll('.editar').forEach(btn => {
                btn.onclick = function() {
                    let id = btn.dataset.id;
                    let marcador = data.find(m => m.id == id);
                    mostrarModalEdicionMarcador(marcador);
                }
            });
        });
}

// =========== MODAL EDICIÓN MULTICAMPO ===========

function mostrarModalEdicionMarcador(marcador) {
    let modal = document.getElementById("modal-editar-marcador");
    if (!modal) return;
    let form = document.getElementById("form-editar-marcador");
    if (!form) return;
    form.innerHTML = `
        <input type="hidden" id="editar-id-marcador" value="${marcador.id}">
        <div class="pd-form-group">
          <label for="editar-titulo" class="pd-label">Título</label>
          <input type="text" id="editar-titulo" class="pd-input" value="${marcador.titulo || ""}">
        </div>
        <div class="pd-form-group">
          <label for="editar-comentario" class="pd-label">Detalles y preferencias</label>
          <textarea id="editar-comentario" class="pd-input" rows="2">${marcador.comentario || ""}</textarea>
        </div>
        <div class="pd-form-group">
          <label for="editar-categoria-selector" class="pd-label">Categoría</label>
          <select id="editar-categoria-selector" class="pd-input" name="categoria">
            <option value="">Elige tu categoría</option>
            <option value="Desean alquilar habitacion">Desean compartir piso</option>
            <option value="Desean alquilar vivienda">Desean alquilar vivienda</option>
            <option value="Desean comprar vivienda">Desean comprar vivienda</option>
            <option value="Desean alquilar plaza de garaje">Desean alquilar plaza de garaje</option>
            <option value="Desean comprar plaza de garaje">Desean comprar plaza de garaje</option>
          </select>
        </div>
        <div id="editar-filtros-categoria"></div>
        <div class="pd-form-group">
          <label for="editar-provincia-selector" class="pd-label">Provincia</label>
          <input id="editar-provincia-selector" class="pd-input" value="${marcador.provincia || ""}">
        </div>
        <div style="text-align:right;margin-top:15px;">
          <button type="submit" class="pd-btn-primary">Guardar cambios</button>
        </div>
    `;
    document.getElementById("editar-categoria-selector").value = marcador.categoria || "";

    function mostrarFiltrosCategoriaEdicion() {
        let cat = document.getElementById("editar-categoria-selector").value;
        let filtros = document.getElementById("editar-filtros-categoria");
        let html = "";
        if (cat === "Desean comprar vivienda") {
            html += `
                <div class="pd-form-group">
                    <label for="editar-precio-compra" class="pd-label">Precio máx. (€)</label>
                    <input type="number" id="editar-precio-compra" class="pd-input" value="${marcador.precio_compra || ""}">
                </div>
                <div class="pd-form-group">
                    <label for="editar-metros-compra" class="pd-label">Metros mínimos</label>
                    <input type="number" id="editar-metros-compra" class="pd-input" value="${marcador.metros_compra || ""}">
                </div>
                <div class="pd-form-group">
                    <label for="editar-dormitorios-compra" class="pd-label">Dormitorios</label>
                    <input type="number" id="editar-dormitorios-compra" class="pd-input" value="${marcador.dormitorios_compra || ""}">
                </div>
                <div class="pd-form-group">
                    <label for="editar-banos-compra" class="pd-label">Baños</label>
                    <input type="number" id="editar-banos-compra" class="pd-input" value="${marcador.banos_compra || ""}">
                </div>
            `;
        }
        if (cat === "Desean alquilar vivienda") {
            html += `
                <div class="pd-form-group">
                    <label for="editar-precio-alquiler" class="pd-label">Precio máx. (€)</label>
                    <input type="number" id="editar-precio-alquiler" class="pd-input" value="${marcador.precio_alquiler || ""}">
                </div>
                <div class="pd-form-group">
                    <label for="editar-metros-alquiler" class="pd-label">Metros mínimos</label>
                    <input type="number" id="editar-metros-alquiler" class="pd-input" value="${marcador.metros_alquiler || ""}">
                </div>
                <div class="pd-form-group">
                    <label for="editar-dormitorios-alquiler" class="pd-label">Dormitorios</label>
                    <input type="number" id="editar-dormitorios-alquiler" class="pd-input" value="${marcador.dormitorios_alquiler || ""}">
                </div>
                <div class="pd-form-group">
                    <label for="editar-banos-alquiler" class="pd-label">Baños</label>
                    <input type="number" id="editar-banos-alquiler" class="pd-input" value="${marcador.banos_alquiler || ""}">
                </div>
                <div class="pd-form-group">
                    <label for="editar-expectativas-alquiler" class="pd-label">Expectativas</label>
                    <select id="editar-expectativas-alquiler" class="pd-input">
                        <option value="">Selecciona una opción</option>
                        <option value="corta" ${(marcador.expectativas === "corta") ? "selected" : ""}>Corta estancia (hasta 6 meses)</option>
                        <option value="media" ${(marcador.expectativas === "media") ? "selected" : ""}>Media estancia (6-12 meses)</option>
                        <option value="larga" ${(marcador.expectativas === "larga") ? "selected" : ""}>Larga estancia (más de 1 año)</option>
                    </select>
                </div>
            `;
        }
        if (cat === "Desean alquilar habitacion") {
            html += `
                <div class="pd-form-group">
                    <label for="editar-precio-alquiler-habitacion" class="pd-label">Precio máx. (€)</label>
                    <input type="number" id="editar-precio-alquiler-habitacion" class="pd-input" value="${marcador.precio_alquiler_habitacion || ""}">
                </div>
                <div class="pd-form-group">
                    <label for="editar-metros-alquiler-habitacion" class="pd-label">Metros mínimos</label>
                    <input type="number" id="editar-metros-alquiler-habitacion" class="pd-input" value="${marcador.metros_alquiler_habitacion || ""}">
                </div>
                <div class="pd-form-group">
                    <label for="editar-mascotas" class="pd-label">¿Mascotas?</label>
                    <select id="editar-mascotas" class="pd-input">
                        <option value="-1" ${(marcador.mascotas == -1) ? "selected" : ""}>No especifica</option>
                        <option value="1" ${(marcador.mascotas == 1) ? "selected" : ""}>Sí</option>
                        <option value="0" ${(marcador.mascotas == 0) ? "selected" : ""}>No</option>
                    </select>
                </div>
                <div class="pd-form-group">
                    <label for="editar-fumador" class="pd-label">¿Fumador?</label>
                    <select id="editar-fumador" class="pd-input">
                        <option value="-1" ${(marcador.fumador == -1) ? "selected" : ""}>No especifica</option>
                        <option value="1" ${(marcador.fumador == 1) ? "selected" : ""}>Sí</option>
                        <option value="0" ${(marcador.fumador == 0) ? "selected" : ""}>No</option>
                    </select>
                </div>
                <div class="pd-form-group">
                    <label for="editar-edad" class="pd-label">Edad</label>
                    <input type="number" id="editar-edad" class="pd-input" value="${marcador.edad || ""}">
                </div>
                <div class="pd-form-group">
                    <label for="editar-trabajo" class="pd-label">¿Trabaja?</label>
                    <select id="editar-trabajo" class="pd-input">
                        <option value="-1" ${(marcador.trabajo == -1) ? "selected" : ""}>No especifica</option>
                        <option value="1" ${(marcador.trabajo == 1) ? "selected" : ""}>Sí</option>
                        <option value="0" ${(marcador.trabajo == 0) ? "selected" : ""}>No</option>
                    </select>
                </div>
                <div class="pd-form-group">
                    <label for="editar-pareja" class="pd-label">¿Pareja?</label>
                    <select id="editar-pareja" class="pd-input">
                        <option value="-1" ${(marcador.pareja == -1) ? "selected" : ""}>No especifica</option>
                        <option value="1" ${(marcador.pareja == 1) ? "selected" : ""}>Sí</option>
                        <option value="0" ${(marcador.pareja == 0) ? "selected" : ""}>No</option>
                    </select>
                </div>
                <div class="pd-form-group">
                    <label for="editar-contrato-alquiler" class="pd-label">¿Contrato alquiler?</label>
                    <select id="editar-contrato-alquiler" class="pd-input">
                        <option value="-1" ${(marcador.contrato_alquiler == -1) ? "selected" : ""}>No especifica</option>
                        <option value="1" ${(marcador.contrato_alquiler == 1) ? "selected" : ""}>Sí</option>
                        <option value="0" ${(marcador.contrato_alquiler == 0) ? "selected" : ""}>No</option>
                    </select>
                </div>
                <div class="pd-form-group">
                    <label for="editar-expectativas-habitacion" class="pd-label">Expectativas</label>
                    <select id="editar-expectativas-habitacion" class="pd-input">
                        <option value="">Selecciona una opción</option>
                        <option value="corta" ${(marcador.expectativas === "corta") ? "selected" : ""}>Corta estancia (hasta 6 meses)</option>
                        <option value="media" ${(marcador.expectativas === "media") ? "selected" : ""}>Media estancia (6-12 meses)</option>
                        <option value="larga" ${(marcador.expectativas === "larga") ? "selected" : ""}>Larga estancia (más de 1 año)</option>
                    </select>
                </div>
            `;
        }
        // ========== BLOQUE GARAJE PARA EDICIÓN ==========
        if (cat === "Desean alquilar plaza de garaje" || cat === "Desean comprar plaza de garaje") {
            html += `
                <div class="pd-form-group">
                    <label for="editar-precio-garaje" class="pd-label">Precio plaza de garaje (€)</label>
                    <input type="number" id="editar-precio-garaje" class="pd-input" value="${marcador.precio_garaje || ""}">
                </div>
            `;
        }
        // ================================================
        filtros.innerHTML = html;
    }
    document.getElementById("editar-categoria-selector").addEventListener("change", mostrarFiltrosCategoriaEdicion);
    mostrarFiltrosCategoriaEdicion();
    modal.style.display = "flex";
    form.onsubmit = function(e) {
        e.preventDefault();
        let id = document.getElementById('editar-id-marcador').value;
        let categoria = document.getElementById('editar-categoria-selector').value;
        let data = new URLSearchParams();
        data.append("action", "editar_marcador");
        data.append("id", id);
        data.append("titulo", document.getElementById('editar-titulo').value);
        data.append("comentario", document.getElementById('editar-comentario').value);
        data.append("categoria", categoria);
        data.append("provincia", document.getElementById('editar-provincia-selector').value);
        if (categoria === "Desean comprar vivienda") {
            data.append("precio_compra", document.getElementById("editar-precio-compra").value);
            data.append("metros_compra", document.getElementById("editar-metros-compra").value);
            data.append("dormitorios_compra", document.getElementById("editar-dormitorios-compra").value);
            data.append("banos_compra", document.getElementById("editar-banos-compra").value);
        }
        if (categoria === "Desean alquilar vivienda") {
            data.append("precio_alquiler", document.getElementById("editar-precio-alquiler").value);
            data.append("metros_alquiler", document.getElementById("editar-metros-alquiler").value);
            data.append("dormitorios_alquiler", document.getElementById("editar-dormitorios-alquiler").value);
            data.append("banos_alquiler", document.getElementById("editar-banos-alquiler").value);
            data.append("expectativas", document.getElementById("editar-expectativas-alquiler").value);
        }
        if (categoria === "Desean alquilar habitacion") {
            data.append("precio_alquiler_habitacion", document.getElementById("editar-precio-alquiler-habitacion").value);
            data.append("metros_alquiler_habitacion", document.getElementById("editar-metros-alquiler-habitacion").value);
            data.append("mascotas", document.getElementById("editar-mascotas").value);
            data.append("fumador", document.getElementById("editar-fumador").value);
            data.append("edad", document.getElementById("editar-edad").value);
            data.append("trabajo", document.getElementById("editar-trabajo").value);
            data.append("pareja", document.getElementById("editar-pareja").value);
            data.append("contrato_alquiler", document.getElementById("editar-contrato-alquiler").value);
            data.append("expectativas", document.getElementById("editar-expectativas-habitacion").value);
        }
        // ============ BLOQUE GARAJE EN EDICIÓN ===========
        if (categoria === "Desean alquilar plaza de garaje" || categoria === "Desean comprar plaza de garaje") {
            data.append("precio_garaje", document.getElementById("editar-precio-garaje").value);
        }
        // ================================================
        fetch(mapa_ajax_obj.ajaxurl, {
            method: "POST",
            body: data
        })
        .then(r => r.json())
        .then(res => {
            if (res.success) {
                mostrarMensajeMapa("Marcador actualizado", false);
                document.getElementById('modal-editar-marcador').style.display = "none";
                cargarMisMarcadores();
                actualizarMarcadores();
            } else {
                mostrarMensajeMapa("No se pudo actualizar", true);
            }
        });
    };
}

// ========== ACTUALIZAR MARCADORES EN EL MAPA ==========
function actualizarMarcadores() {
    let url = `${mapa_ajax_obj.ajaxurl}?action=obtener_marcadores`;

    // Filtra por provincia si existe
    if (mapa_ajax_obj.provincia && mapa_ajax_obj.provincia.trim() !== "") {
        url += `&provincia=${encodeURIComponent(mapa_ajax_obj.provincia)}`;
    }

    // Filtra por categoría si existe (puede ser slug, nombre, id, según tu backend)
    // Usa el valor que tu backend espera, por ejemplo: window.mapaCategoria, window.categoriaActual, window.categoria_slug, etc.
    // Ejemplo con window.mapaCategoria:
    if (window.mapaCategoria && window.mapaCategoria.trim() !== "") {
        url += `&categoria=${encodeURIComponent(window.mapaCategoria)}`;
    }

    fetch(url)
        .then(r => r.json())
        .then(data => {
            // Limpia los marcadores anteriores
            if (window.markersOnMap && Array.isArray(window.markersOnMap)) {
                window.markersOnMap.forEach(m => m.setMap(null));
            }
            window.markersOnMap = [];
            marcadoresData = {};

            // Solo pinta los recibidos (ya filtrados por PHP backend)
            data.forEach(m => {
                marcadoresData[m.id] = m;

                const iconNormal = {
                    url: iconoMarcadorPorCategoria(m.categoria),
                    scaledSize: new google.maps.Size(32, 32)
                };

                const marker = new google.maps.Marker({
                    position: { lat: +m.lat, lng: +m.lng },
                    map,
                    title: `${m.usuario}: ${m.comentario}`,
                    icon: iconNormal
                });
                marker.categoria = m.categoria;
                marker.id = m.id;
                marker.marcadorId = m.id;

                marker.addListener("click", function() {
                    window.location.href = `${mapa_ajax_obj.siteurl}/detalle-de-marcador/?id=${m.id}`;
                });

                window.markersOnMap.push(marker);
            });
        });
}
// ========== MENSAJES Y UTILIDADES ==========
function mostrarMensajeMapa(msg, esError) {
    let el = document.getElementById("mensaje-mapa");
    if (!el) {
        el = document.createElement("div");
        el.id = "mensaje-mapa";
        el.style.position = "fixed";
        el.style.top = "50%";
        el.style.left = "50%";
        el.style.transform = "translate(-50%, -50%)";
        el.style.zIndex = "10000";
        el.style.background = esError ? "#c62828" : "#1976d2";
        el.style.color = "#fff";
        el.style.padding = "22px 36px";
        el.style.borderRadius = "20px";
        el.style.fontWeight = "700";
        el.style.fontSize = "1.17em";
        el.style.boxShadow = "0 6px 32px rgba(0,0,0,0.20)";
        el.style.textAlign = "center";
        el.style.maxWidth = "93vw";
        el.style.wordBreak = "break-word";
        el.style.pointerEvents = "none";
        document.body.appendChild(el);
    }
    el.innerText = msg;
    el.style.background = esError ? "#c62828" : "#1976d2";
    el.style.display = "block";
    el.style.opacity = "1";
    setTimeout(() => {
        el.style.opacity = "0";
        setTimeout(() => { el.style.display = "none"; }, 600);
    }, 2500);
}
// ========== FAVORITOS ==========
function cargarFavoritos() {
    const cont = document.getElementById("favoritos-contenedor");
    if (!cont) return;
    fetch(mapa_ajax_obj.ajaxurl + "?action=obtener_favoritos")
        .then(r => r.json())
        .then(favoritos => {
            let html = `<div class="favoritos-title">Favoritos</div>`;
            if (!favoritos.length) {
                cont.innerHTML = "";
                return;
            }
            html += `<div class="favoritos-list">`;
            favoritos.forEach(m => {
                html += `<div class="favorito-card">
                    <div><b>${m.titulo || ""}</b></div>
                    <div>${m.comentario || ""}</div>
                    <button type="button"
                            onclick="centrarEnMarcador(${m.id});event.preventDefault();event.stopPropagation();"
                            style="background:#176ab5;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;">
                        Ver en mapa
                    </button>
                    <button class="quitar-favorito" data-id="${m.id}" style="margin-left:10px;">Quitar</button>
                </div>`;
            });
            html += `</div>`;
            cont.innerHTML = html;

            cont.querySelectorAll('.quitar-favorito').forEach(btn => {
                btn.onclick = function() {
                    fetch(mapa_ajax_obj.ajaxurl, {
                        method: "POST",
                        body: new URLSearchParams({ action: "quitar_favorito", id: btn.dataset.id })
                    })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) {
                            mostrarMensajeMapa("Marcador quitado de favoritos", false);
                            cargarFavoritos();
                        } else {
                            mostrarMensajeMapa("No se pudo quitar", true);
                        }
                    });
                };
            });
        });
}

// ========== UTILIDADES Y MANEJO DE MODAL ==========
function cerrarModalEdicionMarcador() {
    let modal = document.getElementById("modal-editar-marcador");
    if (modal) modal.style.display = "none";
}

document.addEventListener("click", function(e) {
    let modal = document.getElementById("modal-editar-marcador");
    if (!modal) return;
    if (modal.style.display === "flex" && e.target === modal) {
        cerrarModalEdicionMarcador();
    }
});

// ========== SEGURIDAD Y ESCAPE HTML ==========
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function(m) {
        switch (m) {
            case "&": return "&amp;";
            case "<": return "&lt;";
            case ">": return "&gt;";
            case '"': return "&quot;";
            case "'": return "&#39;";
            default: return m;
        }
    });
}

// ========== OTROS HANDLERS (si tienes más modales, etc) ==========
function mostrarModalSimple(mensaje) {
    let modal = document.getElementById("modal-simple");
    if (!modal) return;
    let body = modal.querySelector(".modal-body");
    if (body) body.innerText = mensaje;
    modal.style.display = "block";
    setTimeout(() => { modal.style.display = "none"; }, 2500);
}

// ========== EXPORTS (si usas módulos) ==========
if (typeof window !== "undefined") {
    window.actualizarMarcadores = actualizarMarcadores;
    window.cargarMisMarcadores = cargarMisMarcadores;
    window.cargarFavoritos = cargarFavoritos;
    window.mostrarMensajeMapa = mostrarMensajeMapa;
    window.centrarEnMarcador = centrarEnMarcador;
}
// ========== SCROLL PRIMERO, LUEGO ZOOM Y CENTRADO EN MARCADOR SI HAY ?focus=ID ==========
const params = new URLSearchParams(window.location.search);
const focusId = params.get('focus');

function scrollYZoomMarcador(retries = 0) {
    // Espera hasta que markers y map estén listos (máx 10 intentos)
    if (!window.markersOnMap || !Array.isArray(window.markersOnMap) || typeof map === "undefined") {
        if (retries < 10) setTimeout(() => scrollYZoomMarcador(retries + 1), 200);
        return;
    }

    const marker = window.markersOnMap.find(m => m.id == focusId || m.marcadorId == focusId);
    if (marker) {
        // Scroll al mapa primero, centrado en pantalla
        const mapDiv = document.getElementById("mapa-interactivo");
        if (mapDiv) {
            mapDiv.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        // Después de scroll (700ms para asegurar que el usuario ve el mapa centrado)
        setTimeout(function() {
            map.setCenter(marker.getPosition());
            map.setZoom(20); // Zoom máximo permitido por Google Maps
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => marker.setAnimation(null), 2000);
        }, 700);
    }
}

if (focusId) {
    scrollYZoomMarcador();
}

// ========== CARGA DE MINI-ANUNCIOS DESTACADOS DE PROVINCIA ==========
function cargarMiniAnunciosProvincia() {
    const contenedor = document.getElementById("mini-anuncios-provincia");
    if (!contenedor) return;
    if (!mapa_ajax_obj.provincia || !mapa_ajax_obj.provincia.trim()) {
        contenedor.innerHTML = "";
        return;
    }
    fetch(mapa_ajax_obj.ajaxurl + "?action=obtener_marcadores&provincia=" + encodeURIComponent(mapa_ajax_obj.provincia))
        .then(r => r.json())
        .then(data => {
            if (!data || !data.length) {
                contenedor.innerHTML = "";
                return;
            }
            const destacados = data.slice(0, 6);
            let html = `<div class="mini-anuncios-provincia-milanuncios">
                <h2 class="mini-anuncios-provincia-title">
                    <span>🏡</span> Anuncios destacados en <b>${mapa_ajax_obj.provincia.charAt(0).toUpperCase() + mapa_ajax_obj.provincia.slice(1)}</b>
                </h2>
                <div class="mini-anuncios-cards">`;
            destacados.forEach(m => {
                const avatar = `<img src="${m.avatar_url ? m.avatar_url : 'https://postaldream.com/wp-content/uploads/2025/06/postaldrem_avatar.jpg'}" alt="Avatar" class="mini-anuncio-avatar">`;
                let precio = '';
                if (m.precio_alquiler && parseInt(m.precio_alquiler) > 0)
                    precio = `<div class="mini-anuncio-precio">${parseInt(m.precio_alquiler).toLocaleString()} €</div>`;
                else if (m.precio_compra && parseInt(m.precio_compra) > 0)
                    precio = `<div class="mini-anuncio-precio">${parseInt(m.precio_compra).toLocaleString()} €</div>`;
                else if (m.precio_alquiler_habitacion && parseInt(m.precio_alquiler_habitacion) > 0)
                    precio = `<div class="mini-anuncio-precio">${parseInt(m.precio_alquiler_habitacion).toLocaleString()} €</div>`;
                else if (m.precio_garaje && parseInt(m.precio_garaje) > 0)
                    precio = `<div class="mini-anuncio-precio">${parseInt(m.precio_garaje).toLocaleString()} €</div>`;

                let detalles = [];
                if (
                    (m.dormitorios_alquiler && parseInt(m.dormitorios_alquiler) > 0) ||
                    (m.dormitorios_compra && parseInt(m.dormitorios_compra) > 0)
                ) {
                    detalles.push(`<span>🛏️ ${
                        (m.dormitorios_alquiler && parseInt(m.dormitorios_alquiler) > 0)
                            ? m.dormitorios_alquiler
                            : m.dormitorios_compra
                    }</span>`);
                }
                if (
                    (m.banos_alquiler && parseInt(m.banos_alquiler) > 0) ||
                    (m.banos_compra && parseInt(m.banos_compra) > 0)
                ) {
                    detalles.push(`<span>🛁 ${
                        (m.banos_alquiler && parseInt(m.banos_alquiler) > 0)
                            ? m.banos_alquiler
                            : m.banos_compra
                    }</span>`);
                }
                if (
                    (m.metros_alquiler && parseInt(m.metros_alquiler) > 0) ||
                    (m.metros_compra && parseInt(m.metros_compra) > 0) ||
                    (m.metros_alquiler_habitacion && parseInt(m.metros_alquiler_habitacion) > 0)
                ) {
                    detalles.push(`<span>📏 ${
                        (m.metros_alquiler && parseInt(m.metros_alquiler) > 0)
                            ? m.metros_alquiler
                            : (m.metros_compra && parseInt(m.metros_compra) > 0)
                                ? m.metros_compra
                                : m.metros_alquiler_habitacion
                    } m²</span>`);
                }

                const comentario = m.comentario
                    ? m.comentario.substring(0, 80) + (m.comentario.length > 80 ? "..." : "")
                    : (m.categoria || "");

                html += `
<a href="${mapa_ajax_obj.siteurl}/detalle-de-marcador/?id=${m.id}" class="mini-anuncio-card">
  <span class="corazon-favorito" data-id="${m.id}" title="Añadir a favoritos">♡</span>
  <div style="display:flex;flex-direction:column;align-items:center;gap:7px;">
    ${avatar}
    <button type="button" class="emoji-marcador" onclick="centrarEnMarcador(${m.id});event.stopPropagation();return false;">
        <img src="${iconoMarcadorPorCategoria(m.categoria)}" alt="Ir a marcador" class="google-pin-icon">
    </button>
    <div style="width:100%">
      <div class="mini-anuncio-titulo" style="font-size:1.07em;font-weight:600;margin-bottom:2px">
        ${m.titulo ? m.titulo.replace(/</g, "&lt;") : ""}
      </div>
      ${precio}
      <div class="mini-anuncio-ciudad">${m.provincia ? capitalizeWords(m.provincia) : ""}</div>
      <div class="mini-anuncio-detalles">${detalles.join(" ")}</div>
      <div class="mini-anuncio-comentario">${comentario.replace(/</g, "&lt;")}</div>
    </div>
  </div>
</a>`;
            });
            html += `</div>
                <div style="margin-top:13px;text-align:right;">
                    <a href="#" onclick="document.getElementById('ultimos-marcadores-seo').scrollIntoView({behavior:'smooth'});return false;" style="color:#176ab5;text-decoration:underline;font-size:1em;font-weight:600;">Ver todos los anuncios</a>
                </div>
            </div>`;
            contenedor.innerHTML = html;
            refrescarFavoritos();
        })
        .catch(e => {
            contenedor.innerHTML = "";
            console.error(e);
        });
}

// ========== REFRESCAR FAVORITOS EN MINI ANUNCIOS ==========
let favoritos = [];
function refrescarFavoritos() {
    if(typeof mapa_ajax_obj !== "undefined" && mapa_ajax_obj.usuario_logueado == '1') {
        fetch(mapa_ajax_obj.ajaxurl, {
            method: "POST",
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: "action=obtener_favoritos"
        })
        .then(r=>r.json())
        .then(resp => {
            favoritos = Array.isArray(resp) ? resp.map(x=>x.toString()) : [];
            document.querySelectorAll('.corazon-favorito').forEach(function(el){
                let id = el.dataset.id.toString();
                if(favoritos.includes(id)) {
                    el.classList.add('activo');
                    el.innerHTML = '♥';
                    el.title = "Quitar de favoritos";
                } else {
                    el.classList.remove('activo');
                    el.innerHTML = '♡';
                    el.title = "Añadir a favoritos";
                }
            });
        });
    }
}

document.addEventListener("DOMContentLoaded", function(){
    refrescarFavoritos();

    document.body.addEventListener('click', function(e){
        let el = e.target;
        if(el.classList.contains('corazon-favorito')){
            e.preventDefault();
            e.stopPropagation();

            // Si NO está logueado, muestra aviso y NO navega ni ejecuta AJAX
            if(typeof mapa_ajax_obj !== "undefined" && mapa_ajax_obj.usuario_logueado != '1'){
                mostrarMensajeMapa("Debes estar registrado para añadir favoritos.", true);
                return;
            }

            // Si está logueado, ejecuta la lógica AJAX normal
            let id = el.dataset.id;
            let accion = el.classList.contains('activo') ? 'desmarcar_favorito' : 'marcar_favorito';
            fetch(mapa_ajax_obj.ajaxurl, {
                method: "POST",
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: "action=" + accion + "&marcador_id=" + encodeURIComponent(id)
            })
            .then(r=>r.json())
            .then(res=>{
                if(res.success) refrescarFavoritos();
            });
        }
    });
});

// ========== LISTA DE MARCADORES POR PROVINCIA ==========
function cargarListaMarcadoresProvincia() {
    const contenedor = document.getElementById("marcadores-provincia-lista");
    if (!contenedor) return;
    if (!mapa_ajax_obj.provincia || !mapa_ajax_obj.provincia.trim()) {
        contenedor.innerHTML = "";
        return;
    }
    fetch(mapa_ajax_obj.ajaxurl + "?action=obtener_marcadores&provincia=" + encodeURIComponent(mapa_ajax_obj.provincia))
        .then(r => r.json())
        .then(data => {
            if (!data || !data.length) {
                contenedor.innerHTML = "";
                return;
            }
            let html = `<h3 style="margin:24px 0 10px 0;">Todos los anuncios en <span style="color:#176ab5">${capitalizeWords(mapa_ajax_obj.provincia)}</span></h3>`;
            html += "<ul style='list-style:none;padding:0;'>";
            data.forEach(m => {
                html += `<li style="margin-bottom:16px;border-bottom:1px solid #eee;padding-bottom:10px;">
                    <b style="color:#15418a">${m.categoria || "Sin categoría"}</b>
                    <span style="color:#444;"> — ${m.comentario ? m.comentario.substring(0, 80) : ""}</span>
                    <a href="${detalleUrl(m.id)}" style="margin-left:10px;color:#176ab5;text-decoration:underline;">Ver detalle</a>
                </li>`;
            });
            html += "</ul>";
            contenedor.innerHTML = html;
        });
}

// ========== ULTIMOS MARCADORES LISTA SEO & VISUAL ==========
function cargarUltimosMarcadores() {
    fetch(`${mapa_ajax_obj.ajaxurl}?action=ultimos_marcadores`)
        .then(r => r.json())
        .then(data => {
            const ul = document.getElementById("ultimos-marcadores");
            if (!ul) return;
            ul.innerHTML = "";
            if (!data || !data.length) return;

            let html = `<div class="mini-anuncios-provincia-milanuncios">
    <h2 class="mini-anuncios-provincia-title">
        <span>🕑</span> Últimos anuncios publicados
    </h2>
    <div class="mini-anuncios-cards">`;
            data.slice(0, 12).forEach(m => {
                const avatar = `<img src="${m.avatar_url ? m.avatar_url : 'https://postaldream.com/wp-content/uploads/2025/06/postaldrem_avatar.jpg'}" alt="Avatar" class="mini-anuncio-avatar">`;
                let precio = '';
                if (m.precio_alquiler && parseInt(m.precio_alquiler) > 0)
                    precio = `<div class="mini-anuncio-precio">${parseInt(m.precio_alquiler).toLocaleString()} €</div>`;
                else if (m.precio_compra && parseInt(m.precio_compra) > 0)
                    precio = `<div class="mini-anuncio-precio">${parseInt(m.precio_compra).toLocaleString()} €</div>`;
                else if (m.precio_alquiler_habitacion && parseInt(m.precio_alquiler_habitacion) > 0)
                    precio = `<div class="mini-anuncio-precio">${parseInt(m.precio_alquiler_habitacion).toLocaleString()} €</div>`;
                else if (m.precio_garaje && parseInt(m.precio_garaje) > 0)
                    precio = `<div class="mini-anuncio-precio">${parseInt(m.precio_garaje).toLocaleString()} €</div>`;

                let detalles = [];
                if (
                    (m.dormitorios_alquiler && parseInt(m.dormitorios_alquiler) > 0) ||
                    (m.dormitorios_compra && parseInt(m.dormitorios_compra) > 0)
                ) {
                    detalles.push(`<span>🛏️ ${
                        (m.dormitorios_alquiler && parseInt(m.dormitorios_alquiler) > 0)
                            ? m.dormitorios_alquiler
                            : m.dormitorios_compra
                    }</span>`);
                }
                if (
                    (m.banos_alquiler && parseInt(m.banos_alquiler) > 0) ||
                    (m.banos_compra && parseInt(m.banos_compra) > 0)
                ) {
                    detalles.push(`<span>🛁 ${
                        (m.banos_alquiler && parseInt(m.banos_alquiler) > 0)
                            ? m.banos_alquiler
                            : m.banos_compra
                    }</span>`);
                }
                if (
                    (m.metros_alquiler && parseInt(m.metros_alquiler) > 0) ||
                    (m.metros_compra && parseInt(m.metros_compra) > 0) ||
                    (m.metros_alquiler_habitacion && parseInt(m.metros_alquiler_habitacion) > 0)
                ) {
                    detalles.push(`<span>📏 ${
                        (m.metros_alquiler && parseInt(m.metros_alquiler) > 0)
                            ? m.metros_alquiler
                            : (m.metros_compra && parseInt(m.metros_compra) > 0)
                                ? m.metros_compra
                                : m.metros_alquiler_habitacion
                    } m²</span>`);
                }

                const comentario = m.comentario
                    ? m.comentario.substring(0, 80) + (m.comentario.length > 80 ? "..." : "")
                    : (m.categoria || "");

                html += `
                <a href="${mapa_ajax_obj.siteurl}/detalle-de-marcador/?id=${m.id}" class="mini-anuncio-card">
                  <span class="corazon-favorito" data-id="${m.id}" title="Añadir a favoritos">♡</span>
                  <div style="display:flex;flex-direction:column;align-items:center;gap:7px;">
                    ${avatar}
                    <button type="button" class="emoji-marcador" onclick="centrarEnMarcador(${m.id});event.stopPropagation();return false;">
                        <img src="${iconoMarcadorPorCategoria(m.categoria)}" alt="Ir a marcador" class="google-pin-icon">
                    </button>
                    <div style="width:100%">
                      <div class="mini-anuncio-titulo" style="font-size:1.07em;font-weight:600;margin-bottom:2px">
                        ${m.titulo ? m.titulo.replace(/</g, "&lt;") : ""}
                      </div>
                      ${precio}
                      <div class="mini-anuncio-ciudad">${m.provincia ? capitalizeWords(m.provincia) : ""}</div>
                      <div class="mini-anuncio-detalles">${detalles.join(" ")}</div>
                      <div class="mini-anuncio-comentario">${comentario.replace(/</g, "&lt;")}</div>
                    </div>
                  </div>
                </a>`;
            });
            html += `</div>
            </div>`;
            ul.innerHTML = html;
            refrescarFavoritos();
        });
}

// ========== SELECTOR DE PROVINCIA GLOBAL BAJO LOS MARCADORES ==========
function agregarSelectorProvinciaGlobal() {
    if (document.getElementById("selector-provincia-global")) return;
    const contenedor = document.createElement("div");
    contenedor.id = "selector-provincia-global";
    contenedor.style.margin = "35px 0 25px 0";
    contenedor.style.textAlign = "center";
    contenedor.innerHTML = `
      <label for="selector-provincia" style="font-weight:600;font-size:1.08em;margin-right:10px;">
        Ver anuncios de otra provincia:
      </label>
      <select id="selector-provincia" style="min-width:220px;padding:9px 7px;border-radius:7px;font-size:1em;border:1.3px solid #3ba1da;">
        <option value="">Selecciona provincia</option>
        <option value="alava">Álava</option>
        <option value="albacete">Albacete</option>
        <option value="alicante">Alicante</option>
        <option value="almeria">Almería</option>
        <option value="asturias">Asturias</option>
        <option value="avila">Ávila</option>
        <option value="badajoz">Badajoz</option>
        <option value="barcelona">Barcelona</option>
        <option value="burgos">Burgos</option>
        <option value="caceres">Cáceres</option>
        <option value="cadiz">Cádiz</option>
        <option value="cantabria">Cantabria</option>
        <option value="castellon">Castellón</option>
        <option value="ciudad-real">Ciudad Real</option>
        <option value="cordoba">Córdoba</option>
        <option value="a-coruna">A Coruña</option>
        <option value="cuenca">Cuenca</option>
        <option value="girona">Girona</option>
        <option value="granada">Granada</option>
        <option value="guadalajara">Guadalajara</option>
        <option value="guipuzcoa">Guipúzcoa</option>
        <option value="huelva">Huelva</option>
        <option value="huesca">Huesca</option>
        <option value="illes-balears">Illes Balears</option>
        <option value="jaen">Jaén</option>
        <option value="leon">León</option>
        <option value="lleida">Lleida</option>
        <option value="lugo">Lugo</option>
        <option value="madrid">Madrid</option>
        <option value="malaga">Málaga</option>
        <option value="murcia">Murcia</option>
        <option value="navarra">Navarra</option>
        <option value="ourense">Ourense</option>
        <option value="palencia">Palencia</option>
        <option value="las-palmas">Las Palmas</option>
        <option value="pontevedra">Pontevedra</option>
        <option value="la-rioja">La Rioja</option>
        <option value="salamanca">Salamanca</option>
        <option value="santa-cruz-de-tenerife">Santa Cruz de Tenerife</option>
        <option value="segovia">Segovia</option>
        <option value="sevilla">Sevilla</option>
        <option value="soria">Soria</option>
        <option value="tarragona">Tarragona</option>
        <option value="teruel">Teruel</option>
        <option value="toledo">Toledo</option>
        <option value="valencia">Valencia</option>
        <option value="valladolid">Valladolid</option>
        <option value="vizcaya">Vizcaya</option>
        <option value="zamora">Zamora</option>
        <option value="zaragoza">Zaragoza</option>
        <option value="ceuta">Ceuta</option>
        <option value="melilla">Melilla</option>
      </select>
    `;

    // 1. Si existe ultimos-marcadores-seo (home), lo pone debajo como antes
    const ultimosMarcadores = document.getElementById("ultimos-marcadores-seo");
    if (ultimosMarcadores && ultimosMarcadores.parentNode) {
        ultimosMarcadores.parentNode.insertBefore(contenedor, ultimosMarcadores.nextSibling);
    } else {
        // 2. Si estamos en provincias o detalle de marcador, lo ponemos al final de .bloque-central si existe
        const central = document.querySelector(".bloque-central");
        if (central) {
            central.appendChild(contenedor);
        } else {
            // 3. Como último recurso, lo añadimos al final del body
            document.body.appendChild(contenedor);
        }
    }

    setTimeout(function() {
        const selector = document.getElementById("selector-provincia");
        if (selector) {
            selector.addEventListener("change", function(){
                var slug = this.value;
                if(slug){
                    window.location.href = "/provincias/" + slug + "/";
                }
            });
            var path = window.location.pathname;
            var match = path.match(/\/provincias\/([^\/]+)/);
            if(match && match[1]){
                selector.value = match[1];
            }
        }
    }, 50);
}
document.addEventListener("DOMContentLoaded", function () {
    // Tu lógica inicial
    setTimeout(function() {
      if (typeof agregarSelectorProvinciaGlobal === "function") {
        agregarSelectorProvinciaGlobal();
      }
      if (typeof cargarListaMarcadoresProvincia === "function") {
        cargarListaMarcadoresProvincia();
      }
    }, 1500);

    var searchInput = document.getElementById('map-search');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(e){
            if(e.key === 'Enter'){
                e.preventDefault();
                var valor = this.value.trim();
                if(valor){
                    window.location.href = '/buscar/' + encodeURIComponent(valor) + '/';
                }
            }
        });
    }

    var catSelector = document.getElementById("categoria-selector");
    if (catSelector) {
        function mostrarFiltrosSegunCategoria() {
            var cat = catSelector.value;
            const fc = document.getElementById("filtro-compra");
            const fa = document.getElementById("filtro-alquiler");
            const fcomp = document.getElementById("filtro-compartir");
            const fgaraje = document.getElementById("filtro-garaje");
            const detalles = document.getElementById("comentarios-group");
            const titulo = document.getElementById("titulo-group");

            // Oculta todo
            if (fc) fc.style.display = "none";
            if (fa) fa.style.display = "none";
            if (fcomp) fcomp.style.display = "none";
            if (fgaraje) fgaraje.style.display = "none";
            if (detalles) detalles.style.display = "none";
            if (titulo) titulo.style.display = "none";

            // Según la categoría, muestra lo que toca
            if (cat === "Desean comprar vivienda" && fc) {
                fc.style.display = "block";
                if (detalles) detalles.style.display = "block";
                if (titulo) titulo.style.display = "block";
            }
            if (cat === "Desean alquilar vivienda" && fa) {
                fa.style.display = "block";
                if (detalles) detalles.style.display = "block";
                if (titulo) titulo.style.display = "block";
            }
            if (cat === "Desean alquilar habitacion" && fcomp) {
                fcomp.style.display = "block";
                if (detalles) detalles.style.display = "block";
                if (titulo) titulo.style.display = "block";
            }
            if (
                (cat === "Desean alquilar plaza de garaje" || cat === "Desean comprar plaza de garaje") &&
                fgaraje
            ) {
                fgaraje.style.display = "block";
                if (detalles) detalles.style.display = "block";
                if (titulo) titulo.style.display = "block";
            }
        }
        catSelector.addEventListener("change", function() {
            if (typeof mapa_ajax_obj !== "undefined" && mapa_ajax_obj.usuario_logueado !== "1") {
                window.location.href = mapa_ajax_obj.login_url + "?redirect_to=" + encodeURIComponent(window.location.href);
                return;
            }
            mostrarFiltrosSegunCategoria();
        });
        // Al arrancar la página: TODO oculto
        mostrarFiltrosSegunCategoria();
    }

    if (typeof mapa_ajax_obj !== "undefined" && mapa_ajax_obj.provincia && mapa_ajax_obj.provincia.trim() !== "") {
        var provinciaSelector = document.getElementById("provincia-selector");
        if (provinciaSelector) {
            provinciaSelector.value = mapa_ajax_obj.provincia;
            if (provinciaSelector.parentNode) provinciaSelector.parentNode.style.display = "none";
        }
    }

   if (typeof mapa_ajax_obj !== "undefined" && mapa_ajax_obj.modo === "estatico") {
    var form = document.getElementById("formulario-marcador");
    if (form) form.style.display = "none";
    var btn = document.getElementById("mostrar-formulario-btn");

    // CREA Y MUESTRA SIEMPRE EL SELECT AL CARGAR
    if (!document.getElementById("form-provincia-home")) {
        var div = document.createElement("div");
        div.id = "form-provincia-home";
        div.style.background = "#fff";
        div.style.border = "1.5px solid #3ba1da";
        div.style.padding = "22px 18px";
        div.style.borderRadius = "8px";
        div.style.boxShadow = "0 8px 48px rgba(0,0,0,0.12)";
        div.style.textAlign = "center";
        div.style.maxWidth = "350px";
        div.style.margin = "18px auto";
        div.innerHTML = `
          <label style="font-weight:700;font-size:1.08em;display:block;margin-bottom:10px;">
            Elige la provincia donde buscas vivienda o parking:
          </label>
          <select id="selector-provincia-home" style="width:90%;padding:10px 6px;border-radius:6px;font-size:1em;border:1.5px solid #3ba1da;">
            <option value="">Selecciona provincia</option>
            <option value="alava">Álava</option>
            <option value="albacete">Albacete</option>
            <option value="alicante">Alicante</option>
            <option value="almeria">Almería</option>
            <option value="asturias">Asturias</option>
            <option value="avila">Ávila</option>
            <option value="badajoz">Badajoz</option>
            <option value="barcelona">Barcelona</option>
            <option value="burgos">Burgos</option>
            <option value="caceres">Cáceres</option>
            <option value="cadiz">Cádiz</option>
            <option value="cantabria">Cantabria</option>
            <option value="castellon">Castellón</option>
            <option value="ciudad-real">Ciudad Real</option>
            <option value="cordoba">Córdoba</option>
            <option value="a-coruna">A Coruña</option>
            <option value="cuenca">Cuenca</option>
            <option value="girona">Girona</option>
            <option value="granada">Granada</option>
            <option value="guadalajara">Guadalajara</option>
            <option value="guipuzcoa">Guipúzcoa</option>
            <option value="huelva">Huelva</option>
            <option value="huesca">Huesca</option>
            <option value="illes-balears">Illes Balears</option>
            <option value="jaen">Jaén</option>
            <option value="leon">León</option>
            <option value="lleida">Lleida</option>
            <option value="lugo">Lugo</option>
            <option value="madrid">Madrid</option>
            <option value="malaga">Málaga</option>
            <option value="murcia">Murcia</option>
            <option value="navarra">Navarra</option>
            <option value="ourense">Ourense</option>
            <option value="palencia">Palencia</option>
            <option value="las-palmas">Las Palmas</option>
            <option value="pontevedra">Pontevedra</option>
            <option value="la-rioja">La Rioja</option>
            <option value="salamanca">Salamanca</option>
            <option value="santa-cruz-de-tenerife">Santa Cruz de Tenerife</option>
            <option value="segovia">Segovia</option>
            <option value="sevilla">Sevilla</option>
            <option value="soria">Soria</option>
            <option value="tarragona">Tarragona</option>
            <option value="teruel">Teruel</option>
            <option value="toledo">Toledo</option>
            <option value="valencia">Valencia</option>
            <option value="valladolid">Valladolid</option>
            <option value="vizcaya">Vizcaya</option>
            <option value="zamora">Zamora</option>
            <option value="zaragoza">Zaragoza</option>
            <option value="ceuta">Ceuta</option>
            <option value="melilla">Melilla</option>
          </select>
          <br><br>
          <button id="btn-ir-provincia-home" style="background:linear-gradient(90deg,#3ba1da 0%,#15418a 100%);color:#fff;padding:10px 23px;border-radius:7px;border:none;font-size:1.11em;font-weight:600;cursor:pointer;">
            Continuar
          </button>
        `;
        if (btn && btn.parentNode) {
            btn.parentNode.insertBefore(div, btn.nextSibling);
        } else {
            document.body.appendChild(div);
        }
        div.querySelector("#btn-ir-provincia-home").onclick = function () {
          var slug = div.querySelector("#selector-provincia-home").value;
          if (!slug) {
            alert("Por favor, selecciona una provincia.");
            return;
          }
          window.location.href = "/provincias/" + slug;
        };
    }
}

    const guardarBtn = document.getElementById("guardar-marcador-btn");
    if (guardarBtn) {
        guardarBtn.addEventListener("click", function (e) {
            e.preventDefault();
            if (typeof guardarMarcador === "function") {
                guardarMarcador();
            }
        });
    }

    // ======= BLOQUE CORRECTO PARA MOSTRAR Y FILTRAR ANUNCIOS =======
    // Usando window.mapaCategorias y window.marcadores que inyecta el PHP
    var botonesDiv = document.getElementById("categoria-botones");
    if (botonesDiv && typeof window.mapaCategorias !== "undefined") {
        if (window.mapaCategorias.length > 1) {
            botonesDiv.innerHTML = '<button class="categoria-btn" data-categoria="" style="background: #eee; margin-right:8px;">Todas</button>';
            window.mapaCategorias.forEach(cat => {
                botonesDiv.innerHTML += `<button class="categoria-btn" data-categoria="${cat.slug}" style="background:${cat.color};margin-right:8px;">${cat.nombre}</button>`;
            });
            botonesDiv.addEventListener("click", function(e) {
                if (e.target.classList.contains("categoria-btn")) {
                    var slug = e.target.getAttribute("data-categoria");
                    var categoria = window.mapaCategorias.find(cat => cat.slug === slug);
                    var marcadoresFiltrados = categoria
                        ? window.marcadores.filter(m => m.categoria_id == categoria.id)
                        : window.marcadores;
                    pintarMarcadores(marcadoresFiltrados);
                }
            });
        } else {
            botonesDiv.style.display = 'none'; // Si solo hay una categoría no muestra botones
        }
    }

    // Función para pintar los anuncios/marcadores
    function pintarMarcadores(marcadores) {
        var contenedor = document.getElementById("mapa-interactivo");
        if (!contenedor) return;
        contenedor.innerHTML = "";
        marcadores.forEach(m => {
            contenedor.innerHTML += `<div style="border:1px solid #ccc;margin:8px;padding:8px;">
                <strong>${m.titulo || "Sin título"}</strong><br>
                Categoría: ${window.mapaCategorias.find(cat => cat.id == m.categoria_id)?.nombre || "Sin categoría"}
            </div>`;
        });
    }

    // Al cargar, pinta todos los anuncios filtrados (el PHP ya los filtra si toca)
    if (typeof window.marcadores !== "undefined") pintarMarcadores(window.marcadores);
});
// =========== FIN DE MAPA.JS ===========