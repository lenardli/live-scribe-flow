
import { useCallback, useEffect, useRef } from "react";

type WorkerCallback = (event: MessageEvent) => void;

export function useWorker(callback: WorkerCallback) {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/transcription.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = callback;
    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, [callback]);

  const postMessage = useCallback(
    (message: any) => {
      workerRef.current?.postMessage(message);
    },
    []
  );

  return {
    postMessage,
  };
}
