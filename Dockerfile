FROM node:lts-buster
Utilisateur root pour installer les dépendances système
USER root
Installer ffmpeg, webp et git
RUN apt-get update && \
    apt-get install -y ffmpeg webp git && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*
USER node
RUN git clone https://github.com/haenxhc/-XKY-BOT- /home/node/XKY-BOT
WORKDIR /home/node/XKY-BOT
RUN chmod -R 777 /home/node/XKY-BOT
RUN yarn install --network-concurrency 1
EXPOSE 7860
ENV NODE_ENV=production
CMD ["npm", "start"]
