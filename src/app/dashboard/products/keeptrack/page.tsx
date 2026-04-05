import { fetchAllIssues, fetchRecentClosedIssues } from '@/lib/github';
import { ProductPageTemplate } from '@/components/product-page-template';

export default async function KeepTrackPage() {
  const [allIssues, closedIssues] = await Promise.all([
    fetchAllIssues(),
    fetchRecentClosedIssues(14),
  ]);

  const issues = allIssues.filter(i => i.repo === 'keeptrack');
  const recentClosed = closedIssues.filter(i => i.repo === 'keeptrack');

  return (
    <ProductPageTemplate
      name="KeepTrack"
      description="Personal inventory tracker — iOS app via Apple IAP"
      kpis={{
        pdlcStage: 'S2 DEFINE',
        company: 'Axiom',
        companyColor: 'blue',
        revenueModel: 'Apple IAP',
        openIssues: {
          p0: issues.filter(i => i.labels.includes('P0')).length,
          p1: issues.filter(i => i.labels.includes('P1')).length,
          p2: issues.filter(i => i.labels.includes('P2')).length,
          total: issues.length,
        },
      }}
      productStatus={{
        pdlcProgress: {
          current: 1,
          total: 5,
          stages: [
            { name: 'MRD', status: 'active' },
            { name: 'Design', status: 'pending' },
            { name: 'Development', status: 'pending' },
            { name: 'Testing', status: 'pending' },
            { name: 'Launch', status: 'pending' },
          ],
        },
        dependencies: [
          { name: 'Apple Developer Account', status: '💳 Pending', blocker: true },
        ],
      }}
      projectStatus={{
        issues,
        recentClosed,
      }}
    />
  );
}
