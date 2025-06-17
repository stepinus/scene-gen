# Интеграция с API

Это руководство поможет вам интегрировать фронтенд приложение с вашим реальным API для генерации AI видео.

## 🔧 Настройка API Endpoint

### 1. Обновление API Route

Откройте файл `app/api/generate/route.ts` и замените мок логику:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const text = formData.get('text') as string

    if (!image || !text) {
      return NextResponse.json(
        { error: 'Изображение и текст обязательны' },
        { status: 400 }
      )
    }

    // ЗАМЕНИТЕ НА ВАШ РЕАЛЬНЫЙ API
    const apiFormData = new FormData()
    apiFormData.append('image', image)
    apiFormData.append('text', text)
    
    const response = await fetch('YOUR_API_ENDPOINT_URL', {
      method: 'POST',
      headers: {
        // Добавьте необходимые заголовки
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
        // 'Content-Type': 'multipart/form-data' // НЕ добавляйте, браузер сделает это автоматически
      },
      body: apiFormData
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const result = await response.json()
    
    // Адаптируйте ответ под формат фронтенда
    return NextResponse.json({
      image: result.image_url || result.image, // Адаптируйте под ваш API
      video: result.video_url || result.video  // Адаптируйте под ваш API
    })

  } catch (error) {
    console.error('Ошибка API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
```

### 2. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# API Configuration
API_ENDPOINT=https://your-api-domain.com/generate
API_TOKEN=your_secret_api_token

# Optional: If your API requires specific headers
API_KEY=your_api_key
```

Обновите код API route для использования переменных окружения:

```typescript
const response = await fetch(process.env.API_ENDPOINT, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.API_TOKEN}`,
    'X-API-Key': process.env.API_KEY,
  },
  body: apiFormData
})
```

## 📊 Обработка различных форматов ответов

### Формат ответа вашего API

Адаптируйте код под формат ответа вашего API:

#### Если ваш API возвращает прямые URL:
```typescript
// Ваш API возвращает:
// { "image": "https://...", "video": "https://..." }

return NextResponse.json({
  image: result.image,
  video: result.video
})
```

#### Если ваш API возвращает Base64:
```typescript
// Ваш API возвращает:
// { "image_base64": "data:image/jpeg;base64,...", "video_url": "https://..." }

return NextResponse.json({
  image: result.image_base64,
  video: result.video_url
})
```

#### Если ваш API возвращает ID для последующего получения файлов:
```typescript
// Ваш API возвращает:
// { "job_id": "12345", "status": "processing" }

if (result.status === 'completed') {
  return NextResponse.json({
    image: `${process.env.API_ENDPOINT}/files/${result.image_id}`,
    video: `${process.env.API_ENDPOINT}/files/${result.video_id}`
  })
} else {
  return NextResponse.json(
    { error: 'Генерация еще в процессе', job_id: result.job_id },
    { status: 202 }
  )
}
```

## ⏰ Обработка асинхронных задач

Если ваш API работает асинхронно, реализуйте polling:

### 1. Создайте endpoint для проверки статуса

```typescript
// app/api/status/[jobId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const response = await fetch(`${process.env.API_ENDPOINT}/status/${params.jobId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.API_TOKEN}`,
    },
  })
  
  const result = await response.json()
  return NextResponse.json(result)
}
```

### 2. Обновите фронтенд для polling

```typescript
// В компоненте страницы
const pollJobStatus = async (jobId: string) => {
  const maxAttempts = 60 // 5 минут с интервалом 5 секунд
  let attempts = 0
  
  const poll = async () => {
    try {
      const response = await fetch(`/api/status/${jobId}`)
      const data = await response.json()
      
      if (data.status === 'completed') {
        setResultImage(data.image)
        setResultVideo(data.video)
        setProgress(100)
        setIsLoading(false)
        return
      }
      
      if (data.status === 'failed') {
        throw new Error('Генерация не удалась')
      }
      
      // Обновляем прогресс
      setProgress(data.progress || (attempts * 100 / maxAttempts))
      
      if (attempts < maxAttempts) {
        attempts++
        setTimeout(poll, 5000) // Проверяем каждые 5 секунд
      } else {
        throw new Error('Превышено время ожидания')
      }
    } catch (error) {
      setIsLoading(false)
      alert(`Ошибка: ${error}`)
    }
  }
  
  poll()
}
```

## 🔐 Безопасность

### 1. Валидация файлов
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif']

if (image.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: 'Файл слишком большой (макс. 10MB)' },
    { status: 400 }
  )
}

if (!ALLOWED_TYPES.includes(image.type)) {
  return NextResponse.json(
    { error: 'Неподдерживаемый тип файла' },
    { status: 400 }
  )
}
```

### 2. Rate Limiting
Установите `@upstash/ratelimit` для ограничения запросов:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 запросов в час
})

// В API route
const ip = request.ip ?? '127.0.0.1'
const { success } = await ratelimit.limit(ip)

if (!success) {
  return NextResponse.json(
    { error: 'Превышен лимит запросов' },
    { status: 429 }
  )
}
```

## 🚀 Производственное развертывание

### 1. Переменные окружения для продакшена

```env
# Production .env
NODE_ENV=production
API_ENDPOINT=https://your-production-api.com/generate
API_TOKEN=your_production_token
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 2. Обработка ошибок

```typescript
// Более детальная обработка ошибок
try {
  const response = await fetch(process.env.API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.API_TOKEN}`,
    },
    body: apiFormData
  })

  if (response.status === 429) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Попробуйте позже.' },
      { status: 429 }
    )
  }

  if (response.status === 401) {
    return NextResponse.json(
      { error: 'Неавторизованный доступ к API' },
      { status: 401 }
    )
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error ${response.status}: ${errorText}`)
  }

  // Остальная логика...
} catch (error) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return NextResponse.json(
      { error: 'API недоступен. Попробуйте позже.' },
      { status: 503 }
    )
  }
  
  console.error('API Error:', error)
  return NextResponse.json(
    { error: 'Внутренняя ошибка сервера' },
    { status: 500 }
  )
}
```

## 📝 Пример полной интеграции

Вот полный пример API route с реальной интеграцией:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const text = formData.get('text') as string

    // Валидация
    if (!image || !text) {
      return NextResponse.json(
        { error: 'Изображение и текст обязательны' },
        { status: 400 }
      )
    }

    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Файл слишком большой (макс. 10MB)' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый тип файла' },
        { status: 400 }
      )
    }

    // Подготовка данных для API
    const apiFormData = new FormData()
    apiFormData.append('image', image)
    apiFormData.append('prompt', text)
    apiFormData.append('quality', 'high')

    // Вызов реального API
    const response = await fetch(process.env.API_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
        'User-Agent': 'AI-Video-Generator/1.0',
      },
      body: apiFormData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    const result = await response.json()

    // Адаптация ответа
    return NextResponse.json({
      image: result.output?.image_url || result.image,
      video: result.output?.video_url || result.video,
      jobId: result.id || result.job_id
    })

  } catch (error) {
    console.error('API Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Внутренняя ошибка сервера',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
```

Следуйте этому руководству для успешной интеграции с вашим API! 