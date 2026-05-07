import type { LearnLecture } from "../_lib/types";
import { TextLecture } from "./TextLecture";
import { VideoLecture } from "./VideoLecture";
import { SlidesLecture } from "./SlidesLecture";

export function LectureContent({ lecture }: { lecture: LearnLecture }) {
  const { content } = lecture;

  if (content.format === "text") {
    return <TextLecture markdown={content.markdown} />;
  }
  if (content.format === "video") {
    return (
      <VideoLecture
        youtubeId={content.youtubeId}
        title={lecture.title}
        durationSeconds={content.durationSeconds}
      />
    );
  }
  return <SlidesLecture html={content.html} title={lecture.title} />;
}
