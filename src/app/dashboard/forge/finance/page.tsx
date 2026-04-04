import { fetchContentByPath } from '@/lib/content';
import { ContentPage } from '@/components/content-page';

export default async function ForgeFinancePage() {
  const { content, title, source } = await fetchContentByPath('forge/finance');
  return <ContentPage title={title} content={content} sourcePath={`${source.repo}/${source.path}`} />;
}
