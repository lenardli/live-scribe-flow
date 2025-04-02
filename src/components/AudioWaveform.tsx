
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  isRecording: boolean;
  className?: string;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ isRecording, className }) => {
  const [bars] = useState<number[]>(Array.from({ length: 30 }, (_, i) => i));
  const [amplitudes, setAmplitudes] = useState<number[]>(Array(30).fill(0.1));

  useEffect(() => {
    if (!isRecording) {
      setAmplitudes(Array(30).fill(0.1));
      return;
    }

    const interval = setInterval(() => {
      setAmplitudes(prev => 
        prev.map(() => isRecording ? Math.random() * 0.8 + 0.2 : 0.1)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className={cn('flex items-center justify-center h-16 gap-1', className)}>
      {bars.map((_, index) => (
        <div
          key={index}
          className={cn(
            'w-1 bg-transcribe-primary rounded-full transition-transform duration-100',
            isRecording ? 'opacity-100' : 'opacity-30'
          )}
          style={{
            height: `${amplitudes[index] * 100}%`,
            transform: `scaleY(${amplitudes[index]})`,
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;
