# ✅ Checklist de Implementación y Verificación

## Pre-Implementación

- [ ] He leído la `GUIA_IMPLEMENTACION.md`
- [ ] He leído los `CAMBIOS_DETALLADOS.md`
- [ ] Tengo acceso al servidor donde está WordPress
- [ ] He decidido qué método de implementación usar:
  - [ ] Opción 1: Merge via Pull Request en GitHub
  - [ ] Opción 2: Descarga manual del archivo
  - [ ] Opción 3: Edición manual del código

---

## Durante la Implementación

### Si usas la Opción 1 (Pull Request):
- [ ] He abierto GitHub en mi navegador
- [ ] He encontrado el Pull Request o rama `copilot/move-bars-to-province-pages`
- [ ] He revisado los cambios en "Files changed"
- [ ] He hecho click en "Merge pull request"
- [ ] He confirmado el merge
- [ ] Me he conectado al servidor por SSH
- [ ] He navegado al directorio del plugin
- [ ] He ejecutado `git pull origin main` (o `master`)
- [ ] El pull se completó sin errores

### Si usas la Opción 2 (Descarga Manual):
- [ ] He descargado el archivo desde GitHub
- [ ] He creado un respaldo del archivo original:
  - [ ] `cp mapa-interactivo.php mapa-interactivo.php.backup`
- [ ] He subido el nuevo archivo al servidor
- [ ] He verificado que el archivo se subió correctamente

### Si usas la Opción 3 (Edición Manual):
- [ ] He creado un respaldo del archivo original
- [ ] He abierto `mapa-interactivo.php` en mi editor
- [ ] He localizado la línea ~176 con `<?php if (!$is_provincia): ?>`
- [ ] He eliminado TODO el bloque desde línea 176 hasta 200 (incluyendo el `<?php endif; ?>`)
- [ ] He localizado la línea ~205 con `<?php if ($is_provincia): ?>`
- [ ] He añadido las barras justo después de esa línea
- [ ] He guardado el archivo
- [ ] He verificado que no hay errores de sintaxis: `php -l mapa-interactivo.php`

---

## Post-Implementación - Verificación Técnica

- [ ] El archivo `mapa-interactivo.php` no tiene errores de sintaxis PHP
- [ ] He limpiado la caché de WordPress:
  - [ ] W3 Total Cache
  - [ ] WP Super Cache
  - [ ] LiteSpeed Cache
  - [ ] Otro plugin de caché: _______________
- [ ] He limpiado la caché del servidor (si aplica)
- [ ] No hay errores en el log de PHP: `wp-content/debug.log`
- [ ] El sitio web sigue funcionando (no hay pantalla blanca)

---

## Verificación Visual - Página Principal

### Accede a tu página principal (home) donde está el mapa

- [ ] La página carga correctamente
- [ ] El mapa se muestra correctamente
- [ ] **NO se muestran** las barras de categorías
- [ ] **NO se muestra** el mensaje "¿Buscas vivienda o plaza de garaje?"
- [ ] **NO se muestran** los botones: "Todas", "Desean compartir piso", etc.
- [ ] **NO se muestra** el campo de búsqueda "Busca una dirección o lugar..."
- [ ] **NO se muestra** el selector de categorías (dropdown)
- [ ] El resto de la página funciona normalmente

### Toma nota:
- URL probada: ___________________________________
- Fecha/hora: ___________________________________
- Navegador: ___________________________________

---

## Verificación Visual - Páginas de Provincias

### Accede a UNA página de provincia (ejemplo: /provincia/madrid)

- [ ] La página carga correctamente
- [ ] El mapa se muestra correctamente
- [ ] **SÍ se muestra** el mensaje CTA "¿Buscas vivienda o plaza de garaje?"
- [ ] **SÍ se muestran** los botones de categorías:
  - [ ] Botón "Todas"
  - [ ] Link "Desean compartir piso"
  - [ ] Link "Desean alquilar vivienda"
  - [ ] Link "Desean comprar vivienda"
  - [ ] Link "Desean alquilar plaza de garaje"
  - [ ] Link "Desean comprar plaza de garaje"
- [ ] **SÍ se muestra** el campo de búsqueda "Busca una dirección o lugar..."
- [ ] **SÍ se muestra** el selector de categorías (dropdown)
- [ ] El formulario de publicación de anuncios funciona

### Toma nota:
- URL probada: ___________________________________
- Fecha/hora: ___________________________________
- Navegador: ___________________________________

---

## Verificación Funcional

### En una página de provincia:

- [ ] Los botones de categorías son clicables
- [ ] El campo de búsqueda acepta texto
- [ ] El campo de búsqueda funciona al buscar una dirección
- [ ] El selector de categorías se puede abrir
- [ ] El selector de categorías filtra correctamente al seleccionar una opción
- [ ] Los marcadores en el mapa responden a los filtros
- [ ] El formulario de publicación sigue funcionando
- [ ] Puedo hacer clic en el mapa para añadir marcadores

---

## Pruebas en Diferentes Navegadores

- [ ] **Chrome/Chromium:** Todo funciona correctamente
- [ ] **Firefox:** Todo funciona correctamente
- [ ] **Safari:** Todo funciona correctamente
- [ ] **Edge:** Todo funciona correctamente
- [ ] **Móvil (Chrome):** Todo funciona correctamente
- [ ] **Móvil (Safari):** Todo funciona correctamente

---

## Pruebas en Diferentes Provincias

Verifica al menos 3 páginas de provincias diferentes:

1. Provincia: _______________ ✅ / ❌
2. Provincia: _______________ ✅ / ❌
3. Provincia: _______________ ✅ / ❌

---

## Rollback (Solo si hay problemas)

Si algo sale mal, marca estos pasos:

- [ ] He identificado el problema: ___________________________________
- [ ] He restaurado el respaldo:
  ```bash
  cp mapa-interactivo.php.backup mapa-interactivo.php
  ```
- [ ] He limpiado la caché nuevamente
- [ ] La página vuelve a funcionar como antes
- [ ] He documentado el error para reportarlo

---

## Confirmación Final

- [ ] ✅ Página principal: Sin barras (correcto)
- [ ] ✅ Páginas de provincias: Con barras (correcto)
- [ ] ✅ Todas las funcionalidades siguen operando
- [ ] ✅ No hay errores en la consola del navegador (F12)
- [ ] ✅ No hay errores en los logs de PHP
- [ ] ✅ El rendimiento del sitio es normal
- [ ] ✅ Los usuarios pueden publicar anuncios normalmente

---

## Registro de Implementación

**Implementado por:** ___________________________________  
**Fecha:** ___________________________________  
**Hora:** ___________________________________  
**Método usado:** ___________________________________  
**Problemas encontrados:** ___________________________________  
**Tiempo total:** ___________________________________  
**Estado:** ✅ Exitoso / ❌ Requiere revisión

---

## Notas Adicionales

___________________________________
___________________________________
___________________________________
___________________________________
___________________________________

---

## Contacto y Soporte

Si completaste todos los checks ✅ : **¡Felicitaciones! Implementación exitosa.**

Si tienes checks ❌ o problemas:
1. Revisa el respaldo está disponible
2. Consulta `GUIA_IMPLEMENTACION.md` sección "Solución de Problemas"
3. Revisa los logs de errores
4. Considera restaurar el respaldo y reintentar

---

**Versión del checklist:** 1.0  
**Fecha de creación:** 2 de febrero de 2026  
**Repository:** postaldream/plugin-mapa
