"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = { id: string; sku: string; title: string; photoUrl: string | null };
type Line = { productId: string; title: string; expectedQty: number };

export default function NewInboundPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");

  const [showNewProduct, setShowNewProduct] = useState(false);
  const [sku, setSku] = useState("");
  const [title, setTitle] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [qty, setQty] = useState(50);
  const [selectedExisting, setSelectedExisting] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
  }, []);

  async function addNewProduct() {
    setError("");
    if (!sku || !title) { setError("SKU and title are required."); return; }
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, title, photoUrl: photo }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setProducts([data.product, ...products]);
    setLines([...lines, { productId: data.product.id, title: data.product.title, expectedQty: qty }]);
    setSku(""); setTitle(""); setPhoto(null); setQty(50);
    setShowNewProduct(false);
  }

  function addExistingProduct() {
    const p = products.find((p) => p.id === selectedExisting);
    if (!p) return;
    setLines([...lines, { productId: p.id, title: p.title, expectedQty: qty }]);
    setSelectedExisting(""); setQty(50);
  }

  async function submit() {
    if (lines.length === 0) { setError("Add at least one product."); return; }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/inbound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, items: lines.map((l) => ({ productId: l.productId, expectedQty: l.expectedQty })) }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error); return; }
    router.push(`/dashboard/inbound/${data.shipment.id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-1">Send stock in</h1>
      <p className="text-muted text-sm mb-6">
        Tell us what's coming so our team recognizes it on arrival. We'll count it in and add it to your inventory.
      </p>

      {lines.length > 0 && (
        <div className="card divide-y divide-border mb-4">
          {lines.map((l, i) => (
            <div key={i} className="flex justify-between p-3 text-sm">
              <span>{l.title}</span>
              <span className="text-muted">{l.expectedQty} units</span>
            </div>
          ))}
        </div>
      )}

      <div className="card p-5 mb-4 space-y-4">
        {!showNewProduct ? (
          <>
            <div>
              <label className="label mb-2 block">Existing product</label>
              <select className="input" value={selectedExisting} onChange={(e) => setSelectedExisting(e.target.value)}>
                <option value="">Select a product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="label mb-2 block">Expected quantity</label>
              <input type="number" min={1} className="input" value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} />
            </div>
            <div className="flex gap-3">
              <button onClick={addExistingProduct} disabled={!selectedExisting} className="btn-secondary flex-1">Add to shipment</button>
              <button onClick={() => setShowNewProduct(true)} className="btn-primary flex-1">+ New product</button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="label mb-2 block">Product photo</label>
              <label className="flex items-center justify-center h-28 border border-dashed border-border rounded-xl cursor-pointer text-sm text-muted overflow-hidden">
                {photo ? <img src={photo} className="w-full h-full object-cover" /> : <span>📷 Choose photo</span>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPhoto(URL.createObjectURL(f));
                }} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label mb-2 block">SKU</label>
                <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-123" />
              </div>
              <div>
                <label className="label mb-2 block">Quantity</label>
                <input type="number" min={1} className="input" value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} />
              </div>
            </div>
            <div>
              <label className="label mb-2 block">Product title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNewProduct(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={addNewProduct} className="btn-primary flex-1">Add to shipment</button>
            </div>
          </>
        )}
      </div>

      <div className="mb-4">
        <label className="label mb-2 block">Notes for the warehouse (optional)</label>
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
      <button onClick={submit} disabled={submitting || lines.length === 0} className="btn-primary w-full">
        {submitting ? "Creating…" : "Create inbound shipment"}
      </button>
    </div>
  );
}
