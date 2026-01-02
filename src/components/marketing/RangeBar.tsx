"use client";

interface RangeBarProps {
  min: number;
  max: number;
  typical: number;
  color?: "electric-blue" | "blue";
}

export function RangeBar({
  min,
  max,
  typical,
  color = "electric-blue",
}: RangeBarProps) {
  const range = max - min;
  const raw = range > 0 ? ((typical - min) / range) * 100 : 50;
  const pos = Math.max(0, Math.min(100, raw));

  const dotClass = color === "blue" ? "bg-blue-600" : "bg-electric-blue-600";

  return (
    <div className="relative">
      <div className="h-2 w-full rounded-full bg-slate-200" />

      <div
        className="absolute top-1/2"
        style={{ left: `${pos}%`, transform: "translate(-50%, -50%)" }}
        aria-hidden="true"
      >
        <div
          className={[
            "absolute left-1/2 top-1/2",
            "h-6 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full",
            dotClass,
            "opacity-25",
          ].join(" ")}
        />
        <div className={["h-3 w-3 rounded-full", dotClass, "ring-4 ring-white shadow-sm"].join(" ")} />
      </div>
    </div>
  );
}
