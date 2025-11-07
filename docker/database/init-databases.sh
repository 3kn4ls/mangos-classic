#!/bin/bash
set -e

echo "Inicializando bases de datos de mangos-classic..."

# Esperar a que MySQL esté listo
until mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1" &> /dev/null; do
    echo "Esperando a MySQL..."
    sleep 2
done

echo "MySQL está listo, aplicando schemas..."

# Aplicar schemas base
echo "Aplicando schema de mangos..."
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" classicmangos < /docker-entrypoint-initdb.d/base/mangos.sql || true

echo "Aplicando schema de characters..."
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" classiccharacters < /docker-entrypoint-initdb.d/base/characters.sql || true

echo "Aplicando schema de realmd..."
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" classicrealmd < /docker-entrypoint-initdb.d/base/realmd.sql || true

echo "Aplicando schema de logs..."
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" classiclogs < /docker-entrypoint-initdb.d/base/logs.sql || true

# Aplicar DBC data
echo "Aplicando datos DBC..."
if [ -d "/docker-entrypoint-initdb.d/base/dbc/original_data" ]; then
    for sql_file in /docker-entrypoint-initdb.d/base/dbc/original_data/*.sql; do
        [ -f "$sql_file" ] || continue
        echo "  - $(basename $sql_file)"
        mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" classicmangos < "$sql_file" || true
    done
fi

if [ -d "/docker-entrypoint-initdb.d/base/dbc/cmangos_fixes" ]; then
    for sql_file in /docker-entrypoint-initdb.d/base/dbc/cmangos_fixes/*.sql; do
        [ -f "$sql_file" ] || continue
        echo "  - $(basename $sql_file)"
        mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" classicmangos < "$sql_file" || true
    done
fi

# Aplicar AHBot commands si existe
if [ -f "/docker-entrypoint-initdb.d/base/ahbot/mangos_command_ahbot.sql" ]; then
    echo "Aplicando comandos AHBot..."
    mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" classicmangos < /docker-entrypoint-initdb.d/base/ahbot/mangos_command_ahbot.sql || true
fi

# Aplicar updates
echo "Aplicando updates de mangos..."
if [ -d "/docker-entrypoint-initdb.d/updates/mangos" ]; then
    for sql_file in /docker-entrypoint-initdb.d/updates/mangos/*.sql; do
        [ -f "$sql_file" ] || continue
        mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" classicmangos < "$sql_file" 2>/dev/null || true
    done
fi

echo "Aplicando updates de characters..."
if [ -d "/docker-entrypoint-initdb.d/updates/characters" ]; then
    for sql_file in /docker-entrypoint-initdb.d/updates/characters/*.sql; do
        [ -f "$sql_file" ] || continue
        mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" classiccharacters < "$sql_file" 2>/dev/null || true
    done
fi

echo "Aplicando updates de realmd..."
if [ -d "/docker-entrypoint-initdb.d/updates/realmd" ]; then
    for sql_file in /docker-entrypoint-initdb.d/updates/realmd/*.sql; do
        [ -f "$sql_file" ] || continue
        mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" classicrealmd < "$sql_file" 2>/dev/null || true
    done
fi

echo "Aplicando updates de logs..."
if [ -d "/docker-entrypoint-initdb.d/updates/logs" ]; then
    for sql_file in /docker-entrypoint-initdb.d/updates/logs/*.sql; do
        [ -f "$sql_file" ] || continue
        mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" classiclogs < "$sql_file" 2>/dev/null || true
    done
fi

echo "¡Inicialización de base de datos completada!"
