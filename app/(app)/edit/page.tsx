import { EditorClient } from "./EditorClient";

export const runtime = 'edge';

export const metadata = { title: "Content Editor" };

export default function EditPage() {
  return <EditorClient />;
}
