"use client";

import { useState } from "react";
import { updateSettings } from "@/actions/settings";
import { Save, Check, AlertTriangle, Clock, MapPin, Phone, Mail } from "lucide-react";

function DayScheduleInput({ 
  label, 
  name, 
  value, 
  onChange 
}: { 
  label: string; 
  name: string; 
  value: string; 
  onChange: (name: string, value: string) => void;
}) {
  const isClosed = value === "Fermé" || !value;
  
  let slot1 = { open: "08:00", close: "19:30" };
  let slot2 = { open: "", close: "" };
  let hasSlot2 = false;

  if (!isClosed && value !== "Fermé") {
    // Parse old format or new format
    // Old format might be "08:00 - 19:30". New format is "08:00-19:30"
    const cleanValue = value.replace(/\s+/g, '');
    const slots = cleanValue.split(',');
    
    if (slots[0]) {
      const [o, c] = slots[0].split('-');
      slot1 = { open: o || "08:00", close: c || "19:30" };
    }
    if (slots[1]) {
      const [o, c] = slots[1].split('-');
      slot2 = { open: o || "", close: c || "" };
      hasSlot2 = true;
    }
  }

  const handleUpdate = (closed: boolean, s1: typeof slot1, s2: typeof slot2, hasS2: boolean) => {
    if (closed) {
      onChange(name, "Fermé");
    } else {
      let str = `${s1.open}-${s1.close}`;
      if (hasS2 && s2.open && s2.close) {
        str += `, ${s2.open}-${s2.close}`;
      }
      onChange(name, str);
    }
  };

  return (
    <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
      <div className="flex items-center justify-between">
        <label className="font-bold text-foreground">{label}</label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input 
            type="checkbox" 
            checked={isClosed} 
            onChange={(e) => handleUpdate(e.target.checked, slot1, slot2, hasSlot2)}
            className="w-4 h-4 text-destructive border-border rounded focus:ring-destructive accent-destructive"
          />
          <span className={isClosed ? "text-destructive font-bold" : "text-muted-foreground"}>Fermé</span>
        </label>
      </div>

      {!isClosed && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-16">Matin</span>
            <input type="time" value={slot1.open} onChange={(e) => handleUpdate(false, { ...slot1, open: e.target.value }, slot2, hasSlot2)} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            <span className="text-muted-foreground">-</span>
            <input type="time" value={slot1.close} onChange={(e) => handleUpdate(false, { ...slot1, close: e.target.value }, slot2, hasSlot2)} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>

          {hasSlot2 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-16">Aprem</span>
              <input type="time" value={slot2.open} onChange={(e) => handleUpdate(false, slot1, { ...slot2, open: e.target.value }, true)} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <span className="text-muted-foreground">-</span>
              <input type="time" value={slot2.close} onChange={(e) => handleUpdate(false, slot1, { ...slot2, close: e.target.value }, true)} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <button type="button" onClick={() => handleUpdate(false, slot1, { open: "", close: "" }, false)} className="text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg transition-colors text-sm font-bold">
                ✕
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => handleUpdate(false, slot1, { open: "14:00", close: "19:30" }, true)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              + Ajouter une pause midi
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsClient({ initialSettings }: { initialSettings: any }) {
  const [formData, setFormData] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    
    try {
      await updateSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Erreur de sauvegarde", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleScheduleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* Mode Vacances */}
      <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded-r-2xl flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-lg text-destructive mb-2">Mode Vacances / Fermeture exceptionnelle</h3>
          <p className="text-destructive/80 mb-4 text-sm">
            Activez ce mode pour afficher un message "Actuellement fermé pour congés" sur la page Contact et masquer les horaires habituels.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                name="isVacationMode"
                checked={formData.isVacationMode}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </div>
            <span className="font-medium text-destructive">Activer le mode Vacances</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coordonnées */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Phone className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Coordonnées</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Numéro de Téléphone</label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+33 1 23 45 67 89"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">Format recommandé : +33 1 23 45 67 89</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Adresse Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Adresse Postale</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Horaires d'ouverture */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Horaires d'Ouverture</h2>
          </div>

          <div className="space-y-4">
            <DayScheduleInput 
              label="Lundi" 
              name="hoursMonday" 
              value={formData.hoursMonday} 
              onChange={handleScheduleChange} 
            />

            <DayScheduleInput 
              label="Mardi" 
              name="hoursTuesday" 
              value={formData.hoursTuesday} 
              onChange={handleScheduleChange} 
            />

            <DayScheduleInput 
              label="Mercredi" 
              name="hoursWednesday" 
              value={formData.hoursWednesday} 
              onChange={handleScheduleChange} 
            />

            <DayScheduleInput 
              label="Jeudi" 
              name="hoursThursday" 
              value={formData.hoursThursday} 
              onChange={handleScheduleChange} 
            />

            <DayScheduleInput 
              label="Vendredi" 
              name="hoursFriday" 
              value={formData.hoursFriday} 
              onChange={handleScheduleChange} 
            />

            <DayScheduleInput 
              label="Samedi" 
              name="hoursSaturday" 
              value={formData.hoursSaturday} 
              onChange={handleScheduleChange} 
            />

            <DayScheduleInput 
              label="Dimanche" 
              name="hoursSunday" 
              value={formData.hoursSunday} 
              onChange={handleScheduleChange} 
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-border">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              Enregistré !
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
            </>
          )}
        </button>
      </div>

    </form>
  );
}
