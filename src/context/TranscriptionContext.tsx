import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { toast } from "sonner";
import { pipeline } from "@huggingface/transformers";

export type TranscriptionModel = {
  id: string;
  name: string;
  description: string;
  size: string;
};

export const AVAILABLE_MODELS: TranscriptionModel[] = [
  {
    id: "Xenova/whisper-large-v3",
    name: "Xenova Large v3",
    description: "High accuracy, large model",
    size: "Large (2.9GB)"
  },
  {
    id: "Xenova/whisper-medium",
    name: "Xenova Medium",
    description: "Good balance of speed and accuracy",
    size: "Medium (1.5GB)"
  },
  {
    id: "Xenova/whisper-small",
    name: "Xenova Small",
    description: "Faster processing, still good accuracy",
    size: "Small (461MB)"
  },
  {
    id: "Xenova/whisper-tiny",
    name: "Xenova Tiny",
    description: "Very fast, less accurate",
    size: "Tiny (151MB)"
  }
];

interface TranscriptionContextType {
  isRecording: boolean;
  transcript: string;
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscript: () => void;
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  isProcessingFile: boolean;
  uploadedFileName: string | null;
  handleFileUpload: (file: File) => void;
  isTranscribingWithWhisper: boolean;
  isModelLoading: boolean;
  progressMessage: string;
  selectedModel: TranscriptionModel;
  setSelectedModel: (model: TranscriptionModel) => void;
  availableModels: TranscriptionModel[];
  isModelInitialized: boolean;
  loadModel: () => Promise<void>;
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

interface TranscriptionProviderProps {
  children: ReactNode;
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export const TranscriptionProvider: React.FC<TranscriptionProviderProps> = ({ children }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [recognition, setRecognition] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isTranscribingWithWhisper, setIsTranscribingWithWhisper] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [whisperTranscriber, setWhisperTranscriber] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<TranscriptionModel>(AVAILABLE_MODELS[0]);
  const [isModelInitialized, setIsModelInitialized] = useState<boolean>(false);

  const verifyTranscriber = useCallback(() => {
    if (!whisperTranscriber || typeof whisperTranscriber !== 'function') {
      console.error('Transcription model not properly initialized');
      setIsModelInitialized(false);
      return false;
    }
    return true;
  }, [whisperTranscriber]);

  const loadModel = async () => {
    if (isModelInitialized && whisperTranscriber && verifyTranscriber()) {
      console.log("Model already initialized:", selectedModel.id);
      return;
    }

    try {
      if (whisperTranscriber) {
        setWhisperTranscriber(null);
      }
      
      setIsModelLoading(true);
      setIsModelInitialized(false);
      setProgressMessage(`Initializing ${selectedModel.name} model...`);

      console.log("Starting to load model:", selectedModel.id);
      
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        selectedModel.id,
        { 
          device: "webgpu",
          progress_callback: (progress: any) => {
            if (progress.status === 'download') {
              const downloaded = Math.round(((progress.loaded || 0) / (progress.total || 1)) * 100);
              const loadedMB = Math.round((progress.loaded || 0) / 1024 / 1024);
              const totalMB = Math.round((progress.total || 1) / 1024 / 1024);
              setProgressMessage(`Downloading model: ${downloaded}% (${loadedMB}MB / ${totalMB}MB)`);
            } else if (progress.status === 'init') {
              const initProgress = progress.progress !== null && progress.progress !== undefined ? 
                Math.round(progress.progress * 100) : 0;
              setProgressMessage(`Initializing model: ${initProgress}%`);
            }
          }
        }
      );
      
      console.log("Pipeline returned:", transcriber);
      
      if (!transcriber || typeof transcriber !== 'function') {
        throw new Error('Failed to initialize transcription model - transcriber is not a function');
      }
      
      try {
        const testData = new Float32Array(1600);
        for (let i = 0; i < testData.length; i++) {
          testData[i] = Math.sin(i * 0.01) * 0.5;
        }
        
        console.log("Running test transcription with sample data");
        const testResult = await transcriber(testData, { 
          return_timestamps: false,
          chunk_length_s: 1
        });
        console.log("Test transcription completed successfully:", testResult);
      } catch (testError) {
        console.log('Initial test failed, but model still initialized:', testError);
      }
      
      setWhisperTranscriber(transcriber);
      setIsModelInitialized(true);
      console.log(`${selectedModel.name} model loaded successfully`, transcriber);
      toast.success(`${selectedModel.name} model loaded successfully`);
    } catch (error) {
      console.error('Error loading speech recognition model:', error);
      setIsModelInitialized(false);
      setWhisperTranscriber(null);
      toast.error(`Failed to load ${selectedModel.name} model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsModelLoading(false);
      setProgressMessage('');
    }
  };

  React.useEffect(() => {
    setIsModelInitialized(false);
    setWhisperTranscriber(null);
  }, [selectedModel.id]);

  const startRecording = () => {
    if (!isModelInitialized || !whisperTranscriber || !verifyTranscriber()) {
      toast.error('Please load the speech recognition model first');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error('Speech recognition is not supported in your browser. Try Chrome, Edge, or Safari.');
        return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          
          const recognitionInstance = new SpeechRecognition();
          recognitionInstance.continuous = true;
          recognitionInstance.interimResults = true;
          recognitionInstance.lang = selectedLanguage;

          recognitionInstance.onstart = () => {
            setIsRecording(true);
            toast.success('Recording started');
          };

          recognitionInstance.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcriptSegment = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcriptSegment;
              } else {
                interimTranscript += transcriptSegment;
              }
            }

            setTranscript(prev => {
              if (finalTranscript) {
                return prev + ' ' + finalTranscript;
              }
              return prev;
            });
          };

          recognitionInstance.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            
            if (event.error === 'audio-capture') {
              toast.error('Microphone not found or not working. Please check your device settings.');
            } else if (event.error === 'not-allowed') {
              toast.error('Microphone access was denied. Please allow microphone access in your browser settings.');
            } else {
              toast.error(`Error: ${event.error}`);
            }
            
            setIsRecording(false);
          };

          recognitionInstance.onend = () => {
            if (isRecording) {
              recognitionInstance.start();
            }
          };

          recognitionInstance.start();
          setRecognition(recognitionInstance);
        })
        .catch(err => {
          console.error('Microphone access error:', err);
          toast.error('Microphone access was denied. Please allow microphone access and try again.');
          setIsRecording(false);
        });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast.error('Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
      toast.info('Recording stopped');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setUploadedFileName(null);
    toast.info('Transcript cleared');
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    if (!isModelInitialized || !whisperTranscriber) {
      toast.error('Please load the speech recognition model first');
      return;
    }
    
    if (!verifyTranscriber()) {
      toast.error('Transcription model not properly initialized. Please reload the model.');
      return;
    }

    setIsProcessingFile(true);
    setUploadedFileName(file.name);
    setIsTranscribingWithWhisper(true);
    
    try {
      toast.info(`Transcribing file: ${file.name} with ${selectedModel.name} model`);
      
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const audioBuffer = await audioContext.decodeAudioData(await file.arrayBuffer());
      console.log('File loaded as ArrayBuffer:', audioBuffer.byteLength, 'bytes');
      console.log('Audio decoded successfully:', audioBuffer.duration, 'seconds,', audioBuffer.numberOfChannels, 'channels');
      
      let audioData: Float32Array;
      
      if (audioBuffer.numberOfChannels === 2) {
        const SCALING_FACTOR = Math.sqrt(2);
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.getChannelData(1);
        
        audioData = new Float32Array(left.length);
        for (let i = 0; i < left.length; i++) {
          audioData[i] = SCALING_FACTOR * (left[i] + right[i]) / 2;
        }
      } else {
        audioData = audioBuffer.getChannelData(0);
      }
      
      console.log('Starting transcription with model:', selectedModel.id);
      console.log('Audio data length:', audioData.length, 'samples');
      console.log('Audio data type:', audioData.constructor.name);
      
      const output = await whisperTranscriber(audioData, {
        language: selectedLanguage.split('-')[0],
        task: "transcribe",
        return_timestamps: false,
        chunk_length_s: 30,
      });
      
      console.log('Transcription output:', output);
      
      if (!output || !output.text) {
        throw new Error('Failed to generate transcription output - no text returned');
      }
      
      setTranscript(output.text);
      toast.success('Transcription completed successfully');
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (error instanceof Error && 
          (error.message.includes('not properly initialized') || 
           error.message.includes('not a function'))) {
        setIsModelInitialized(false);
        setWhisperTranscriber(null);
      }
    } finally {
      setIsProcessingFile(false);
      setIsTranscribingWithWhisper(false);
    }
  };

  return (
    <TranscriptionContext.Provider value={{
      isRecording,
      transcript,
      startRecording,
      stopRecording,
      clearTranscript,
      selectedLanguage,
      setSelectedLanguage,
      isProcessingFile,
      uploadedFileName,
      handleFileUpload,
      isTranscribingWithWhisper,
      isModelLoading,
      progressMessage,
      selectedModel,
      setSelectedModel,
      availableModels: AVAILABLE_MODELS,
      isModelInitialized,
      loadModel
    }}>
      {children}
    </TranscriptionContext.Provider>
  );
};

export const useTranscription = (): TranscriptionContextType => {
  const context = useContext(TranscriptionContext);
  if (context === undefined) {
    throw new Error('useTranscription must be used within a TranscriptionProvider');
  }
  return context;
};
