import { fetchContentByPath } from '@/lib/content';
import { ContentPage } from '@/components/content-page';

export default async function KnowledgeEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { content, title, source } = await fetchContentByPath(`knowledge/${slug}`);
  return <ContentPage title={title} content={content} sourcePath={`${source.repo}/${source.path}`} />;
}
