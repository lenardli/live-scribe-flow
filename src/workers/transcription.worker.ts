
import { pipeline } from "@huggingface/transformers";

// When inside a web worker, self refers to the worker's global scope
// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

let transcriber: any = null;

// Process messages from the main thread
ctx.addEventListener("message", async (event) => {
  try {
    const { audio, model, multilingual, subtask, language } = event.data;
    // Removed quantized from the destructuring since it's not used anymore

    if (!transcriber) {
      // Send loading status
      ctx.postMessage({
        status: "initiate",
        file: model,
        name: "Model",
        loaded: 0,
        progress: 0,
        total: 100,
      });

      // Initialize the pipeline with the given parameters
      transcriber = await pipeline(
        "automatic-speech-recognition",
        model,
        {
          progress_callback: (progress: any) => {
            if (progress.status === "download") {
              ctx.postMessage({
                status: "progress",
                file: model,
                loaded: progress.loaded,
                total: progress.total,
                progress: (progress.loaded / progress.total) * 100,
              });
            } else if (progress.status === "init") {
              ctx.postMessage({
                status: "progress",
                file: model,
                progress: progress.progress * 100,
              });
            }
          },
          device: "webgpu",
        }
      );

      ctx.postMessage({
        status: "done",
        file: model,
      });

      ctx.postMessage({
        status: "ready",
      });
    }

    // Only process audio if it's provided (not during initial model loading)
    if (audio) {
      // Process the audio data
      const result = await transcriber(audio, {
        task: subtask || "transcribe",
        language,
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
        callback_function: (data: any) => {
          ctx.postMessage({
            status: "update",
            data,
          });
        },
      });

      // Send the complete transcript back
      ctx.postMessage({
        status: "complete",
        data: result,
      });
    } else {
      // If no audio is provided, just confirm the model is loaded
      ctx.postMessage({
        status: "complete",
        data: { text: "", chunks: [] },
      });
    }
  } catch (error) {
    console.error("Worker error:", error);
    ctx.postMessage({
      status: "error",
      data: { message: error instanceof Error ? error.message : String(error) },
    });
  }
});

// Let the main thread know the worker is ready
ctx.postMessage({ status: "initialized" });
