# Интеграция API для AI Генератора Видео

## Обзор API
API предоставляет эндпоинты для взаимодействия с бэкендом генератора видео.

## Эндпоинты

### 1. Загрузка изображения
```
POST /api/upload
```
Загружает изображение на сервер и возвращает его URL.

#### Параметры запроса (FormData)
- `image`: Файл изображения для загрузки (JPG, PNG, GIF)

#### Ответ
```json
{
  "imageUrl": "URL загруженного изображения"
}
```

### 2. Генерация видео
```
POST /api/generate
```
Генерирует видео на основе загруженного изображения и текстового описания.

#### Параметры запроса (FormData)
- `imageUrl`: URL изображения (полученный из эндпоинта загрузки)
- `text`: Текстовое описание сцены
- `serverUrl` (опционально): URL ComfyUI сервера
- `comfyPipeline` (опционально): Имя конвейера ComfyUI для использования

#### Ответ
```json
{
  "image": "URL сгенерированного изображения",
  "video": "URL сгенерированного видео",
  "workflowResponse": object (если используется ComfyUI сервер),
  "isDemo": boolean (если используется демонстрационный режим)
}
```

## Примеры использования

### 1. Загрузка изображения
```javascript
const formData = new FormData()
formData.append('image', file) // где file - объект File из input[type="file"]

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
})

const { imageUrl } = await response.json()
```

### 2. Генерация видео
```javascript
const formData = new FormData()
formData.append('imageUrl', imageUrl) // URL изображения из предыдущего шага
formData.append('text', 'Описание сцены...')
// Опционально:
// formData.append('serverUrl', 'http://your-comfyui-server.com')
// formData.append('comfyPipeline', 'your-pipeline-name')

const response = await fetch('/api/generate', {
  method: 'POST',
  body: formData,
})

const { image, video } = await response.json()
```

## Обработка ошибок
API возвращает коды состояния HTTP для обозначения успеха или ошибки:

- 200: Успешный запрос
- 400: Невалидные входные данные
- 500: Ошибка сервера

Тело ответа при ошибке:
```json
{
  "error": "Описание ошибки",
  "details": "Дополнительные детали ошибки"
}
```

## Интеграция с ComfyUI
Для использования с реальным сервером ComfyUI:

1. Убедитесь, что переменная окружения `COMFYUI_SERVER_URL` установлена
2. Или передавайте URL сервера и имя конвейера в запросе к `/api/generate`
3. API отправит запрос к вашему серверу ComfyUI с подготовленным workflow

Пример workflow можно найти в файле `lib/workflow.ts`.