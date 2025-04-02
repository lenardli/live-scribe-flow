
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TranscriptionControls from '@/components/TranscriptionControls';
import TranscriptionOutput from '@/components/TranscriptionOutput';
import AudioWaveform from '@/components/AudioWaveform';
import { useTranscription } from '@/context/TranscriptionContext';

const Index = () => {
  const { isRecording } = useTranscription();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-transcribe-accent flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transcribe-secondary mb-2">Live Scribe Flow</h1>
          <p className="text-lg text-gray-600">Real-time Speech to Text Transcription</p>
        </div>

        <Card className="mb-6 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-transcribe-secondary flex items-center justify-between">
              <span>Audio Transcription</span>
              <span className={`text-sm px-3 py-1 rounded-full ${isRecording ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                {isRecording ? 'Recording' : 'Ready'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AudioWaveform isRecording={isRecording} className="mb-6" />
            <TranscriptionControls />
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-transcribe-secondary">Transcription</h2>
          <TranscriptionOutput />
        </div>

        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Made with Lovable 💙</p>
          <p className="mt-1">
            Note: This app requires browser support for the Web Speech API. 
            For best results, use Chrome, Edge, or Safari.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
