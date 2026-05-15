import type { ReactNode } from "react";

/**
 * Renderiza texto Markdown simple a JSX.
 * Soporta: encabezados ##/###, **negrita**, *cursiva*, `código`,
 * listas `-` y `1.`, separadores `---` y párrafos.
 */
export function MarkdownRender({ texto }: { texto: string }) {
  const lines = texto.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;
  let key = 0;

  const flushList = () => {
    if (!listItems.length) return;
    if (listType === "ol") {
      nodes.push(
        <ol key={key++} className="my-2 list-decimal space-y-1 pl-6 text-slate-800">
          {listItems}
        </ol>
      );
    } else {
      nodes.push(
        <ul key={key++} className="my-2 list-disc space-y-1 pl-6 text-slate-800">
          {listItems}
        </ul>
      );
    }
    listItems = [];
    listType = null;
  };

  const inlineStyles = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (match.index > last) parts.push(text.slice(last, match.index));
      const raw = match[0];
      if (raw.startsWith("**")) {
        parts.push(<strong key={match.index}>{raw.slice(2, -2)}</strong>);
      } else if (raw.startsWith("*")) {
        parts.push(<em key={match.index}>{raw.slice(1, -1)}</em>);
      } else {
        parts.push(
          <code key={match.index} className="rounded bg-slate-100 px-1 text-[0.85em] text-teal-900">
            {raw.slice(1, -1)}
          </code>
        );
      }
      last = match.index + raw.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trimStart();

    // Separator
    if (/^---+$/.test(trimmed)) {
      flushList();
      nodes.push(<hr key={key++} className="my-3 border-slate-200" />);
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      nodes.push(
        <h3 key={key++} className="mt-4 mb-1 font-display text-base font-semibold text-teal-950">
          {inlineStyles(trimmed.slice(4))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      nodes.push(
        <h2 key={key++} className="mt-5 mb-1 font-display text-lg font-semibold text-teal-950">
          {inlineStyles(trimmed.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      nodes.push(
        <h1 key={key++} className="mt-5 mb-1 font-display text-xl font-bold text-teal-950">
          {inlineStyles(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Ordered list
    const olMatch = /^(\d+)\.\s+(.*)$/.exec(trimmed);
    if (olMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(<li key={key++}>{inlineStyles(olMatch[2]!)}</li>);
      continue;
    }

    // Unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(<li key={key++}>{inlineStyles(trimmed.slice(2))}</li>);
      continue;
    }

    // Empty line
    if (trimmed === "") {
      flushList();
      nodes.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Normal paragraph line
    flushList();
    nodes.push(
      <p key={key++} className="leading-relaxed text-slate-800">
        {inlineStyles(trimmed)}
      </p>
    );
  }

  flushList();
  return <div className="space-y-1 text-sm">{nodes}</div>;
}
