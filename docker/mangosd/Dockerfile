# Imagen para el servidor de juego (mangosd)
FROM mangos-classic/builder:latest AS builder

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

# Copiar binarios desde builder
COPY --from=builder --chown=mangos:mangos /mangos/bin/mangosd /mangos/bin/

# Create entrypoint script
RUN echo '#!/bin/sh\ntail -f /dev/null | /mangos/bin/mangosd -c /mangos/etc/mangosd.conf' > /mangos/bin/entrypoint.sh && \
    chmod +x /mangos/bin/entrypoint.sh && \
    chown mangos:mangos /mangos/bin/entrypoint.sh

WORKDIR /mangos

USER mangos

EXPOSE 8085

# Run with stdin redirected to prevent shutdown on stdin close
CMD ["/mangos/bin/entrypoint.sh"]
