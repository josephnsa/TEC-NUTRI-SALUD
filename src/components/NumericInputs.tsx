import { useEffect, useRef, useState } from "react";

type IntFieldProps = {
  label: string;
  value: number;
  onCommit: (n: number) => void;
  min: number;
  max: number;
  className?: string;
  /** Solo para filas compactas (ej. “Días” al lado del input). */
  hideLabel?: boolean;
  inputClassName?: string;
};

/** Texto numérico sin ceros a la izquierda ni spinners de `type="number"`. */
export function IntField({
  label,
  value,
  onCommit,
  min,
  max,
  className,
  hideLabel,
  inputClassName
}: IntFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => (Number.isFinite(value) ? String(value) : String(min)));

  useEffect(() => {
    if (inputRef.current === document.activeElement) return;
    setText(Number.isFinite(value) ? String(value) : String(min));
  }, [value, min]);

  const commit = () => {
    const digits = text.replace(/\D/g, "");
    const trimmed = digits.replace(/^0+/, "") || String(min);
    let n = parseInt(trimmed, 10);
    if (Number.isNaN(n)) n = min;
    n = Math.min(max, Math.max(min, n));
    onCommit(n);
    setText(String(n));
  };

  const input = (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={hideLabel ? label : undefined}
      className={
        inputClassName ??
        "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20"
      }
      value={text}
      onChange={(e) => {
        const d = e.target.value.replace(/\D/g, "");
        setText(d.replace(/^0+(?=\d)/, ""));
      }}
      onBlur={commit}
    />
  );

  if (hideLabel) {
    return <span className={className}>{input}</span>;
  }

  return (
    <label className={className}>
      <span className="font-medium">{label}</span>
      {input}
    </label>
  );
}

type DecimalFieldProps = {
  label: string;
  value: number;
  onCommit: (n: number) => void;
  min: number;
  max: number;
  fractionDigits: number;
  className?: string;
};

export function DecimalField({ label, value, onCommit, min, max, fractionDigits, className }: DecimalFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => formatDecimal(value, fractionDigits));

  useEffect(() => {
    if (inputRef.current === document.activeElement) return;
    setText(formatDecimal(value, fractionDigits));
  }, [value, fractionDigits]);

  const commit = () => {
    const normalized = text.replace(",", ".").replace(/[^\d.]/g, "");
    const parts = normalized.split(".");
    const intPart = (parts[0] ?? "").replace(/^0+(?=\d)/, "") || "0";
    const fracRaw = parts.slice(1).join("");
    const frac =
      fractionDigits > 0 ? fracRaw.replace(/\D/g, "").slice(0, fractionDigits) : "";
    const joined = frac ? `${intPart}.${frac}` : intPart;
    let n = parseFloat(joined);
    if (Number.isNaN(n)) n = min;
    n = Math.round(n * 10 ** fractionDigits) / 10 ** fractionDigits;
    n = Math.min(max, Math.max(min, n));
    onCommit(n);
    setText(formatDecimal(n, fractionDigits));
  };

  return (
    <label className={className}>
      <span className="font-medium">{label}</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20"
        value={text}
        onChange={(e) => {
          let t = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
          const firstDot = t.indexOf(".");
          if (firstDot !== -1) {
            t = t.slice(0, firstDot + 1) + t.slice(firstDot + 1).replace(/\./g, "");
          }
          const p = t.split(".");
          const head = (p[0] ?? "").replace(/^0+(?=\d)/, "");
          const tail = p[1] != null ? p[1].replace(/\D/g, "").slice(0, fractionDigits) : undefined;
          if (tail !== undefined && fractionDigits > 0) {
            setText(`${head}.${tail}`);
          } else {
            setText(head + (p[1] != null && fractionDigits > 0 ? "." : ""));
          }
        }}
        onBlur={commit}
      />
    </label>
  );
}

function formatDecimal(n: number, fd: number): string {
  if (!Number.isFinite(n)) return "";
  const rounded = Math.round(n * 10 ** fd) / 10 ** fd;
  if (fd === 0) return String(rounded);
  const s = rounded.toFixed(fd);
  return s.replace(/\.?0+$/, "");
}
