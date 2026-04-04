import { fetchContentByPath } from '@/lib/content';
import { ContentPage } from '@/components/content-page';

export default async function PortfolioPage() {
  const { content, title, source } = await fetchContentByPath('portfolio');
  return <ContentPage title={title} content={content} sourcePath={`${source.repo}/${source.path}`} />;
}
