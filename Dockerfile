# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Удаляем devDependencies после сборки для уменьшения размера образа
RUN npm prune --production

# Открываем порт 3333
EXPOSE 3333

# Устанавливаем переменную окружения для порта
ENV PORT=3333

# Запускаем приложение
CMD ["npm", "start"] 