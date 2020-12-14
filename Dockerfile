# docker run -it -v $(pwd)/raw:/usr/src/nodejs/raw --name xiamen-housing-data-collection xiamenhousingdatacollection
FROM node:12-alpine

# 查看容器时区
ENV TIME_ZONE=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TIME_ZONE /etc/localtime && echo $TIME_ZONE > /etc/timezone

# add graphicsmagick support
RUN apk add --no-cache graphicsmagick

# setup workdir
RUN mkdir -p /usr/src/nodejs/
WORKDIR /usr/src/nodejs/

# add npm package
COPY package.json /usr/src/nodejs/package.json
RUN cd /usr/src/nodejs/
RUN npm --registry https://registry.npm.taobao.org install --only=prod

# copy code
COPY . /usr/src/nodejs/

VOLUME [ "/usr/src/nodejs/raw" ]

# Run node.js
CMD npm run start