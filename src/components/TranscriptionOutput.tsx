
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranscription } from '@/context/TranscriptionContext';
import { Info, FileAudio, Loader2, Download } from 'lucide-react';

const TranscriptionOutput: React.FC = () => {
  const { 
    transcript, 
    isRecording, 
    isProcessingFile, 
    uploadedFileName,
    isTranscribingWithWhisper,
    isModelLoading,
    progressMessage
  } = useTranscription();
  
  return (
    <Card className="w-full border shadow-md">
      <CardContent className="p-4">
        <ScrollArea className="h-[300px] w-full">
          {transcript ? (
            <p className="whitespace-pre-wrap">
              {transcript}
              {isRecording && <span className="animate-pulse">|</span>}
            </p>
          ) : (
            <div className="text-gray-500">
              {isModelLoading ? (
                <div className="flex items-center justify-center flex-col">
                  <div className="animate-pulse flex items-center mb-2">
                    <Download className="h-5 w-5 mr-2 text-blue-500 animate-spin" />
                    <p className="italic">Loading Xenova model...</p>
                  </div>
                  {progressMessage && (
                    <p className="text-sm text-blue-600">{progressMessage}</p>
                  )}
                </div>
              ) : isRecording ? (
                <p className="italic">
                  Listening... Speak now.
                  <span className="animate-pulse">|</span>
                </p>
              ) : isProcessingFile ? (
                <div className="flex items-center justify-center flex-col">
                  {isTranscribingWithWhisper ? (
                    <div className="animate-pulse flex items-center mb-2">
                      <Loader2 className="h-5 w-5 mr-2 text-blue-500 animate-spin" />
                      <p className="italic">Processing with local Xenova model...</p>
                    </div>
                  ) : (
                    <div className="animate-pulse flex items-center mb-2">
                      <FileAudio className="h-5 w-5 mr-2 text-blue-500" />
                      <p className="italic">Processing audio file...</p>
                    </div>
                  )}
                  {uploadedFileName && (
                    <p className="text-sm text-blue-600">File: {uploadedFileName}</p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-2 mb-2 p-2 bg-blue-50 rounded-md">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-blue-700 font-medium">Microphone access required</p>
                      <p className="text-sm text-blue-600">
                        When you press "Start Recording", please allow microphone access when prompted by your browser.
                      </p>
                    </div>
                  </div>
                  <p className="italic mt-2">
                    Press "Start Recording" to begin transcribing or upload an audio file.
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TranscriptionOutput;
