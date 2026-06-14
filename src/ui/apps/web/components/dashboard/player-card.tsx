import { cn } from "@/lib/utils";

type PlayerCardProps = {
  name: string;
  position: string;
  imageUrl?: string | null;
  club?: string | null;
  nationality?: string | null;
  className?: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PlayerCard({
  name,
  position,
  imageUrl,
  club,
  nationality,
  className,
}: PlayerCardProps) {
  return (
    <div
      className={cn(
        "relative h-44 w-32 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-700 to-slate-900 shadow-xl",
        className,
      )}
    >
      <div className="absolute top-3 left-3 rounded-md bg-black/40 px-2 py-1 text-xs font-bold text-white">
        {position}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent" />
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- player photos come from external providers
        <img
          src={imageUrl}
          alt={name}
          className="absolute inset-0 size-full object-cover object-top"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-slate-800 text-lg font-bold text-white/70">
          {getInitials(name)}
        </div>
      )}
      <div className="absolute right-0 bottom-0 left-0 p-3">
        <p className="truncate text-xs font-semibold text-white">{name}</p>
        {club ? (
          <p className="truncate text-[10px] text-gray-300">{club}</p>
        ) : null}
        {nationality ? (
          <p className="truncate text-[10px] text-gray-400">{nationality}</p>
        ) : null}
      </div>
    </div>
  );
}
