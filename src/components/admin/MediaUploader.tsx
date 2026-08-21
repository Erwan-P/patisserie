"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, ArrowUp, ArrowDown, Video, Image as ImageIcon } from "lucide-react";

export type MediaItem = {
  id: string; // unique local ID for react keys
  file?: File;
  url?: string;
  type: "IMAGE" | "VIDEO";
  size: number;
};

const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20 MB

export default function MediaUploader({ 
  initialMedia = [], 
  onChange 
}: { 
  initialMedia?: MediaItem[], 
  onChange: (media: MediaItem[]) => void 
}) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSize = media.reduce((acc, item) => acc + item.size, 0);
  const sizePercentage = Math.min((totalSize / MAX_TOTAL_SIZE) * 100, 100);

  useEffect(() => {
    onChange(media);
  }, [media]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const newFiles = Array.from(e.target.files);
    const newMediaItems: MediaItem[] = [];

    let tempTotal = totalSize;

    for (const file of newFiles) {
      if (tempTotal + file.size > MAX_TOTAL_SIZE) {
        alert(`Le fichier ${file.name} dépasse la limite totale de 20 Mo.`);
        continue;
      }
      
      tempTotal += file.size;
      const isVideo = file.type.startsWith("video/");
      
      newMediaItems.push({
        id: Math.random().toString(36).substring(7),
        file,
        url: URL.createObjectURL(file),
        type: isVideo ? "VIDEO" : "IMAGE",
        size: file.size
      });
    }

    if (newMediaItems.length > 0) {
      setMedia(prev => [...prev, ...newMediaItems]);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newMedia = [...media];
    const temp = newMedia[index - 1];
    newMedia[index - 1] = newMedia[index];
    newMedia[index] = temp;
    setMedia(newMedia);
  };

  const moveDown = (index: number) => {
    if (index === media.length - 1) return;
    const newMedia = [...media];
    const temp = newMedia[index + 1];
    newMedia[index + 1] = newMedia[index];
    newMedia[index] = temp;
    setMedia(newMedia);
  };

  return (
    <div className="space-y-4">
      {/* ProgressBar (Simplified to text only) */}
      <div className="flex justify-end text-xs font-bold text-muted-foreground mb-2">
        <span className={totalSize > MAX_TOTAL_SIZE ? "text-destructive" : ""}>
          Espace utilisé : {(totalSize / 1024 / 1024).toFixed(1)} Mo / 20 Mo
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {media.map((item, index) => (
          <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-muted/50">
            {item.type === "VIDEO" ? (
              <video src={item.url} className="w-full h-full object-cover" autoPlay muted loop />
            ) : (
              <img src={item.url} alt="media" className="w-full h-full object-cover" />
            )}
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              <div className="bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                {item.type === "VIDEO" ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
              </div>
              {index === 0 && (
                <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-md">
                  Principale {item.type === "VIDEO" ? "(& Partout)" : ""}
                </div>
              )}
            </div>

            {/* Actions overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <div className="flex gap-2">
                {index > 0 && (
                  <button type="button" onClick={() => moveUp(index)} className="p-2 bg-white/20 hover:bg-white text-white hover:text-black rounded-lg transition-colors">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}
                {index < media.length - 1 && (
                  <button type="button" onClick={() => moveDown(index)} className="p-2 bg-white/20 hover:bg-white text-white hover:text-black rounded-lg transition-colors">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button type="button" onClick={() => removeMedia(item.id)} className="p-2 bg-destructive/80 hover:bg-destructive text-white rounded-lg transition-colors mt-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square rounded-xl border-2 border-dashed border-border hover:bg-muted/50 transition-colors flex flex-col items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Upload className="w-6 h-6 mb-2 opacity-50" />
          <span className="text-xs font-bold uppercase tracking-widest text-center px-4">Ajouter un média</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/mp4,video/webm"
        multiple
      />
    </div>
  );
}
