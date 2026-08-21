import SuccesClient from "./SuccesClient";
import { Suspense } from "react";

export default function SuccesPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-20 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <Suspense fallback={<div className="animate-pulse">Vérification de votre commande...</div>}>
          <SuccesClient />
        </Suspense>
      </div>
    </main>
  );
}
