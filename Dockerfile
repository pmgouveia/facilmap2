mhart/alpine-node:latest

RUN apt-get install npm
# RUN apk update && apk add git

RUN adduser -D -h /opt/facilmap -s /bin/bash facilmap
WORKDIR /opt/facilmap

COPY ./ ./
RUN chown -R facilmap:facilmap .

USER facilmap
RUN npm run deps
RUN npm run clean
RUN npm run build
RUN npm install mysql pg sqlite3 tedious

USER root
RUN chown -R root:root .

USER facilmap

CMD npm run server
EXPOSE 8080