
import React from 'react';
import { useTranscription, TranscriptionModel } from '@/context/TranscriptionContext';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { InfoIcon } from 'lucide-react';

const ModelSelector: React.FC = () => {
  const { 
    selectedModel, 
    setSelectedModel, 
    availableModels,
    isModelLoading,
    isRecording,
    isProcessingFile
  } = useTranscription();

  const handleModelChange = (modelId: string) => {
    const selectedModel = availableModels.find(model => model.id === modelId);
    if (selectedModel) {
      setSelectedModel(selectedModel);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="flex items-center">
            <span className="text-sm mr-2 text-gray-700">Model:</span>
            <InfoIcon className="h-4 w-4 text-gray-500 cursor-help" />
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-4">
          <div className="space-y-2">
            <h4 className="font-medium">Transcription Model Selection</h4>
            <p className="text-sm text-muted-foreground">
              Choose between different Whisper models. Larger models are more accurate but take longer to load and process audio.
            </p>
            <ul className="text-xs space-y-1 list-disc pl-4">
              {availableModels.map(model => (
                <li key={model.id} className="text-gray-700">
                  <span className="font-semibold">{model.name}:</span> {model.description} ({model.size})
                </li>
              ))}
            </ul>
          </div>
        </HoverCardContent>
      </HoverCard>

      <Select 
        value={selectedModel.id}
        onValueChange={handleModelChange}
        disabled={isRecording || isProcessingFile || isModelLoading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {availableModels.map(model => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector;
