# Используем официальный Node.js образ
FROM node:20-alpine AS build-stage

# Создаем директорию для приложения
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем все остальные файлы
COPY . .

# Собираем приложение
RUN npm run build

# Production stage: минимальный nginx для раздачи
FROM nginx:stable-alpine AS production-stage

# Копируем собранные файлы из предыдущего этапа
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Копируем nginx конфигурацию (опционально)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Порт для работы
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
