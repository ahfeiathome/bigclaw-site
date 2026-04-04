import { fetchContentByPath } from '@/lib/content';
import { ContentPage } from '@/components/content-page';

export default async function AxiomSpecPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { content, title, source } = await fetchContentByPath(`axiom/specs/${slug}`);
  return <ContentPage title={title} content={content} sourcePath={`${source.repo}/${source.path}`} />;
}
