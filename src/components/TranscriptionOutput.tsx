
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranscription } from '@/context/TranscriptionContext';

const TranscriptionOutput: React.FC = () => {
  const { transcript, isRecording } = useTranscription();
  
  return (
    <Card className="w-full border shadow-md">
      <CardContent className="p-4">
        <ScrollArea className="h-[300px] w-full">
          <p className="whitespace-pre-wrap">
            {transcript || (
              <span className="text-gray-400 italic">
                {isRecording 
                  ? 'Listening... Speak now.'
                  : 'Press "Start Recording" to begin transcribing.'}
              </span>
            )}
            {isRecording && <span className="animate-pulse">|</span>}
          </p>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TranscriptionOutput;
