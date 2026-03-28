export default function InventoryList() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Internal Inventory</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage replacement properties in the internal inventory.
      </p>
      <div className="mt-8 rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">No properties in inventory yet. Add properties to start matching.</p>
      </div>
    </div>
  );
}
