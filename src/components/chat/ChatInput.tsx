"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, Image as ImageIcon, Loader2, X } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string, image?: string) => void;
  disabled?: boolean;
  isTyping?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  isTyping = false,
  placeholder = "Escribe un gasto o pregunta...",
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const content = message.trim();
    if (!content && !selectedImage) return;

    onSend(content || "(imagen adjunta)", selectedImage || undefined);
    setMessage("");
    setSelectedImage(null);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isTyping) {
        handleSend();
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es muy grande. Máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // TODO: Stop recording and transcribe
      setIsRecording(false);
      return;
    }

    // TODO: Implement audio recording with transcription
    // For now, just show a placeholder
    setIsRecording(true);
    setTimeout(() => setIsRecording(false), 3000);
  };

  const isDisabled = disabled || isTyping;
  const canSend = (message.trim() || selectedImage) && !isDisabled;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Image preview */}
      {selectedImage && (
        <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
          <img
            src={selectedImage}
            alt="Preview"
            className="h-16 w-16 object-cover rounded-lg"
          />
          <span className="text-sm text-muted-foreground flex-1 truncate">
            Imagen lista para enviar
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-sm text-orange-700 dark:text-orange-300">
            Grabando...
          </span>
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Image button */}
        <Button
          variant="outline"
          size="icon"
          className="flex-shrink-0 h-12 w-12 rounded-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
        >
          <ImageIcon className="h-5 w-5" />
        </Button>

        {/* Mic button */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "flex-shrink-0 h-12 w-12 rounded-full",
            isRecording && "bg-orange-100 border-orange-300 dark:bg-orange-900/30"
          )}
          onClick={handleMicClick}
          disabled={isDisabled}
        >
          <Mic className={cn("h-5 w-5", isRecording && "text-orange-500")} />
        </Button>

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          className="min-h-12 max-h-32 rounded-2xl resize-none bg-background border-border shadow-soft"
          rows={1}
        />

        {/* Send button */}
        <Button
          size="icon"
          className="flex-shrink-0 h-12 w-12 rounded-full shadow-lg"
          onClick={handleSend}
          disabled={!canSend}
        >
          {isTyping ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
