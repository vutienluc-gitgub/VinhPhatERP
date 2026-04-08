import { PagePlaceholder } from '@/shared/components/PagePlaceholder';
import type { FeatureDefinition } from '@/shared/types/feature';

type FeatureScaffoldPageProps = {
  feature: FeatureDefinition;
};

export function FeatureScaffoldPage({ feature }: FeatureScaffoldPageProps) {
  return (
    <PagePlaceholder
      title={feature.title}
      description={feature.description}
      summary={feature.summary}
      highlights={feature.highlights ?? []}
      resources={feature.resources ?? []}
      badge={feature.badge}
      aside={
        <>
          <div className="panel-card">
            <h2>Entities trong module</h2>
            <ul className="summary-list">
              {(feature.entities ?? []).map((entity) => (
                <li key={entity}>{entity}</li>
              ))}
            </ul>
          </div>

          <div className="panel-card">
            <h2>Milestones tiep theo</h2>
            <ul className="summary-list">
              {(feature.nextMilestones ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </>
      }
    />
  );
}
