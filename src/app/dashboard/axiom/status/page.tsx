import { fetchContentByPath } from '@/lib/content';
import { ContentPage } from '@/components/content-page';

export default async function AxiomStatusPage() {
  const { content, title, source } = await fetchContentByPath('axiom/status/issues-snapshot');
  return <ContentPage title={title} content={content} sourcePath={`${source.repo}/${source.path}`} />;
}
