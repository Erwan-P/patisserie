import { getVerifiedAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/actions/settings";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Paramètres de la Boutique - Administration",
};

export default async function SettingsPage() {
  if (!await getVerifiedAdminSession()) redirect("/admin/2fa");
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Paramètres de la Boutique</h1>
        <p className="text-muted-foreground">Gérez vos coordonnées, adresse, et horaires d&apos;ouverture.</p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
