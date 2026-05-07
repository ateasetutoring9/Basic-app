import YouTubeFacade from "@/components/lecture/YouTubeFacade";

interface Props {
  youtubeId: string;
  title: string;
  durationSeconds?: number;
}

export function VideoLecture({ youtubeId, title }: Props) {
  return <YouTubeFacade youtubeId={youtubeId} title={title} />;
}
