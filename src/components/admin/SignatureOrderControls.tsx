"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { moveSignature } from "@/actions/product";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignatureOrderControls({ 
  productId, 
  isFirst, 
  isLast 
}: { 
  productId: string; 
  isFirst: boolean; 
  isLast: boolean; 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMove = async (direction: "UP" | "DOWN") => {
    setLoading(true);
    await moveSignature(productId, direction);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-1">
      <button 
        disabled={isFirst || loading} 
        onClick={() => handleMove("UP")}
        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
      <button 
        disabled={isLast || loading}
        onClick={() => handleMove("DOWN")}
        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
      >
        <ArrowDown className="w-4 h-4" />
      </button>
    </div>
  );
}
