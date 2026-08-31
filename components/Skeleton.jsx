export default function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-3/4 rounded bg-zinc-800" />
      <div className="h-4 w-full rounded bg-zinc-800" />
      <div className="h-4 w-5/6 rounded bg-zinc-800" />
      <div className="h-4 w-2/3 rounded bg-zinc-800" />
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="h-20 rounded-lg bg-zinc-800" />
        <div className="h-20 rounded-lg bg-zinc-800" />
        <div className="h-20 rounded-lg bg-zinc-800" />
      </div>
    </div>
  );
}
