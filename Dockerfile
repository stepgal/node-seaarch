FROM ubuntu:18.04

# Install dependencies
RUN apt-get update && \
 apt-get install -y nodejs && \
 apt-get install -y npm && \
 apt-get install -y git
 
RUN git clone https://github.com/stepgal/node-search.git

WORKDIR /node-search
RUN cp .env.example .env
RUN npm install

EXPOSE 3003

CMD node server.js
