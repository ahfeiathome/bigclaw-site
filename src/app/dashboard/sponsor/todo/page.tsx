import { fetchContentByPath } from '@/lib/content';
import { ContentPage } from '@/components/content-page';

export default async function SponsorTodoPage() {
  const { content, title, source } = await fetchContentByPath('sponsor/todo');
  return <ContentPage title={title} content={content} sourcePath={`${source.repo}/${source.path}`} />;
}
