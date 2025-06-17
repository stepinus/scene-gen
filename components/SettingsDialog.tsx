'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Settings, Save, RotateCcw } from 'lucide-react'

interface SettingsData {
  serverUrl: string
  comfyPipeline: string
}

const DEFAULT_PIPELINE = `{
  "3": {
    "inputs": {
      "seed": 1234567890,
      "steps": 20,
      "cfg": 8,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": [
        "4",
        0
      ],
      "positive": [
        "6",
        0
      ],
      "negative": [
        "7",
        0
      ],
      "latent_image": [
        "5",
        0
      ]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "KSampler"
    }
  }
}`

export default function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<SettingsData>({
    serverUrl: '',
    comfyPipeline: DEFAULT_PIPELINE
  })
  const [tempSettings, setTempSettings] = useState<SettingsData>(settings)
  const [showTooltip, setShowTooltip] = useState(false)

  // Загрузка настроек из localStorage при монтировании
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('ai-video-settings')
      const hasShownTooltip = localStorage.getItem('ai-video-tooltip-shown')
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
        setTempSettings(parsed)
      } else {
        // Устанавливаем значения по умолчанию
        const defaultSettings = {
          serverUrl: 'http://localhost:8188',
          comfyPipeline: DEFAULT_PIPELINE
        }
        setSettings(defaultSettings)
        setTempSettings(defaultSettings)
        
        // Показываем подсказку для новых пользователей
        if (!hasShownTooltip) {
          setShowTooltip(true)
          setTimeout(() => {
            setShowTooltip(false)
            localStorage.setItem('ai-video-tooltip-shown', 'true')
          }, 5000) // Скрываем через 5 секунд
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error)
    }
  }, [])

  const handleSave = () => {
    try {
      // Валидация JSON
      JSON.parse(tempSettings.comfyPipeline)
      
      // Сохранение в localStorage
      localStorage.setItem('ai-video-settings', JSON.stringify(tempSettings))
      setSettings(tempSettings)
      setIsOpen(false)
      
      // Уведомление об успешном сохранении
      const event = new CustomEvent('settings-saved', { detail: tempSettings })
      window.dispatchEvent(event)
         } catch {
       alert('Ошибка в JSON пайплайне. Проверьте синтаксис.')
     }
  }

  const handleReset = () => {
    const defaultSettings = {
      serverUrl: 'http://localhost:8188',
      comfyPipeline: DEFAULT_PIPELINE
    }
    setTempSettings(defaultSettings)
  }

  const handleCancel = () => {
    setTempSettings(settings)
    setIsOpen(false)
  }

  const validateJson = (jsonString: string) => {
    try {
      JSON.parse(jsonString)
      return true
    } catch {
      return false
    }
  }

      return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative">
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 z-50 border-2 border-white dark:border-gray-800 animate-pulse hover:animate-none"
            title="Настройки ComfyUI"
          >
            <Settings className="h-5 w-5 text-white animate-spin-slow" />
          </Button>
          
          {/* Подсказка для новых пользователей */}
          {showTooltip && (
            <div className="fixed bottom-20 right-6 z-60 max-w-sm p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg border border-gray-700 animate-fade-in">
              <div className="flex items-start gap-2">
                <Settings className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Настройки ComfyUI</p>
                  <p className="text-gray-300 text-xs">
                    Нажмите здесь, чтобы настроить интеграцию с вашим ComfyUI сервером
                  </p>
                </div>
              </div>
              <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-gray-900 border-r border-b border-gray-700 transform rotate-45"></div>
            </div>
          )}
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Настройки ComfyUI
          </DialogTitle>
          <DialogDescription>
            Настройте адрес сервера ComfyUI и JSON пайплайн для генерации видео
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Адрес сервера */}
          <div className="space-y-2">
            <Label htmlFor="server-url" className="text-sm font-medium">
              Адрес сервера ComfyUI
            </Label>
            <Input
              id="server-url"
              type="url"
              placeholder="http://localhost:8188"
              value={tempSettings.serverUrl}
              onChange={(e) => setTempSettings(prev => ({ ...prev, serverUrl: e.target.value }))}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              URL адрес вашего ComfyUI сервера (обычно http://localhost:8188)
            </p>
          </div>

          {/* JSON Пайплайн */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="comfy-pipeline" className="text-sm font-medium">
                JSON Пайплайн ComfyUI
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  По умолчанию
                </Button>
                <div className={`text-xs px-2 py-1 rounded ${
                  validateJson(tempSettings.comfyPipeline) 
                    ? 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400' 
                    : 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
                }`}>
                  {validateJson(tempSettings.comfyPipeline) ? '✓ Валидный JSON' : '✗ Невалидный JSON'}
                </div>
              </div>
            </div>
            
            <Textarea
              id="comfy-pipeline"
              placeholder="Вставьте JSON пайплайн из ComfyUI..."
              value={tempSettings.comfyPipeline}
              onChange={(e) => setTempSettings(prev => ({ ...prev, comfyPipeline: e.target.value }))}
              className="min-h-[400px] font-mono text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Экспортируйте workflow из ComfyUI в формате JSON API и вставьте его здесь.
              <br />
                             <strong>Совет:</strong> В ComfyUI используйте &quot;Save (API Format)&quot; для получения корректного JSON.
            </p>
          </div>

          {/* Информационный блок */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              📋 Как получить JSON пайплайн:
            </h4>
            <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Создайте workflow в ComfyUI</li>
              <li>Нажмите на шестерёнку (Settings) в ComfyUI</li>
                             <li>Включите &quot;Enable Dev mode Options&quot;</li>
               <li>Нажмите &quot;Save (API Format)&quot; вместо обычного Save</li>
              <li>Скопируйте полученный JSON и вставьте сюда</li>
            </ol>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Отмена
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!validateJson(tempSettings.comfyPipeline) || !tempSettings.serverUrl.trim()}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 