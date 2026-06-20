"use client";

import { cn } from "@/lib/utils";

interface StreamingMarkdownProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

function parseMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-medium text-[var(--ink)] mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-medium text-[var(--ink)] mt-6 mb-2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium text-[var(--ink)]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="font-mono text-xs bg-[var(--paper-2)] px-1 py-0.5 border border-[var(--mist)]">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm leading-relaxed">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-none space-y-1 my-3">$&</ul>')
    .replace(/\n\n/g, '<p class="mt-4"></p>')
    .replace(/\n/g, '<br />');
}

export function StreamingMarkdown({
  content,
  className,
  isStreaming,
}: StreamingMarkdownProps) {
  return (
    <div
      className={cn(
        "text-sm text-[var(--ink)] leading-relaxed",
        isStreaming && "after:content-['▍'] after:animate-pulse after:ml-0.5 after:text-[var(--blueprint)]",
        className
      )}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}
