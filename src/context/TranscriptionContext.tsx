
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from "sonner";
import Constants from "../utils/Constants";
import { useTranscriber, TranscriberData } from '../hooks/useTranscriber';

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
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<TranscriptionModel>(AVAILABLE_MODELS[0]);
  const [isModelInitialized, setIsModelInitialized] = useState<boolean>(false);

  const transcriber = useTranscriber();

  const loadModel = async () => {
    if (isModelInitialized) {
      console.log("Model already initialized:", selectedModel.id);
      return;
    }

    try {
      setProgressMessage(`Initializing ${selectedModel.name} model...`);
      
      // Update the model in the transcriber
      transcriber.setModel(selectedModel.id);
      
      // Create a minimal dummy buffer for model initialization
      // A 1s buffer at 16kHz (16000 samples)
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const dummyBuffer = audioContext.createBuffer(1, 16000, 16000);
      
      // Pass null for audio to signal this is just a model initialization request
      transcriber.start(null);
      
      // Wait for the model to be fully loaded before setting as initialized
      // This will be handled by the useEffect that watches transcriber.output
    } catch (error) {
      console.error('Error loading speech recognition model:', error);
      setIsModelInitialized(false);
      toast.error(`Failed to load ${selectedModel.name} model: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProgressMessage('');
    }
  };

  // Monitor loading progress
  useEffect(() => {
    if (transcriber.isModelLoading) {
      setProgressMessage(`Loading model...`);
      
      if (transcriber.progressItems.length > 0) {
        const item = transcriber.progressItems[0];
        if (item.status === 'progress') {
          const downloaded = Math.round(item.progress);
          setProgressMessage(`Downloading model: ${downloaded}% (${Math.round(item.loaded / 1024 / 1024)}MB / ${Math.round(item.total / 1024 / 1024)}MB)`);
        }
      }
    } 
  }, [transcriber.isModelLoading, transcriber.progressItems]);

  // Monitor model completion
  useEffect(() => {
    if (!transcriber.isModelLoading && transcriber.output) {
      // If the model loading is complete
      setIsModelInitialized(true);
      if (progressMessage) {
        setProgressMessage('');
        toast.success(`${selectedModel.name} model loaded successfully`);
      }
      
      // Handle transcription completion
      if (!transcriber.isBusy && isProcessingFile) {
        setIsProcessingFile(false);
        setIsTranscribingWithWhisper(false);
        toast.success('Transcription completed successfully');
      }
      
      // Update transcript when available
      setTranscript(transcriber.output.text);
    }
  }, [transcriber.output, transcriber.isBusy, transcriber.isModelLoading, isProcessingFile, progressMessage, selectedModel.name]);

  // Reset model when selected model changes
  useEffect(() => {
    if (selectedModel.id !== transcriber.model) {
      setIsModelInitialized(false);
      transcriber.setModel(selectedModel.id);
    }
  }, [selectedModel.id, transcriber]);

  const startRecording = () => {
    if (!isModelInitialized) {
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
    transcriber.onInputChange();
    toast.info('Transcript cleared');
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    if (!isModelInitialized) {
      toast.error('Please load the speech recognition model first');
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
      console.log('Audio decoded successfully:', audioBuffer.duration, 'seconds,', audioBuffer.numberOfChannels, 'channels', audioBuffer.length, 'samples');
      
      transcriber.start(audioBuffer);
      
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      isModelLoading: transcriber.isModelLoading,
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
