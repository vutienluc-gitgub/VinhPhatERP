import { Icon, type IconName } from '@/shared/components';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricRichContentProps {
  fabric: Partial<FabricCatalog>;
}

export function FabricRichContent({ fabric }: FabricRichContentProps) {
  const hasCharacteristics =
    fabric.characteristics && fabric.characteristics.length > 0;
  const hasApplications = fabric.applications && fabric.applications.length > 0;

  if (!hasCharacteristics && !hasApplications) return null;

  return (
    <>
      {/* Rich Characteristics */}
      {hasCharacteristics && fabric.characteristics && (
        <div className="bg-surface rounded-xl shadow-sm p-4">
          <h3 className="text-base font-bold text-foreground mb-3">
            {LABELS.characteristics}
          </h3>
          <div className="space-y-3">
            {fabric.characteristics.map((char) => (
              <div key={char.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-success flex items-center justify-center shrink-0">
                  <Icon
                    name={(char.icon as IconName) || 'Check'}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">
                    {char.name}
                  </h4>
                  {char.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {char.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rich Applications */}
      {hasApplications && fabric.applications && (
        <div className="bg-surface rounded-xl shadow-sm p-4">
          <h3 className="text-base font-bold text-foreground mb-3">
            {LABELS.applications}
          </h3>
          <div className="space-y-3">
            {fabric.applications.map((app) => (
              <div key={app.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-foreground flex items-center justify-center shrink-0">
                  <Icon
                    name={(app.icon as IconName) || 'Shirt'}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">
                    {app.name}
                  </h4>
                  {app.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {app.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
