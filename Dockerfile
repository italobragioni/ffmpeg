FROM alpine:latest AS alpine
FROM n8nio/n8n:latest
USER root

# Traz o instalador 'apk' de volta para o sistema do n8n
COPY --from=alpine /sbin/apk /sbin/apk
COPY --from=alpine /lib/libapk.so* /lib/
COPY --from=alpine /etc/apk/ /etc/apk/

# Agora sim, instala o FFmpeg com sucesso
RUN apk update && apk add --no-cache ffmpeg

USER node
