FROM node:18.16.1

WORKDIR /usr/src/app

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y ffmpeg

COPY .env.copy .env

COPY . /usr/src/app

RUN npm install --force yarn typescript pm2 -g

# RUN pm2 install pm2-logrotate

# ENV PM2_PUBLIC_KEY i8zb2058az83s8f

# ENV PM2_SECRET_KEY g4o8mwf3u3285md

RUN yarn

RUN yarn build

EXPOSE 8800

# RUN pm2 delete ecosystem.config.js

ENTRYPOINT ["node", "./dist/app.js"]
