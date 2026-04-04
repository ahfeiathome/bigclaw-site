import { listKnowledgeEntries } from '@/lib/content';
import { FileListing } from '@/components/file-listing';

export default async function KnowledgeHubPage() {
  const entries = await listKnowledgeEntries();
  return <FileListing title="Knowledge Hub" files={entries} basePath="/dashboard/knowledge" />;
}
