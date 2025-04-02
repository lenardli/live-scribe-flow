
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranscription } from '@/context/TranscriptionContext';
import { Mic, MicOff, Copy, Trash2, Upload, FileAudio, Key } from 'lucide-react';
import { toast } from 'sonner';
import LanguageSelector from './LanguageSelector';

const TranscriptionControls: React.FC = () => {
  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    transcript, 
    clearTranscript,
    isProcessingFile,
    handleFileUpload,
    apiKey,
    setApiKey
  } = useTranscription();

  const [showApiKey, setShowApiKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-center items-center">
        <LanguageSelector />
        
        <Button
          variant={isRecording ? "destructive" : "default"}
          onClick={isRecording ? stopRecording : startRecording}
          className={isRecording ? "bg-red-500 hover:bg-red-600" : "bg-transcribe-primary hover:bg-transcribe-secondary"}
          disabled={isProcessingFile}
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
          onClick={triggerFileInput}
          disabled={isRecording || isProcessingFile}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Audio
        </Button>
        <input 
          type="file" 
          ref={fileInputRef}
          accept="audio/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
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
          disabled={!transcript.trim() && !isProcessingFile}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
      
      <div className="bg-blue-50 p-3 rounded-md">
        <div className="flex items-center mb-2">
          <Key className="h-4 w-4 mr-2 text-blue-600" />
          <h3 className="text-blue-700 font-medium">OpenAI API Key</h3>
          {!showApiKey && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-xs" 
              onClick={() => setShowApiKey(true)}
            >
              {apiKey ? "Change" : "Add"}
            </Button>
          )}
        </div>
        
        {showApiKey ? (
          <div className="flex gap-2 items-center">
            <Input
              type="password"
              placeholder="Enter your OpenAI API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowApiKey(false)}
            >
              Save
            </Button>
          </div>
        ) : (
          <p className="text-sm text-blue-600">
            {apiKey ? "API key is set" : "Please add your OpenAI API key to use Whisper transcription"}
          </p>
        )}
        <p className="text-xs mt-2 text-blue-500">
          Whisper-large-v3-turbo will be used for audio file transcription
        </p>
      </div>
    </div>
  );
};

export default TranscriptionControls;
