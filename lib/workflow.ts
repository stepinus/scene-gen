// Определяем типы для узлов и workflow ComfyUI
export interface ComfyWorkflowNode {
  class_type: string;
  inputs: Record<string, unknown>;
  _meta?: {
    title: string;
  };
}

export type ComfyWorkflow = {
  [key: string]: ComfyWorkflowNode;
};

// Моковая функция для получения workflow
export async function getComfyWorkflow(): Promise<string> {
  // В реальном приложении здесь будет логика получения workflow
  // из файла или API
return `{
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
          "318",
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
    },
    "318": {
      "inputs": {
        "image": "",
        "keep_alpha_channel": false,
        "output_mode": false,
        "choose image to upload": "image"
      },
      "class_type": "LoadImageFromUrl",
      "_meta": {
        "title": "Load Image From URL"
      }
    }
  }
  `
    // Другие узлы workflow..
}