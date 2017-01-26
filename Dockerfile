FROM mhart/alpine-node:latest

RUN apk update && apk add git

RUN mkdir -p /opt/facilmap
RUN adduser -D -h /opt/facilmap -s /bin/bash facilmap
WORKDIR /opt/facilmap

COPY ./ ./
RUN chown -R facilmap:facilmap .

USER facilmap
RUN npm install

USER root
RUN npm install -g gulp bower

USER facilmap
RUN bower install
RUN gulp
RUN npm install mysql pg sqlite3 tedious
RUN gulp clean

USER root
RUN chown -R root:root .

USER facilmap

CMD npm run server
EXPOSE 8080