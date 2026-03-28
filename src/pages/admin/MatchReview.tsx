export default function MatchReview() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Match Review</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review and approve property matches for exchange requests.
      </p>
      <div className="mt-8 rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">No match runs yet. Run matching from a request detail page.</p>
      </div>
    </div>
  );
}
