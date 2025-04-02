
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { toast } from "sonner";

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
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

interface TranscriptionProviderProps {
  children: ReactNode;
}

export const TranscriptionProvider: React.FC<TranscriptionProviderProps> = ({ children }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [recognition, setRecognition] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const startRecording = () => {
    try {
      // Check if browser supports SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error('Speech recognition is not supported in your browser. Try Chrome, Edge, or Safari.');
        return;
      }

      // Request microphone permission before starting recognition
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // Stop the stream immediately, we just needed permission
          stream.getTracks().forEach(track => track.stop());
          
          // Now start speech recognition
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
              // If we have final text, add it to our transcript
              if (finalTranscript) {
                return prev + ' ' + finalTranscript;
              }
              // Otherwise, show current transcript + interim results
              return prev;
            });
          };

          recognitionInstance.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            
            // Handle specific error types
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
            // Only set recording to false if we're not supposed to be recording
            // This allows us to restart if it stops unexpectedly
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

  const handleFileUpload = (file: File) => {
    // Check if the file is an audio file
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    setIsProcessingFile(true);
    setUploadedFileName(file.name);
    
    // Create a URL for the uploaded file
    const fileURL = URL.createObjectURL(file);
    
    // Create a new SpeechRecognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in your browser. Try Chrome, Edge, or Safari.');
      setIsProcessingFile(false);
      return;
    }

    // Create audio context and source
    const audioContext = new AudioContext();
    const audioElement = new Audio(fileURL);
    audioElement.controls = true;
    
    // Create media source
    const mediaSource = audioContext.createMediaElementSource(audioElement);
    mediaSource.connect(audioContext.destination);

    // Set up SpeechRecognition
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = selectedLanguage;

    recognitionInstance.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(prev => prev + ' ' + transcriptSegment);
        }
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error during file processing', event.error);
      toast.error(`Error processing audio file: ${event.error}`);
      setIsProcessingFile(false);
    };

    recognitionInstance.onend = () => {
      // For file processing, we don't restart on end
      setIsProcessingFile(false);
      toast.success('Audio file transcription completed');
    };

    // Start playing the audio and recognition
    audioElement.oncanplaythrough = () => {
      toast.info(`Processing file: ${file.name}`);
      try {
        recognitionInstance.start();
        audioElement.play()
          .catch(error => {
            console.error('Error playing audio:', error);
            recognitionInstance.stop();
            setIsProcessingFile(false);
            toast.error('Failed to play audio file. User interaction may be required.');
          });
      } catch (error) {
        console.error('Error starting recognition for file:', error);
        setIsProcessingFile(false);
        toast.error('Failed to process audio file');
      }
    };

    // Clean up on errors or completion
    audioElement.onerror = () => {
      toast.error('Error loading the audio file');
      setIsProcessingFile(false);
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
    };
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
