import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Trash2, Upload, X } from "lucide-react";
import {
  ASSET_TYPE_LABELS,
  STRATEGY_TYPE_LABELS,
  INVENTORY_STATUS_LABELS,
  US_STATES,
} from "@/lib/constants";
import type { Tables, Enums } from "@/integrations/supabase/types";

type InventoryProperty = Tables<"inventory_properties">;
type Financials = Tables<"inventory_financials">;
type SourceMeta = Tables<"inventory_source_metadata">;
type InvImage = Tables<"inventory_images">;
type InvDoc = Tables<"inventory_documents">;

type Tab = "details" | "financials" | "media" | "source";

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("details");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  // Property
  const [prop, setProp] = useState<Partial<InventoryProperty>>({
    name: "", address: "", city: "", state: "", zip: "",
    asset_type: null, strategy_type: null, status: "draft",
    description: "", units: null, square_footage: null, year_built: null,
  });

  // Financials
  const [fin, setFin] = useState<Partial<Financials>>({
    asking_price: null, cap_rate: null, noi: null, cash_on_cash: null,
    occupancy_rate: null, debt_amount: null, debt_rate: null,
    annual_revenue: null, annual_expenses: null, notes: "",
  });

  // Source
  const [src, setSrc] = useState<Partial<SourceMeta>>({
    source_type: "", source_contact: "", source_email: "", source_phone: "",
    date_sourced: null, notes: "",
  });

  // Media
  const [images, setImages] = useState<InvImage[]>([]);
  const [docs, setDocs] = useState<InvDoc[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isNew) return;
    Promise.all([
      supabase.from("inventory_properties").select("*").eq("id", id!).single(),
      supabase.from("inventory_financials").select("*").eq("property_id", id!).maybeSingle(),
      supabase.from("inventory_source_metadata").select("*").eq("property_id", id!).maybeSingle(),
      supabase.from("inventory_images").select("*").eq("property_id", id!).order("sort_order"),
      supabase.from("inventory_documents").select("*").eq("property_id", id!).order("created_at"),
    ]).then(([pRes, fRes, sRes, iRes, dRes]) => {
      if (pRes.data) setProp(pRes.data);
      if (fRes.data) setFin(fRes.data);
      if (sRes.data) setSrc(sRes.data);
      setImages(iRes.data ?? []);
      setDocs(dRes.data ?? []);
      setLoading(false);
    });
  }, [id, isNew]);

  const saveProperty = async () => {
    setSaving(true);
    let propertyId = id;

    if (isNew) {
      const { data, error } = await supabase
        .from("inventory_properties")
        .insert({
          name: prop.name || null,
          address: prop.address || null,
          city: prop.city || null,
          state: prop.state || null,
          zip: prop.zip || null,
          asset_type: prop.asset_type || null,
          strategy_type: prop.strategy_type || null,
          status: (prop.status as Enums<"inventory_status">) || "draft",
          description: prop.description || null,
          units: prop.units || null,
          square_footage: prop.square_footage || null,
          year_built: prop.year_built || null,
        })
        .select("id")
        .single();

      if (error || !data) {
        toast({ title: "Error", description: error?.message ?? "Failed to create", variant: "destructive" });
        setSaving(false);
        return;
      }
      propertyId = data.id;
    } else {
      await supabase.from("inventory_properties").update({
        name: prop.name || null,
        address: prop.address || null,
        city: prop.city || null,
        state: prop.state || null,
        zip: prop.zip || null,
        asset_type: prop.asset_type || null,
        strategy_type: prop.strategy_type || null,
        status: (prop.status as Enums<"inventory_status">) || "draft",
        description: prop.description || null,
        units: prop.units || null,
        square_footage: prop.square_footage || null,
        year_built: prop.year_built || null,
      }).eq("id", id!);
    }

    // Upsert financials
    await supabase.from("inventory_financials").upsert({
      property_id: propertyId!,
      asking_price: fin.asking_price,
      cap_rate: fin.cap_rate,
      noi: fin.noi,
      cash_on_cash: fin.cash_on_cash,
      occupancy_rate: fin.occupancy_rate,
      debt_amount: fin.debt_amount,
      debt_rate: fin.debt_rate,
      annual_revenue: fin.annual_revenue,
      annual_expenses: fin.annual_expenses,
      notes: fin.notes || null,
    }, { onConflict: "property_id" });

    // Upsert source
    await supabase.from("inventory_source_metadata").upsert({
      property_id: propertyId!,
      source_type: src.source_type || null,
      source_contact: src.source_contact || null,
      source_email: src.source_email || null,
      source_phone: src.source_phone || null,
      date_sourced: src.date_sourced || null,
      notes: src.notes || null,
    }, { onConflict: "property_id" });

    setSaving(false);
    toast({ title: "Saved" });
    if (isNew) navigate(`/admin/inventory/${propertyId}`, { replace: true });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !id || isNew) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const path = `${id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("inventory-images")
        .upload(path, file);

      if (!upErr) {
        const { data: imgData } = await supabase
          .from("inventory_images")
          .insert({ property_id: id, storage_path: path, file_name: file.name, sort_order: images.length })
          .select()
          .single();
        if (imgData) setImages((prev) => [...prev, imgData]);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !id || isNew) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const path = `${id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("inventory-documents")
        .upload(path, file);

      if (!upErr) {
        const { data: docData } = await supabase
          .from("inventory_documents")
          .insert({ property_id: id, storage_path: path, file_name: file.name })
          .select()
          .single();
        if (docData) setDocs((prev) => [...prev, docData]);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const deleteImage = async (img: InvImage) => {
    await supabase.storage.from("inventory-images").remove([img.storage_path]);
    await supabase.from("inventory_images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const deleteDoc = async (doc: InvDoc) => {
    await supabase.storage.from("inventory-documents").remove([doc.storage_path]);
    await supabase.from("inventory_documents").delete().eq("id", doc.id);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const deleteProperty = async () => {
    if (!id || isNew) return;
    if (!confirm("Delete this property? This cannot be undone.")) return;
    await supabase.from("inventory_properties").delete().eq("id", id);
    toast({ title: "Property deleted" });
    navigate("/admin/inventory");
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from("inventory-images").getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const numField = (
    label: string,
    value: number | null | undefined,
    onChange: (v: number | null) => void,
    opts?: { suffix?: string; step?: string; placeholder?: string }
  ) => (
    <div className="space-y-2">
      <Label>{label}{opts?.suffix ? ` (${opts.suffix})` : ""}</Label>
      <Input
        type="number"
        step={opts?.step ?? "1"}
        placeholder={opts?.placeholder ?? ""}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      />
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "financials", label: "Financials" },
    { key: "media", label: "Media" },
    { key: "source", label: "Source" },
  ];

  return (
    <div>
      <button onClick={() => navigate("/admin/inventory")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Inventory
      </button>

      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {isNew ? "Add Property" : prop.name || "Untitled Property"}
        </h1>
        <div className="flex gap-2">
          {!isNew && (
            <Button variant="outline" size="sm" onClick={deleteProperty} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button size="sm" onClick={saveProperty} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 sm:p-8">
        {tab === "details" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Property Name</Label>
                <Input placeholder="Sunset Medical Plaza" value={prop.name ?? ""} onChange={(e) => setProp((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input placeholder="123 Main St" value={prop.address ?? ""} onChange={(e) => setProp((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={prop.city ?? ""} onChange={(e) => setProp((p) => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={prop.state ?? ""} onChange={(e) => setProp((p) => ({ ...p, state: e.target.value }))}>
                    <option value="">Select</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>ZIP</Label>
                  <Input value={prop.zip ?? ""} onChange={(e) => setProp((p) => ({ ...p, zip: e.target.value }))} maxLength={10} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={prop.asset_type ?? ""} onChange={(e) => setProp((p) => ({ ...p, asset_type: (e.target.value || null) as any }))}>
                  <option value="">Select</option>
                  {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Strategy</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={prop.strategy_type ?? ""} onChange={(e) => setProp((p) => ({ ...p, strategy_type: (e.target.value || null) as any }))}>
                  <option value="">Select</option>
                  {Object.entries(STRATEGY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={prop.status ?? "draft"} onChange={(e) => setProp((p) => ({ ...p, status: e.target.value as any }))}>
                  {Object.entries(INVENTORY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {numField("Units", prop.units, (v) => setProp((p) => ({ ...p, units: v })), { placeholder: "24" })}
              {numField("Square Footage", prop.square_footage, (v) => setProp((p) => ({ ...p, square_footage: v })), { placeholder: "15000" })}
              {numField("Year Built", prop.year_built, (v) => setProp((p) => ({ ...p, year_built: v })), { placeholder: "2005" })}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={prop.description ?? ""} onChange={(e) => setProp((p) => ({ ...p, description: e.target.value }))} rows={4} />
            </div>
          </div>
        )}

        {tab === "financials" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {numField("Asking Price", fin.asking_price, (v) => setFin((f) => ({ ...f, asking_price: v })), { suffix: "$", placeholder: "3500000" })}
              {numField("Cap Rate", fin.cap_rate, (v) => setFin((f) => ({ ...f, cap_rate: v })), { suffix: "%", step: "0.1", placeholder: "6.5" })}
              {numField("NOI", fin.noi, (v) => setFin((f) => ({ ...f, noi: v })), { suffix: "$", placeholder: "227500" })}
              {numField("Cash-on-Cash", fin.cash_on_cash, (v) => setFin((f) => ({ ...f, cash_on_cash: v })), { suffix: "%", step: "0.1", placeholder: "8.0" })}
              {numField("Occupancy Rate", fin.occupancy_rate, (v) => setFin((f) => ({ ...f, occupancy_rate: v })), { suffix: "%", step: "0.1", placeholder: "95" })}
              {numField("Debt Amount", fin.debt_amount, (v) => setFin((f) => ({ ...f, debt_amount: v })), { suffix: "$" })}
              {numField("Debt Rate", fin.debt_rate, (v) => setFin((f) => ({ ...f, debt_rate: v })), { suffix: "%", step: "0.01" })}
              {numField("Annual Revenue", fin.annual_revenue, (v) => setFin((f) => ({ ...f, annual_revenue: v })), { suffix: "$" })}
              {numField("Annual Expenses", fin.annual_expenses, (v) => setFin((f) => ({ ...f, annual_expenses: v })), { suffix: "$" })}
            </div>
            <div className="space-y-2">
              <Label>Financial Notes</Label>
              <Textarea value={fin.notes ?? ""} onChange={(e) => setFin((f) => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </div>
        )}

        {tab === "media" && (
          <div className="space-y-8">
            {isNew ? (
              <p className="text-sm text-muted-foreground">Save the property first before uploading media.</p>
            ) : (
              <>
                {/* Images */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Images</h3>
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" className="gap-2 pointer-events-none" tabIndex={-1}>
                        <Upload className="h-4 w-4" /> Upload Images
                      </Button>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>
                  {images.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">No images uploaded yet.</p>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {images.map((img) => (
                        <div key={img.id} className="group relative overflow-hidden rounded-lg border">
                          <img src={getImageUrl(img.storage_path)} alt={img.file_name ?? ""} className="aspect-square w-full object-cover" />
                          <button
                            onClick={() => deleteImage(img)}
                            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{img.file_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Documents</h3>
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" className="gap-2 pointer-events-none" tabIndex={-1}>
                        <Upload className="h-4 w-4" /> Upload Documents
                      </Button>
                      <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv" multiple className="hidden" onChange={handleDocUpload} disabled={uploading} />
                    </label>
                  </div>
                  {docs.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">No documents uploaded yet.</p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {docs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                          <p className="text-sm text-foreground">{doc.file_name}</p>
                          <button onClick={() => deleteDoc(doc)} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {uploading && <p className="text-sm text-muted-foreground">Uploading…</p>}
              </>
            )}
          </div>
        )}

        {tab === "source" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Source Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={src.source_type ?? ""} onChange={(e) => setSrc((s) => ({ ...s, source_type: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="broker">Broker</option>
                  <option value="direct">Direct / Off-Market</option>
                  <option value="referral">Referral</option>
                  <option value="research">Research</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Date Sourced</Label>
                <Input type="date" value={src.date_sourced ?? ""} onChange={(e) => setSrc((s) => ({ ...s, date_sourced: e.target.value || null }))} />
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input value={src.source_contact ?? ""} onChange={(e) => setSrc((s) => ({ ...s, source_contact: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input type="email" value={src.source_email ?? ""} onChange={(e) => setSrc((s) => ({ ...s, source_email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input type="tel" value={src.source_phone ?? ""} onChange={(e) => setSrc((s) => ({ ...s, source_phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Source Notes</Label>
              <Textarea value={src.notes ?? ""} onChange={(e) => setSrc((s) => ({ ...s, notes: e.target.value }))} rows={3} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
