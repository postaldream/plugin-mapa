#!/bin/bash

# Script de Implementación Automática
# Mover barras de categorías a páginas de provincias
# Repository: postaldream/plugin-mapa

echo "=========================================="
echo "🚀 Script de Implementación Automática"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "mapa-interactivo.php" ]; then
    echo -e "${RED}❌ Error: No se encuentra el archivo mapa-interactivo.php${NC}"
    echo "Por favor, ejecuta este script desde el directorio del plugin."
    exit 1
fi

echo -e "${YELLOW}📍 Directorio actual: $(pwd)${NC}"
echo ""

# Crear respaldo
echo -e "${YELLOW}📦 Creando respaldo del archivo original...${NC}"
BACKUP_FILE="mapa-interactivo.php.backup-$(date +%Y%m%d-%H%M%S)"
cp mapa-interactivo.php "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Respaldo creado: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Error al crear respaldo${NC}"
    exit 1
fi
echo ""

# Preguntar método de implementación
echo "¿Cómo deseas implementar el cambio?"
echo "1) Pull desde GitHub (requiere git y acceso al repo)"
echo "2) Ver instrucciones para implementación manual"
echo "3) Cancelar"
echo ""
read -p "Selecciona una opción (1-3): " option

case $option in
    1)
        echo ""
        echo -e "${YELLOW}🔄 Intentando actualizar desde GitHub...${NC}"
        
        # Verificar que git esté disponible
        if ! command -v git &> /dev/null; then
            echo -e "${RED}❌ Git no está instalado${NC}"
            exit 1
        fi
        
        # Verificar que estemos en un repositorio git
        if [ ! -d ".git" ]; then
            echo -e "${RED}❌ Este no es un repositorio git${NC}"
            echo "Por favor, inicializa git o usa la opción 2 para implementación manual"
            exit 1
        fi
        
        # Guardar cambios locales si existen
        if [[ $(git status --porcelain) ]]; then
            echo -e "${YELLOW}⚠️  Hay cambios locales. Guardando...${NC}"
            git stash
        fi
        
        # Hacer pull
        echo ""
        echo -e "${YELLOW}📥 Descargando cambios...${NC}"
        git fetch origin
        
        # Intentar merge de la rama
        echo ""
        echo "¿Desde qué rama quieres hacer pull?"
        echo "1) main"
        echo "2) master"
        echo "3) copilot/move-bars-to-province-pages (rama con los cambios)"
        read -p "Selecciona (1-3): " branch_option
        
        case $branch_option in
            1) BRANCH="main" ;;
            2) BRANCH="master" ;;
            3) BRANCH="copilot/move-bars-to-province-pages" ;;
            *) echo -e "${RED}Opción inválida${NC}"; exit 1 ;;
        esac
        
        git pull origin "$BRANCH"
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Actualización completada exitosamente${NC}"
        else
            echo ""
            echo -e "${RED}❌ Error al hacer pull${NC}"
            echo "Restaurando respaldo..."
            cp "$BACKUP_FILE" mapa-interactivo.php
            exit 1
        fi
        ;;
        
    2)
        echo ""
        echo -e "${YELLOW}📖 Instrucciones para implementación manual:${NC}"
        echo ""
        echo "1. Abre el archivo mapa-interactivo.php en tu editor"
        echo "2. Lee la guía completa en: GUIA_IMPLEMENTACION.md"
        echo "3. Sigue las instrucciones de la Opción 3 (Edición Manual)"
        echo ""
        echo "O descarga el archivo actualizado desde:"
        echo "https://github.com/postaldream/plugin-mapa/blob/copilot/move-bars-to-province-pages/mapa-interactivo.php"
        echo ""
        exit 0
        ;;
        
    3)
        echo ""
        echo -e "${YELLOW}❌ Operación cancelada${NC}"
        echo "El respaldo se mantiene en: $BACKUP_FILE"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Opción inválida${NC}"
        exit 1
        ;;
esac

# Verificar sintaxis PHP
echo ""
echo -e "${YELLOW}🔍 Verificando sintaxis PHP...${NC}"
php -l mapa-interactivo.php > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Sintaxis PHP correcta${NC}"
else
    echo -e "${RED}❌ Error de sintaxis PHP detectado${NC}"
    echo "Restaurando respaldo..."
    cp "$BACKUP_FILE" mapa-interactivo.php
    echo -e "${YELLOW}⚠️  Archivo restaurado. Por favor verifica los cambios manualmente.${NC}"
    exit 1
fi

# Resumen final
echo ""
echo "=========================================="
echo -e "${GREEN}✅ IMPLEMENTACIÓN COMPLETADA${NC}"
echo "=========================================="
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Limpia la caché de WordPress"
echo "2. Limpia la caché del navegador (Ctrl+Shift+Del)"
echo "3. Verifica que:"
echo "   ✓ Página principal: SIN barras de categorías"
echo "   ✓ Páginas de provincias: CON barras de categorías"
echo ""
echo "📦 Respaldo guardado en: $BACKUP_FILE"
echo ""
echo "Si algo sale mal, restaura con:"
echo "cp $BACKUP_FILE mapa-interactivo.php"
echo ""
echo "=========================================="
