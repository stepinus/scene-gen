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
      "seed": 411622654063530,
      "steps": 10,
      "cfg": 1,
      "sampler_name": "uni_pc",
      "scheduler": "simple",
      "denoise": 1,
      "model": [
        "54",
        0
      ],
      "positive": [
        "50",
        0
      ],
      "negative": [
        "50",
        1
      ],
      "latent_image": [
        "50",
        2
      ]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "KSampler"
    }
  },
  "6": {
    "inputs": {
      "text": "luxury commercial, slow camera movement, natural motion",
      "clip": [
        "38",
        0
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Positive Prompt)"
    }
  },
  "7": {
    "inputs": {
      "text": "色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走",
      "clip": [
        "38",
        0
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Negative Prompt)"
    }
  },
  "8": {
    "inputs": {
      "samples": [
        "3",
        0
      ],
      "vae": [
        "39",
        0
      ]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE Decode"
    }
  },
  "37": {
    "inputs": {
      "unet_name": "wan2114BFusionx_fusionxImage2video.safetensors",
      "weight_dtype": "default"
    },
    "class_type": "UNETLoader",
    "_meta": {
      "title": "Load Diffusion Model"
    }
  },
  "38": {
    "inputs": {
      "clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
      "type": "wan",
      "device": "default"
    },
    "class_type": "CLIPLoader",
    "_meta": {
      "title": "Load CLIP"
    }
  },
  "39": {
    "inputs": {
      "vae_name": "wan_2.1_vae.safetensors"
    },
    "class_type": "VAELoader",
    "_meta": {
      "title": "Load VAE"
    }
  },
  "49": {
    "inputs": {
      "clip_name": "clip_vision_h.safetensors"
    },
    "class_type": "CLIPVisionLoader",
    "_meta": {
      "title": "Load CLIP Vision"
    }
  },
  "50": {
    "inputs": {
      "width": 1024,
      "height": 1024,
      "length": 61,
      "batch_size": 1,
      "positive": [
        "6",
        0
      ],
      "negative": [
        "7",
        0
      ],
      "vae": [
        "39",
        0
      ],
      "clip_vision_output": [
        "51",
        0
      ],
      "start_image": [
        "296",
        0
      ]
    },
    "class_type": "WanImageToVideo",
    "_meta": {
      "title": "WanImageToVideo"
    }
  },
  "51": {
    "inputs": {
      "crop": "none",
      "clip_vision": [
        "49",
        0
      ],
      "image": [
        "296",
        0
      ]
    },
    "class_type": "CLIPVisionEncode",
    "_meta": {
      "title": "CLIP Vision Encode"
    }
  },
  "54": {
    "inputs": {
      "shift": 2.0000000000000004,
      "model": [
        "37",
        0
      ]
    },
    "class_type": "ModelSamplingSD3",
    "_meta": {
      "title": "ModelSamplingSD3"
    }
  },
  "290": {
    "inputs": {
      "delimiter": " ",
      "text1": [
        "292",
        0
      ],
      "text2": [
        "293",
        0
      ],
      "text3": [
        "291",
        0
      ],
      "text4": "",
      "text5": ""
    },
    "class_type": "TextConcat",
    "_meta": {
      "title": "Text Concat (Mikey)"
    }
  },
  "291": {
    "inputs": {
      "Text": ", keep the subject in the exact same position and pose"
    },
    "class_type": "DF_Text",
    "_meta": {
      "title": "Text"
    }
  },
  "292": {
    "inputs": {
      "Text": "Change the background to"
    },
    "class_type": "DF_Text",
    "_meta": {
      "title": "Text"
    }
  },
  "293": {
    "inputs": {
      "Text": "PROMPT_PLACEHOLDER"
    },
    "class_type": "DF_Text",
    "_meta": {
      "title": "Text"
    }
  },
  "294": {
    "inputs": {
      "preview": "",
      "source": [
        "290",
        0
      ]
    },
    "class_type": "PreviewAny",
    "_meta": {
      "title": "Preview Any"
    }
  },
  "295": {
    "inputs": {
      "image": "3.jpg"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "Load Image"
    }
  },
  "296": {
    "inputs": {
      "prompt": [
        "290",
        0
      ],
      "aspect_ratio": "1:1",
      "guidance": 3,
      "steps": 50,
      "seed": 132083499551220,
      "prompt_upsampling": false,
      "input_image": [
        "295",
        0
      ]
    },
    "class_type": "FluxKontextProImageNode",
    "_meta": {
      "title": "Flux.1 Kontext [pro] Image"
    }
  },
  "307": {
    "inputs": {
      "index": -1,
      "filenames": [
        "315",
        0
      ]
    },
    "class_type": "VHS_SelectFilename",
    "_meta": {
      "title": "Select Filename 🎥🅥🅗🅢"
    }
  },
  "308": {
    "inputs": {
      "s3_filename": "",
      "local_path": [
        "307",
        0
      ],
      "s3_folder": "gen_product_photography/img2vid",
      "delete_local": "false"
    },
    "class_type": "UploadFileS3",
    "_meta": {
      "title": "Upload File to S3"
    }
  },
  "309": {
    "inputs": {
      "s3_filename": "",
      "local_path": [
        "311",
        1
      ],
      "s3_folder": "gen_product_photography/txt2img/",
      "delete_local": "false"
    },
    "class_type": "UploadFileS3",
    "_meta": {
      "title": "Upload File to S3 (upscaled_adetailer)"
    }
  },
  "311": {
    "inputs": {
      "output_path": "s3_txt2img_product_photography",
      "filename_prefix": "Static_shot_[time(%Y-%m-%d)]",
      "filename_delimiter": "_",
      "filename_number_padding": 4,
      "filename_number_start": "false",
      "extension": "png",
      "dpi": 300,
      "quality": 100,
      "optimize_image": "true",
      "lossless_webp": "false",
      "overwrite_mode": "false",
      "show_history": "false",
      "show_history_by_prefix": "true",
      "embed_workflow": "true",
      "show_previews": "true",
      "images": [
        "296",
        0
      ]
    },
    "class_type": "Image Save",
    "_meta": {
      "title": "Save Image local (regular)"
    }
  },
  "312": {
    "inputs": {
      "images": [
        "296",
        0
      ]
    },
    "class_type": "PreviewImage",
    "_meta": {
      "title": "Preview Image"
    }
  },
  "313": {
    "inputs": {
      "ckpt_name": "rife47.pth",
      "clear_cache_after_n_frames": 70,
      "multiplier": 2,
      "fast_mode": true,
      "ensemble": true,
      "scale_factor": 1,
      "frames": [
        "8",
        0
      ]
    },
    "class_type": "RIFE VFI",
    "_meta": {
      "title": "RIFE VFI (recommend rife47 and rife49)"
    }
  },
  "315": {
    "inputs": {
      "frame_rate": 32,
      "loop_count": 0,
      "filename_prefix": "Video",
      "format": "video/h264-mp4",
      "pix_fmt": "yuv420p",
      "crf": 19,
      "save_metadata": true,
      "trim_to_audio": false,
      "pingpong": false,
      "save_output": true,
      "images": [
        "313",
        0
      ]
    },
    "class_type": "VHS_VideoCombine",
    "_meta": {
      "title": "Video Combine 🎥🅥🅗🅢"
    }
  },
  "317": {
    "inputs": {
      "preview": "",
      "source": [
        "315",
        0
      ]
    },
    "class_type": "PreviewAny",
    "_meta": {
      "title": "Preview Any"
    }
  }
}
`

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