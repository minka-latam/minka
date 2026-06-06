"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Link as LinkIcon, Play } from "lucide-react";
import NextImage from "next/image";
import { useToast } from "@/components/ui/use-toast";

interface YouTubeLinksProps {
  links: string[];
  onChange: (links: string[]) => void;
}

export function YouTubeLinks({ links, onChange }: YouTubeLinksProps) {
  const [newLink, setNewLink] = useState("");
  const { toast } = useToast();

  const validateYouTubeUrl = (url: string) => {
    // Simple regex to validate YouTube URLs
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const handleAddLink = () => {
    if (!newLink.trim()) {
      toast({
        title: "Enlace vacío",
        description: "Por favor ingresa un enlace de YouTube",
        variant: "destructive",
      });
      return;
    }

    if (!validateYouTubeUrl(newLink)) {
      toast({
        title: "Enlace inválido",
        description: "Por favor ingresa un enlace válido de YouTube",
        variant: "destructive",
      });
      return;
    }

    const updatedLinks = [...links, newLink];
    onChange(updatedLinks);
    setNewLink("");
  };

  const handleRemoveLink = (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    onChange(updatedLinks);
  };

  const extractVideoId = (url: string) => {
    // Try to extract the video ID from various YouTube URL formats
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">
            Agregar enlace de YouTube
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-[#478C5C] focus:ring-1 focus:ring-[#478C5C] outline-none"
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={handleAddLink}
          className="bg-[#478C5C] text-white hover:bg-[#3a7049] rounded-full h-10 px-5"
        >
          Subir
        </Button>
      </div>

      {links.length > 0 && (
        <div className="space-y-3 mt-4">
          <h4 className="font-medium">Enlaces agregados:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map((link, index) => {
              const videoId = extractVideoId(link);
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="aspect-video bg-gray-100">
                    {videoId ? (
                      <div className="relative w-full h-full">
                        <NextImage
                          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                          alt={`YouTube thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-[#478C5C]/80 rounded-full flex items-center justify-center">
                            <Play className="h-6 w-6 text-white" fill="white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No se pudo cargar la vista previa
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <div className="truncate flex-1 text-sm">{link}</div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
