
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
import { InfoIcon, Download, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const ModelSelector: React.FC = () => {
  const { 
    selectedModel, 
    setSelectedModel, 
    availableModels,
    isModelLoading,
    isRecording,
    isProcessingFile,
    isModelInitialized,
    loadModel,
    progressMessage
  } = useTranscription();

  const handleModelChange = (modelId: string) => {
    const selectedModel = availableModels.find(model => model.id === modelId);
    if (selectedModel) {
      setSelectedModel(selectedModel);
    }
  };

  const handleLoadModel = async () => {
    try {
      await loadModel();
    } catch (error) {
      console.error("Failed to load model:", error);
    }
  };

  const isDisabled = isRecording || isProcessingFile || isModelLoading;

  return (
    <div className="flex flex-col space-y-2">
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
                Choose between different Xenova models. Larger models are more accurate but take longer to load and process audio.
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
          disabled={isDisabled}
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
      
      <Button
        variant={isModelInitialized ? "outline" : "default"}
        onClick={handleLoadModel}
        disabled={isDisabled}
        className="self-start"
      >
        {isModelInitialized ? (
          <>
            <Check className="mr-2 h-4 w-4 text-green-500" />
            Model Loaded
          </>
        ) : isModelLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progressMessage || 'Loading Model...'}
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Load Model
          </>
        )}
      </Button>

      {!isModelInitialized && !isModelLoading && (
        <Alert className="mt-2 bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800">Model needs to be loaded</AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            You must load the speech recognition model before you can transcribe audio files or start recording.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ModelSelector;
