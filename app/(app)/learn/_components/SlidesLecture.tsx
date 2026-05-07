import SlidesViewer from "@/components/lecture/SlidesViewer";

export function SlidesLecture({ html, title }: { html: string; title: string }) {
  return <SlidesViewer html={html} title={title} />;
}
