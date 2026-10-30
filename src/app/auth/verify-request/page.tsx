import Link from "next/link";

export default function VerifyRequestPage() {
  return <div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="max-w-md text-center space-y-6">
      <h1 className="text-3xl font-serif font-bold">Vérifiez votre boîte mail</h1>
      <p>Si cette adresse permet la connexion, un lien vous sera envoyé. Pensez à vérifier vos courriers indésirables.</p>
      <Link href="/auth/signin" className="inline-block underline">Revenir à la connexion</Link>
    </div>
  </div>;
}
