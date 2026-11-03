import { tokenizeDescription } from "../_lib/description-links";

export default function DescriptionWithLinks({ description }: { description: string }) {
  const lines = description
    .split(/\r?\n/)
    .filter((line) => {
      const normalized = line.replace(/^[^A-Za-z]+/, "").replace(/\*/g, "").trim();
      return line.trim() && !/^[-_=~*\s]{4,}$/.test(line.trim()) && !/^deal\s+type\s*:/i.test(normalized);
    });

  function renderLine(line: string, lineIndex: number) {
    const isHighlight = /^(?:review\s+deal|less\s*[-:₹]|\bdel\/?err\b|deal\s*type\s*:)/i.test(line.trim());
    const parts = tokenizeDescription(line);

    return (
      <div
        className={`group rounded-xl px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
          isHighlight
            ? "border border-emerald-100 bg-emerald-50/80 text-lg font-black text-slate-950 shadow-sm hover:-translate-y-0.5 hover:bg-emerald-100/80"
            : "text-sm leading-6 text-slate-700 hover:bg-slate-100/80 sm:text-base"
        }`}
        key={`line-${lineIndex}`}
        tabIndex={0}
      >
        {parts.map((part, partIndex) =>
          part.kind === "text" ? (
            <span key={`text-${lineIndex}-${partIndex}`}>{part.value}</span>
          ) : (
            <a
              aria-label={part.actionLabel ? `${part.actionLabel}: ${part.url}` : undefined}
              className="break-all font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-950 hover:decoration-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2 sm:break-words"
              href={part.url}
              key={`link-${lineIndex}-${partIndex}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {part.label}
              {part.actionLabel && <span className="sr-only"> ({part.actionLabel})</span>}
            </a>
          ),
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1 break-words">
      {lines.map(renderLine)}
    </div>
  );
}
