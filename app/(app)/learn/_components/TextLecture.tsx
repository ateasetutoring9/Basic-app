import MarkdownContent from "@/components/lecture/MarkdownContent";

// TODO: install remark-math + rehype-katex and pass to MarkdownContent for LaTeX support

export function TextLecture({ markdown }: { markdown: string }) {
  return (
    <div className="text-[17px] leading-[1.7]">
      <MarkdownContent content={markdown} />
    </div>
  );
}
