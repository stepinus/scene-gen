'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, Play, X, ImageIcon, Sparkles } from 'lucide-react'
import SettingsDialog from '@/components/SettingsDialog'

type Settings = {
  serverUrl?: string;
  comfyPipeline?: string;
};

function HomeComponent() {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [textPrompt, setTextPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState<string>('')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [resultVideo, setResultVideo] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const searchParams = useSearchParams()

  // Загружаем настройки при монтировании и обрабатываем URL параметр
  useEffect(() => {
    const serverUrlFromQuery = searchParams.get('url')
    let newSettings: Settings = {}

    // 1. Пытаемся загрузить настройки из localStorage
    try {
      const savedSettingsRaw = localStorage.getItem('ai-video-settings')
      if (savedSettingsRaw) {
        newSettings = JSON.parse(savedSettingsRaw)
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек из localStorage:', error)
      newSettings = {} // Начинаем с чистого листа, если парсинг не удался
    }

    // 2. Если есть параметр в URL, он переопределяет serverUrl
    if (serverUrlFromQuery) {
      console.log(`Найден URL сервера в параметре: ${serverUrlFromQuery}`)
      newSettings = { ...newSettings, serverUrl: serverUrlFromQuery }

      // 3. Сохраняем обновленные настройки обратно в localStorage
      try {
        localStorage.setItem('ai-video-settings', JSON.stringify(newSettings))
        // Отправляем событие, чтобы другие компоненты были в курсе
        window.dispatchEvent(new CustomEvent('settings-saved', { detail: newSettings }))
      } catch (error) {
        console.error('Ошибка сохранения настроек в localStorage:', error)
      }
    }

    // 4. Обновляем состояние компонента
    setSettings(newSettings)

    // 5. Слушаем событие обновления настроек из других компонентов
    const handleSettingsUpdate = (event: CustomEvent) => {
      setSettings(event.detail)
    }

    window.addEventListener('settings-saved', handleSettingsUpdate as EventListener)

    return () => {
      window.removeEventListener('settings-saved', handleSettingsUpdate as EventListener)
    }
  }, [searchParams])

  const handleImageSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImageFile(file)

      // Для отображения превью используем FileReader как раньше
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageSelect(file)
      uploadImageToServer(file)
    }
  }

  const uploadImageToServer = async (file: File) => {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Ошибка загрузки изображения')
      }

      const uploadData = await uploadResponse.json()
      setSelectedImageUrl(uploadData.imageUrl)

    } catch (error) {
      console.error('Ошибка при загрузке изображения:', error)
      alert('Ошибка при загрузке изображения')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleImageSelect(file)
      uploadImageToServer(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleSubmit = async () => {
    if (!selectedImageUrl || !textPrompt.trim()) {
      alert('Пожалуйста, загрузите изображение и введите текст')
      return
    }

    setIsLoading(true)
    setProgress(0)
    setProgressStage('Инициализация...')
    setResultImage(null)
    setResultVideo(null)

    const updateProgress = (stage: string, progressValue: number) => {
      setProgressStage(stage)
      setProgress(progressValue)
    }

    updateProgress('Подготовка запроса...', 5)

    try {
      const formData = new FormData()
      formData.append('imageUrl', selectedImageUrl) // Теперь отправляем URL изображения
      formData.append('text', textPrompt)

      // Добавляем настройки ComfyUI если они есть
      if (settings?.serverUrl && settings?.comfyPipeline) {
        formData.append('serverUrl', settings.serverUrl)
        formData.append('comfyPipeline', settings.comfyPipeline)
        updateProgress('Отправка запроса в ComfyUI...', 10)
      } else {
        updateProgress('Использование демонстрационного режима...', 10)
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()

        // Если есть ComfyUI настройки и получен prompt_id, запускаем поллинг
        if (settings?.serverUrl && data.comfyData?.prompt_id) {
          updateProgress('Задача отправлена в ComfyUI, ожидание результата...', 15)
          await pollComfyHistory(data.comfyData.prompt_id, settings.serverUrl, updateProgress)
        } else {
          // Демонстрационный режим
          updateProgress('Обработка ответа...', 95)
          setResultImage(data.image)
          setResultVideo(data.video)
          updateProgress('Готово!', 100)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка API')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      alert(`Произошла ошибка при обработке запроса: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Функция поллинга результатов от ComfyUI
  const pollComfyHistory = async (promptId: string, serverUrl: string, updateProgress: (stage: string, progress: number) => void) => {
    const maxWaitTime = 20 * 60 * 1000 // 20 минут
    const pollInterval = 10 * 1000 // 10 секунд
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000)
        updateProgress(`Генерация в процессе... (${elapsedMinutes} мин)`, 15 + (elapsedMinutes / 20) * 80)

        // Проверяем результаты (и изображения и видео приходят в одном ответе)
        const response = await fetch('/api/comfy-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt_id: promptId,
            serverUrl: serverUrl
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Если есть результаты
          if (data.fileName || data.videoFileName || data.imageFileName) {
            
            // Обрабатываем изображение (итоговое, не референсное)
            if (data.fileName || data.imageFileName) {
              const imageFileName = data.fileName || data.imageFileName
              const imageUrl = `${serverUrl}/view?filename=${imageFileName}&type=output`
              setResultImage(imageUrl)
            }

            // Обрабатываем видео
            if (data.videoFileName) {
              setResultVideo(data.videoFileName) // s3_path уже содержит полный URL
            } else if (data.fileName && data.fileName.includes('video')) {
              // Если видео приходит в fileName
              setResultVideo(data.fileName)
            }

            // Проверяем, получили ли мы все результаты
            const hasImage = data.fileName || data.imageFileName
            const hasVideo = data.videoFileName || (data.fileName && data.fileName.includes('video'))
            
            if (hasImage && hasVideo) {
              updateProgress('Готово!', 100)
              return // Успешно завершили - получили и изображение и видео
            } else if (hasImage) {
              updateProgress('Изображение готово, ожидание видео...', 70)
            } else if (hasVideo) {
              updateProgress('Видео готово, ожидание изображения...', 70)
            }
          }
        }

        // Ждем перед следующей проверкой
        await new Promise(resolve => setTimeout(resolve, pollInterval))

      } catch (error) {
        console.error('Ошибка при поллинге:', error)
        // Продолжаем поллинг даже при ошибках
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }
    }

    // Превышено время ожидания
    throw new Error('Превышено время ожидания результата (20 минут)')
  }

  const handleReset = () => {
    setSelectedImageFile(null)
    setSelectedImageUrl(null)
    setImagePreview(null)
    setTextPrompt('')
    setResultImage(null)
    setResultVideo(null)
    setProgress(0)
    setProgressStage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownload = (url: string | null) => {
    if (!url) return;
    // We need to fetch the blob to bypass CORS issues for direct download
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const filename = url.substring(url.lastIndexOf('/') + 1);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      })
      .catch(e => console.error('Could not download the file.', e));
  };

  const removeImage = () => {
    setSelectedImageFile(null)
    setSelectedImageUrl(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Заголовок */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            AI Генератор Видео
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Превратите ваши изображения в потрясающие AI видео с помощью текстового описания сцены
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Левая колонка - Ввод */}
        <div className="space-y-6">
          {/* Загрузка изображения */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Загрузка изображения
                {selectedImageFile && <Badge variant="secondary">Загружено</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!imagePreview ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                    isDragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    {isDragOver ? 'Отпустите файл здесь' : 'Перетащите изображение или нажмите для выбора'}
                  </h3>
                  <p className="text-muted-foreground">
                    Поддерживаются форматы: JPG, PNG, GIF
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Предпросмотр"
                    className="w-full h-64 object-cover rounded-lg border shadow-sm"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="mt-3 p-2 bg-muted rounded text-sm">
                    <strong>Файл:</strong> {selectedImageFile?.name}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Описание сцены */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardTitle>Описание сцены</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Label htmlFor="text-prompt" className="text-base">
                  Опишите, где должен находиться объект с изображения
                </Label>
                <Textarea
                  id="text-prompt"
                  placeholder="Например: на тропическом острове на пляже с белым песком и пальмами, волны плещутся на берегу, закат в небе..."
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  className="min-h-[120px] text-base"
                />
                <div className="text-sm text-muted-foreground">
                  <strong>Совет:</strong> Чем детальнее описание, тем лучше результат
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Кнопки управления */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !selectedImageFile || !textPrompt.trim()}
              className="flex-1 h-12 text-base"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Генерируем...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Создать видео
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} size="lg" className="h-12">
              Сбросить
            </Button>
          </div>

          {/* Прогресс */}
          {isLoading && (
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{progressStage}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="text-sm text-muted-foreground text-center">
                    {settings?.serverUrl ?
                      'Генерация видео из вашего изображения через ComfyUI может занять несколько минут...' :
                      'Пожалуйста, подождите. Это может занять несколько минут...'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Правая колонка - Результаты */}
        <div className="space-y-6">
          {(resultImage || resultVideo || isLoading) && (
            <>
              {/* Результат - Изображение */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Сгенерированное изображение
                    {resultImage && <Badge variant="secondary">Готово</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {resultImage ? (
                    <div className="space-y-4">
                      <img
                        src={resultImage}
                        alt="Сгенерированное нейросетью изображение"
                        className="w-full h-64 object-cover rounded-lg border shadow-sm"
                      />
                      <Button variant="outline" className="w-full" onClick={() => handleDownload(resultImage)}>
                        <Download className="w-4 h-4 mr-2" />
                        Скачать изображение
                      </Button>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
                      <div className="text-center">
                        {isLoading ? (
                          <>
                            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-muted-foreground">Изображение загружается...</p>
                          </>
                        ) : (
                          <p className="text-muted-foreground">Загруженное изображение появится здесь</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Результат - Видео */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Результат - Видео
                    {resultVideo && <Badge variant="secondary">Готово</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {resultVideo ? (
                    <div className="space-y-4">
                      <video
                        src={resultVideo}
                        controls
                        className="w-full h-64 rounded-lg border shadow-sm"
                      />
                      <Button variant="outline" className="w-full" onClick={() => handleDownload(resultVideo)}>
                        <Download className="w-4 h-4 mr-2" />
                        Скачать видео
                      </Button>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
                      <div className="text-center">
                        {isLoading ? (
                          <>
                            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-muted-foreground">Видео генерируется...</p>
                          </>
                        ) : (
                          <p className="text-muted-foreground">Видео появится здесь</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Стартовое состояние */}
          {!resultImage && !resultVideo && !isLoading && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full flex items-center justify-center">
                    <Play className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Готово к генерации</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Загрузите изображение и добавьте описание сцены, чтобы создать потрясающее AI видео
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Плавающая кнопка настроек */}
      <SettingsDialog />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <HomeComponent />
    </Suspense>
  )
}
