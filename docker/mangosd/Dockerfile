# Imagen para el servidor de juego (mangosd)
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias de runtime
RUN apt-get update && apt-get install -y \
    libboost-system1.74.0 \
    libboost-program-options1.74.0 \
    libboost-thread1.74.0 \
    libboost-regex1.74.0 \
    libboost-serialization1.74.0 \
    libboost-filesystem1.74.0 \
    libssl3 \
    libmysqlclient21 \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root
RUN useradd -m -u 1000 mangos

# Crear directorios
RUN mkdir -p /mangos/bin /mangos/etc /mangos/data /mangos/logs && \
    chown -R mangos:mangos /mangos

WORKDIR /mangos

USER mangos

EXPOSE 8085

# Script de entrada se proporcionará
CMD ["/mangos/bin/mangosd", "-c", "/mangos/etc/mangosd.conf"]
