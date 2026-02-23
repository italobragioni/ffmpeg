# Puxa uma imagem que já tem o FFmpeg pronto e estático
FROM mwader/static-ffmpeg:latest AS ffmpeg

# Abre o seu n8n
FROM n8nio/n8n:latest
USER root

# Injeta o executável do FFmpeg diretamente no sistema do n8n (sem usar instaladores!)
COPY --from=ffmpeg /ffmpeg /usr/local/bin/ffmpeg

# Volta para o utilizador de segurança
USER node
