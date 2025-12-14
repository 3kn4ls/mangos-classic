# Imagen para el servidor de autenticación (realmd)
FROM mangos-classic/builder:latest AS builder

FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias de runtime
RUN apt-get update && apt-get install -y \
    libboost-system1.74.0 \
    libboost-program-options1.74.0 \
    libboost-thread1.74.0 \
    libssl3 \
    libmysqlclient21 \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root
RUN useradd -m -u 1000 mangos

# Crear directorios
RUN mkdir -p /mangos/bin /mangos/etc /mangos/logs && \
    chown -R mangos:mangos /mangos

# Copiar binarios desde builder
COPY --from=builder --chown=mangos:mangos /mangos/bin/realmd /mangos/bin/

WORKDIR /mangos

USER mangos

EXPOSE 3724

# Script de entrada se proporcionará
CMD ["/mangos/bin/realmd", "-c", "/mangos/etc/realmd.conf"]
