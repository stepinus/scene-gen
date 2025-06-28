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
export async function getComfyWorkflow(): Promise<ComfyWorkflow> {
  // В реальном приложении здесь будет логика получения workflow
  // из файла или API
  return {
    "3": {
      "inputs": {
        "seed": 0,
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
    },
    // Другие узлы workflow...
  }
}