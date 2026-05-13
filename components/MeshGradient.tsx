/** Vibrant layered-blob mesh gradient with a film-grain overlay. Pure CSS, no JS. */
export default function MeshGradient({
  className = "",
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0" style={{ background: "#0a0414" }} />
      <Blob
        className="-left-[15%] -top-[25%] h-[80%] w-[60%]"
        color="rgba(124, 92, 255, 0.85)"
        animate={animate}
        delay="0s"
      />
      <Blob
        className="left-[35%] -top-[30%] h-[85%] w-[55%]"
        color="rgba(255, 92, 196, 0.7)"
        animate={animate}
        delay="-7s"
      />
      <Blob
        className="-right-[20%] top-[20%] h-[90%] w-[60%]"
        color="rgba(54, 213, 255, 0.55)"
        animate={animate}
        delay="-14s"
      />
      <Blob
        className="left-[10%] bottom-[-30%] h-[75%] w-[55%]"
        color="rgba(255, 176, 87, 0.45)"
        animate={animate}
        delay="-21s"
      />
      {/* darken edges so text panel reads */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 30%, transparent 35%, rgba(5,3,12,0.55) 100%)",
        }}
      />
      <div className="grain-overlay absolute inset-0 mix-blend-soft-light opacity-[0.5]" />
    </div>
  );
}

function Blob({
  className,
  color,
  animate,
  delay,
}: {
  className: string;
  color: string;
  animate: boolean;
  delay: string;
}) {
  return (
    <div
      className={`absolute rounded-full blur-[80px] ${className}`}
      style={{
        background: `radial-gradient(closest-side, ${color}, transparent)`,
        ...(animate
          ? { animation: `drift 26s ease-in-out infinite`, animationDelay: delay }
          : {}),
      }}
    />
  );
}
