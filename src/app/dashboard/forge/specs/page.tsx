import { listForgeSpecs } from '@/lib/content';
import { FileListing } from '@/components/file-listing';

export default async function ForgeSpecsPage() {
  const specs = await listForgeSpecs();
  return <FileListing title="Forge Specs" files={specs} basePath="/dashboard/forge/specs" />;
}
