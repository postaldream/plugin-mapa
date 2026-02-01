document.addEventListener("DOMContentLoaded", function() {
    const cont = document.getElementById("mis-anuncios-mini");
    if (!cont) return;

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

    function campoNumero(label, id, value, min = 0) {
        return `
        <div class="pd-form-group">
            <label class="pd-label" for="${id}">${label}</label>
            <input type="number" id="${id}" class="pd-input" value="${value ?? ''}" min="${min}">
        </div>`;
    }
    function campoTexto(label, id, value, maxlength = 40) {
        return `
        <div class="pd-form-group">
            <label class="pd-label" for="${id}">${label}</label>
            <input type="text" id="${id}" class="pd-input" value="${value ?? ''}" maxlength="${maxlength}">
        </div>`;
    }
    function campoTextarea(label, id, value) {
        return `
        <div class="pd-form-group">
            <label class="pd-label" for="${id}">${label}</label>
            <textarea id="${id}" class="pd-input" rows="3">${value ?? ''}</textarea>
        </div>`;
    }
    function campoSelect(label, id, value, opciones) {
        return `
        <div class="pd-form-group">
            <label class="pd-label" for="${id}">${label}</label>
            <select id="${id}" class="pd-input">
                ${opciones.map(opt => `<option value="${opt.value}" ${String(opt.value) === String(value) ? "selected" : ""}>${opt.label}</option>`).join('')}
            </select>
        </div>`;
    }

    // Select de categoría (AGREGADO garaje)
    function campoCategoriaSelect(value) {
        return `
        <div class="pd-form-group">
            <label class="pd-label" for="editar-categoria">Categoría</label>
            <select id="editar-categoria" class="pd-input">
                <option value="Desean comprar vivienda" ${value === "Desean comprar vivienda" ? "selected" : ""}>Desean comprar vivienda</option>
                <option value="Desean alquilar vivienda" ${value === "Desean alquilar vivienda" ? "selected" : ""}>Desean alquilar vivienda</option>
                <option value="Desean alquilar habitacion" ${value === "Desean alquilar habitacion" ? "selected" : ""}>Desean alquilar habitación</option>
                <option value="Desean alquilar plaza de garaje" ${value === "Desean alquilar plaza de garaje" ? "selected" : ""}>Desean alquilar plaza de garaje</option>
                <option value="Desean comprar plaza de garaje" ${value === "Desean comprar plaza de garaje" ? "selected" : ""}>Desean comprar plaza de garaje</option>
            </select>
        </div>`;
    }

    // Generador de campos dinámico según categoría (AGREGADO garaje)
    function generarCamposPorCategoria(cat, m) {
        let html = '';
        html += campoCategoriaSelect(cat);
        html += campoTexto("Título", "editar-titulo", m.titulo, 40);
        html += campoTextarea("Comentario", "editar-comentario", m.comentario);

        if (cat === "Desean comprar vivienda") {
            html += campoNumero("Precio máx. (€)", "editar-precio_compra", m.precio_compra);
            html += campoNumero("Metros mínimos", "editar-metros_compra", m.metros_compra);
            html += campoNumero("Dormitorios", "editar-dormitorios_compra", m.dormitorios_compra);
            html += campoNumero("Baños", "editar-banos_compra", m.banos_compra);
        } else if (cat === "Desean alquilar vivienda") {
            html += campoNumero("Precio máx. (€)", "editar-precio_alquiler", m.precio_alquiler);
            html += campoNumero("Metros mínimos", "editar-metros_alquiler", m.metros_alquiler);
            html += campoNumero("Dormitorios", "editar-dormitorios_alquiler", m.dormitorios_alquiler);
            html += campoNumero("Baños", "editar-banos_alquiler", m.banos_alquiler);
            html += campoSelect("Expectativas", "editar-expectativas", m.expectativas, [
                {value: "", label: "Selecciona una opción"},
                {value: "corta", label: "Corta estancia (hasta 6 meses)"},
                {value: "media", label: "Media estancia (6-12 meses)"},
                {value: "larga", label: "Larga estancia (más de 1 año)"}
            ]);
        } else if (cat === "Desean alquilar habitacion") {
            html += campoNumero("Precio máx. (€)", "editar-precio_alquiler_habitacion", m.precio_alquiler_habitacion);
            html += campoNumero("Metros mínimos", "editar-metros_alquiler_habitacion", m.metros_alquiler_habitacion);
            html += campoSelect("¿Mascotas?", "editar-mascotas", m.mascotas, [
                {value: "-1", label: "No especifica"},
                {value: "1", label: "Sí"},
                {value: "0", label: "No"}
            ]);
            html += campoSelect("¿Fumador?", "editar-fumador", m.fumador, [
                {value: "-1", label: "No especifica"},
                {value: "1", label: "Sí"},
                {value: "0", label: "No"}
            ]);
            html += campoNumero("Edad", "editar-edad", m.edad);
            html += campoSelect("¿Trabaja?", "editar-trabajo", m.trabajo, [
                {value: "-1", label: "No especifica"},
                {value: "1", label: "Sí"},
                {value: "0", label: "No"}
            ]);
            html += campoSelect("¿Pareja?", "editar-pareja", m.pareja, [
                {value: "-1", label: "No especifica"},
                {value: "1", label: "Sí"},
                {value: "0", label: "No"}
            ]);
            html += campoSelect("¿Contrato alquiler?", "editar-contrato_alquiler", m.contrato_alquiler, [
                {value: "-1", label: "No especifica"},
                {value: "1", label: "Sí"},
                {value: "0", label: "No"}
            ]);
            html += campoSelect("Expectativas", "editar-expectativas", m.expectativas, [
                {value: "", label: "Selecciona una opción"},
                {value: "corta", label: "Corta estancia (hasta 6 meses)"},
                {value: "media", label: "Media estancia (6-12 meses)"},
                {value: "larga", label: "Larga estancia (más de 1 año)"}
            ]);
        } else if (cat === "Desean alquilar plaza de garaje" || cat === "Desean comprar plaza de garaje") {
            html += campoNumero("Precio plaza de garaje (€)", "editar-precio_garaje", m.precio_garaje);
        }
        return html;
    }

    function capitalizarProvincia(provincia) {
        return provincia
            ? provincia.replace(/\b\w/g, l => l.toUpperCase())
            : "";
    }

    function cargarMisAnuncios() {
        fetch('/wp-admin/admin-ajax.php?action=obtener_mis_marcadores')
        .then(r => r.json())
        .then(anuncios => {
            if (!anuncios.length) {
                cont.innerHTML = "<p>No tienes anuncios publicados.</p>";
                return;
            }
            let html = `<div class="mini-anuncios-provincia-milanuncios">
                <div class="mini-anuncios-provincia-title"><span>📍</span> Mis anuncios</div>
                <div class="mini-anuncios-cards">`;
            anuncios.forEach(m => {
                // Detalles rápidos
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

                html += `<div class="mini-anuncio-card" data-id="${m.id}" data-anuncio='${JSON.stringify(m)}' style="cursor:pointer;">
                    <div style="display:flex;flex-direction:column;align-items:center;gap:7px;">
                        <img src="${m.avatar_url || 'https://postaldream.com/wp-content/uploads/2025/06/postaldrem_avatar.jpg'}" alt="Avatar" class="mini-anuncio-avatar">
                        <button class="ir-a-mapa-btn" data-provincia="${m.provincia_slug}" data-id="${m.id}" style="background:none;border:none;padding:0;cursor:pointer;">
                          <img src="${iconoMarcadorPorCategoria(m.categoria)}" alt="Ir a marcador" class="google-pin-icon">
                        </button>
                        <div style="width:100%">
                            <div class="mini-anuncio-titulo" style="font-size:1.07em;font-weight:600;margin-bottom:2px">
                              ${m.titulo ? m.titulo.replace(/</g,"&lt;") : ""}
                            </div>
                            <div class="mini-anuncio-precio">
                                ${m.precio_alquiler && m.precio_alquiler > 0 ? m.precio_alquiler + " €" : ""}
                                ${m.precio_compra && m.precio_compra > 0 ? m.precio_compra + " €" : ""}
                                ${m.precio_alquiler_habitacion && m.precio_alquiler_habitacion > 0 ? m.precio_alquiler_habitacion + " €" : ""}
                                ${m.precio_garaje && m.precio_garaje > 0 ? m.precio_garaje + " €" : ""}
                            </div>
                            <div class="mini-anuncio-ciudad">${capitalizarProvincia(m.provincia)}</div>
                            <div class="mini-anuncio-detalles">${detalles.join(" ")}</div>
                            <div class="mini-anuncio-comentario">
                                ${m.comentario ? m.comentario.substring(0, 80) + (m.comentario.length > 80 ? "..." : "") : ""}
                            </div>
                            <div style="margin-top:10px;display:flex;gap:8px;">
                                <button class="editar-anuncio-btn" data-id="${m.id}">Editar</button>
                                <button class="eliminar-anuncio-btn" data-id="${m.id}">Eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            });
            html += `</div></div>`;

            // Modal para edición (solo uno en el DOM)
            html += `
            <div id="modal-editar-anuncio" class="pd-modal" style="display:none;">
                <div class="pd-modal-content">
                    <span class="pd-modal-close" id="cerrar-modal-editar">&times;</span>
                    <h2>Editar anuncio</h2>
                    <form id="form-editar-anuncio">
                        <input type="hidden" id="editar-id-anuncio">
                        <div id="campos-editar-anuncio"></div>
                        <div style="text-align:right;margin-top:15px;">
                            <button type="submit" class="pd-btn-primary">Guardar cambios</button>
                        </div>
                    </form>
                </div>
            </div>
            `;

            cont.innerHTML = html;

            // Navegación al mapa desde el pin
            document.querySelectorAll('.ir-a-mapa-btn').forEach(btn => {
              btn.addEventListener('click', function(e) {
                e.stopPropagation(); // evita que el click se propague a la tarjeta
                const provincia = btn.getAttribute('data-provincia');
                const id = btn.getAttribute('data-id');
                window.location.href = `/provincias/${provincia}/?focus=${id}`;
              });
            });

            // Hacer clicable toda la tarjeta, menos el pin o los botones de editar/eliminar
            document.querySelectorAll('.mini-anuncio-card').forEach(card => {
              card.addEventListener('click', function(e) {
                // Si el click es en el pin o dentro del botón de pin, NO hacemos nada
                if (e.target.closest('.ir-a-mapa-btn')) return;
                // Si el click es en el botón editar/eliminar, tampoco
                if (e.target.closest('.editar-anuncio-btn') || e.target.closest('.eliminar-anuncio-btn')) return;
                // Ir al detalle
                const id = card.getAttribute('data-id');
                window.location.href = `/detalle-de-marcador/?id=${id}`;
              });
            });

            // Eliminar anuncio
            document.querySelectorAll(".eliminar-anuncio-btn").forEach(btn => {
                btn.onclick = function(e) {
                    e.stopPropagation();
                    if (!confirm("¿Seguro que deseas eliminar este anuncio?")) return;
                    fetch('/wp-admin/admin-ajax.php', {
                        method: "POST",
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        body: new URLSearchParams({ action: "eliminar_marcador", id: btn.dataset.id })
                    })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) {
                            cargarMisAnuncios();
                        } else {
                            alert("No se pudo eliminar");
                        }
                    });
                }
            });

            // Editar anuncio
            document.querySelectorAll(".editar-anuncio-btn").forEach(btn => {
                btn.onclick = function(e) {
                    e.stopPropagation();
                    let card = btn.closest('.mini-anuncio-card');
                    let m = JSON.parse(card.dataset.anuncio);
                    document.getElementById("editar-id-anuncio").value = m.id;
                    // Inicialmente, categoría del anuncio original
                    let categoriaActual = m.categoria;
                    // Renderiza los campos según la categoría actual
                    function renderizarCampos() {
                        document.getElementById("campos-editar-anuncio").innerHTML = generarCamposPorCategoria(categoriaActual, m);
                        // Añade el listener al select para detectar cambios
                        document.getElementById("editar-categoria").addEventListener("change", function() {
                            categoriaActual = this.value;
                            renderizarCampos();
                        });
                    }
                    renderizarCampos();
                    document.getElementById("modal-editar-anuncio").style.display = 'block';
                }
            });

            // Modal cerrar
            setTimeout(() => {
                const cerrarBtn = document.getElementById("cerrar-modal-editar");
                if (cerrarBtn) cerrarBtn.onclick = function() {
                    document.getElementById("modal-editar-anuncio").style.display = 'none';
                };
            }, 300);

            // Guardar edición
            setTimeout(() => {
                const form = document.getElementById("form-editar-anuncio");
                if (form) form.onsubmit = function(e) {
                    e.preventDefault();
                    const id = document.getElementById("editar-id-anuncio").value;
                    const campos = form.querySelectorAll("input, textarea, select");
                    let data = {
                        action: "editar_marcador",
                        id: id
                    };
                    campos.forEach(campo => {
                        if (campo.type === "hidden" || !campo.id.startsWith("editar-")) return;
                        let nombre = campo.id.replace("editar-", "");
                        data[nombre] = campo.value;
                    });

                    fetch('/wp-admin/admin-ajax.php', {
                        method: "POST",
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        body: new URLSearchParams(data)
                    })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) {
                            document.getElementById("modal-editar-anuncio").style.display = 'none';
                            cargarMisAnuncios();
                        } else {
                            alert("No se pudo actualizar");
                        }
                    });
                };
            }, 300);
        });
    }

    cargarMisAnuncios();
});