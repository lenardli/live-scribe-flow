
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranscription } from '@/context/TranscriptionContext';
import { Mic, MicOff, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import LanguageSelector from './LanguageSelector';

const TranscriptionControls: React.FC = () => {
  const { isRecording, startRecording, stopRecording, transcript, clearTranscript } = useTranscription();

  const handleCopyTranscript = async () => {
    if (!transcript.trim()) {
      toast.error('No text to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(transcript);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center items-center">
      <LanguageSelector />
      
      <Button
        variant={isRecording ? "destructive" : "default"}
        onClick={isRecording ? stopRecording : startRecording}
        className={isRecording ? "bg-red-500 hover:bg-red-600" : "bg-transcribe-primary hover:bg-transcribe-secondary"}
      >
        {isRecording ? (
          <>
            <MicOff className="mr-2 h-4 w-4" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        onClick={handleCopyTranscript}
        disabled={!transcript.trim()}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy Text
      </Button>
      
      <Button
        variant="outline"
        onClick={clearTranscript}
        disabled={!transcript.trim()}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Clear
      </Button>
    </div>
  );
};

export default TranscriptionControls;
