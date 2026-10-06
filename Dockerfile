FROM gcc:bookworm

WORKDIR /app

COPY . .

RUN g++ -O3 -pthread main.cpp -o servidor

EXPOSE 8080

CMD ["./servidor"]
