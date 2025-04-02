
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranscription } from '@/context/TranscriptionContext';
import { Info } from 'lucide-react';

const TranscriptionOutput: React.FC = () => {
  const { transcript, isRecording } = useTranscription();
  
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
              {isRecording ? (
                <p className="italic">
                  Listening... Speak now.
                  <span className="animate-pulse">|</span>
                </p>
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
                    Press "Start Recording" to begin transcribing.
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
