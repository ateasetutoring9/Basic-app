"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h2 className="text-2xl font-bold text-fg mt-8 mb-3 leading-snug">{children}</h2>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold text-fg mt-8 mb-3 leading-snug">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-bold text-fg mt-6 mb-2">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-fg leading-relaxed mb-4">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-4 space-y-1.5 text-fg">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-fg">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 my-4 text-muted italic">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.startsWith("language-");
          return isBlock ? (
            <code className="block bg-gray-50 border border-border rounded-lg px-4 py-3 text-sm font-mono text-fg overflow-x-auto mb-4 whitespace-pre">
              {children}
            </code>
          ) : (
            <code className="bg-gray-100 rounded px-1.5 py-0.5 text-sm font-mono text-fg">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? ""}
            className="max-w-full rounded-lg border border-border my-4"
          />
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary underline underline-offset-2 hover:text-primary-hover"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border border-border px-4 py-2 text-left font-semibold text-fg">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-4 py-2 text-fg">{children}</td>
        ),
        hr: () => <hr className="border-border my-6" />,
        strong: ({ children }) => (
          <strong className="font-semibold text-fg">{children}</strong>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
