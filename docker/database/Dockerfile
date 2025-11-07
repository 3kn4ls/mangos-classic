# Imagen MySQL con scripts de inicialización
FROM mysql:8.0

# Copiar scripts SQL de inicialización
COPY sql/create/db_create_mysql.sql /docker-entrypoint-initdb.d/01-create-databases.sql
COPY sql/base/ /docker-entrypoint-initdb.d/base/
COPY sql/updates/ /docker-entrypoint-initdb.d/updates/

# Script personalizado de inicialización
COPY docker/database/init-databases.sh /docker-entrypoint-initdb.d/02-init-databases.sh

RUN chmod +x /docker-entrypoint-initdb.d/02-init-databases.sh

# Variables de entorno por defecto (se sobrescriben en Kubernetes)
ENV MYSQL_ROOT_PASSWORD=changeme
ENV MYSQL_DATABASE=classicmangos
ENV MYSQL_USER=mangos
ENV MYSQL_PASSWORD=mangos

EXPOSE 3306
