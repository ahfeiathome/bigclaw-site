import { listAxiomSpecs } from '@/lib/content';
import { FileListing } from '@/components/file-listing';

export default async function AxiomSpecsPage() {
  const specs = await listAxiomSpecs();
  return <FileListing title="Axiom Specs" files={specs} basePath="/dashboard/axiom/specs" />;
}
