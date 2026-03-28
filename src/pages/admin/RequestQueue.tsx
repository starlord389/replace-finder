export default function RequestQueue() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Exchange Requests</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review and manage incoming 1031 exchange requests.
      </p>
      <div className="mt-8 rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">No requests yet. Requests will appear here once clients submit them.</p>
      </div>
    </div>
  );
}
