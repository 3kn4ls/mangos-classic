# Imagen base de construcción para mangos-classic
FROM ubuntu:22.04 AS builder

# Evitar prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias de compilación
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libboost-all-dev \
    libssl-dev \
    libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /build

# Copiar código fuente
COPY . /build/

# Compilar con Playerbots habilitado
RUN mkdir -p /build/build && \
    cd /build/build && \
    cmake .. \
        -DCMAKE_INSTALL_PREFIX=/mangos \
        -DCMAKE_BUILD_TYPE=Release \
        -DBUILD_PLAYERBOTS=ON \
        -DBUILD_AHBOT=ON \
        -DBUILD_EXTRACTORS=OFF && \
    make -j$(nproc) && \
    make install

# Imagen final mínima con solo los binarios necesarios
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Instalar solo dependencias de runtime
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

# Copiar binarios y librerías desde builder
COPY --from=builder /mangos /mangos

# Crear directorio de datos
RUN mkdir -p /mangos/data

WORKDIR /mangos

# Los archivos de configuración se montarán como ConfigMaps
# Los datos (dbc, maps, vmaps, mmaps) se montarán como volúmenes
