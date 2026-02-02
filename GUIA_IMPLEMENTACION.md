# 📋 Guía de Implementación - Mover Barras a Páginas de Provincias

## ✅ Cambio Realizado

Se movieron las barras de categorías y buscadores desde la página principal hacia las páginas de provincias en el archivo `mapa-interactivo.php`.

**Archivo modificado:** `mapa-interactivo.php`
**Líneas afectadas:** 4 líneas añadidas, 7 líneas eliminadas

---

## 🚀 Métodos de Implementación

### **Opción 1: Merge mediante Pull Request en GitHub (Recomendado)**

Esta es la forma más segura y profesional:

1. **Abre tu navegador y ve a:**
   ```
   https://github.com/postaldream/plugin-mapa/pulls
   ```

2. **Busca el Pull Request:**
   - Verás un PR llamado "Move category bars and search filters from main page to province pages"
   - O puede estar listado como rama: `copilot/move-bars-to-province-pages`

3. **Revisa los cambios:**
   - Haz clic en "Files changed"
   - Verás exactamente qué líneas se modificaron
   - Son solo 11 líneas en total (muy seguro)

4. **Aprueba y haz Merge:**
   - Haz clic en el botón verde "Merge pull request"
   - Confirma el merge
   - Elimina la rama si lo deseas (opcional)

5. **Actualiza tu servidor WordPress:**
   ```bash
   # Conéctate a tu servidor por SSH
   ssh tu-usuario@tu-servidor.com
   
   # Ve a la carpeta del plugin
   cd /ruta/a/wordpress/wp-content/plugins/plugin-mapa
   
   # Actualiza desde GitHub
   git pull origin main
   # o si tu rama principal es master:
   git pull origin master
   ```

---

### **Opción 2: Descarga Manual del Archivo**

Si no tienes acceso SSH o prefieres FTP:

1. **Descarga el archivo actualizado:**
   - Ve a: https://github.com/postaldream/plugin-mapa/blob/copilot/move-bars-to-province-pages/mapa-interactivo.php
   - Haz clic en el botón "Raw" (arriba a la derecha)
   - Guarda el archivo (Ctrl+S o Cmd+S)

2. **Haz respaldo del archivo original:**
   ```bash
   # En tu servidor, crea un respaldo
   cp mapa-interactivo.php mapa-interactivo.php.backup
   ```

3. **Sube el nuevo archivo:**
   - Usa FileZilla, cPanel, o tu cliente FTP favorito
   - Reemplaza: `wp-content/plugins/plugin-mapa/mapa-interactivo.php`

---

### **Opción 3: Edición Manual (Si prefieres editar tú mismo)**

Si quieres hacer el cambio manualmente:

#### **Paso 1: Abre el archivo**
Edita: `wp-content/plugins/plugin-mapa/mapa-interactivo.php`

#### **Paso 2: Busca y elimina (alrededor de la línea 176)**
Busca este bloque y elimínalo:
```php
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
```

#### **Paso 3: Busca el bloque de provincias (alrededor de la línea 205)**
Busca esta línea:
```php
<?php if ($is_provincia): ?>
```

#### **Paso 4: Añade justo después de esa línea**
Inserta este código:
```php
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
```

#### **Paso 5: Guarda el archivo**

---

## ✅ Verificación Post-Implementación

Después de implementar, verifica que todo funcione:

### **1. Prueba la Página Principal**
- Ve a tu página principal donde está el mapa
- **Deberías ver:** Solo el mapa, SIN las barras de categorías
- **No deberías ver:** Los botones de "Todas", "Desean compartir piso", etc.

### **2. Prueba una Página de Provincia**
- Ve a cualquier página de provincia (ej: /provincia/madrid)
- **Deberías ver:** 
  - ✅ El mensaje CTA "¿Buscas vivienda o plaza de garaje?"
  - ✅ Los botones de categorías
  - ✅ El buscador con el input de búsqueda
  - ✅ El selector de categorías

### **3. Verifica Funcionalidad**
- Los botones de categorías deben ser clicables
- El buscador debe funcionar correctamente
- El selector de categorías debe filtrar

---

## 🐛 Solución de Problemas

### **Problema: No veo los cambios**
**Solución:**
1. Limpia la caché de WordPress (si usas plugin de caché)
2. Limpia la caché del navegador (Ctrl+Shift+Del)
3. Abre en modo incógnito para verificar

### **Problema: Error 500 o página en blanco**
**Solución:**
1. Restaura el respaldo:
   ```bash
   cp mapa-interactivo.php.backup mapa-interactivo.php
   ```
2. Verifica errores en: `wp-content/debug.log`
3. Revisa que no hayas dejado ninguna línea incompleta

### **Problema: Las barras aparecen duplicadas**
**Solución:**
- Asegúrate de eliminar completamente el bloque `if (!$is_provincia)`
- Debe estar solo dentro de `if ($is_provincia)`

---

## 📞 Necesitas Ayuda?

Si tienes problemas o dudas:
1. Revisa los logs de errores de PHP
2. Verifica que el archivo `mapa-interactivo.php` no tenga errores de sintaxis
3. Consulta la documentación de WordPress

---

## 📊 Resumen del Cambio

```
ANTES:
- Página principal: ✅ Barras visibles
- Páginas provincias: ❌ Barras NO visibles

DESPUÉS:
- Página principal: ❌ Barras NO visibles
- Páginas provincias: ✅ Barras visibles
```

**Archivos modificados:** 1
**Líneas cambiadas:** 11 (4 añadidas, 7 eliminadas)
**Nivel de riesgo:** BAJO ⚡ (cambio muy específico y seguro)

---

**Última actualización:** 2 de febrero de 2026
**Autor del cambio:** GitHub Copilot
**Repository:** postaldream/plugin-mapa
