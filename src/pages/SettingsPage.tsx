import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, FolderOpen, Key, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [driveFolderPath, setDriveFolderPath] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "drive_folder_path")
        .single();
      if (data) setDriveFolderPath(data.setting_value);
    };
    fetch();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_settings")
      .upsert({ setting_key: key, setting_value: value }, { onConflict: "setting_key" });
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure Google Drive integration</p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Key className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Google Drive API</h2>
            <p className="text-xs text-muted-foreground">API credentials are stored securely as Cloud secrets</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground">
            To connect Google Drive, you'll need a Google Cloud project with the Drive API enabled.
            API credentials will be stored as secure Cloud secrets — contact your admin or check the settings panel.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
            Drive Destination Folder Path
          </Label>
          <Input
            value={driveFolderPath}
            onChange={(e) => setDriveFolderPath(e.target.value)}
            placeholder="/Production/Uploads/2026"
          />
          <p className="text-xs text-muted-foreground">
            Approved files will be synced to this folder path
          </p>
        </div>

        <Button onClick={() => saveSetting("drive_folder_path", driveFolderPath)} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
