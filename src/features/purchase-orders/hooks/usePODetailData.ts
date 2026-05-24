import { useQuery } from '@tanstack/react-query';

import { untypedDb } from '@/services/supabase/client';
import {
  usePurchaseOrder,
  useGoodsReceiptsByPo,
} from '@/application/purchase-orders';
import { fetchYarnCatalogOptions } from '@/api/yarn-catalog.api';
import { fetchFabricCatalogOptions } from '@/api/fabric-catalog.api';

export function usePODetailData(id: string | undefined) {
  const { data: po, isLoading: poLoading } = usePurchaseOrder(id);
  const { data: receipts = [], isLoading: receiptsLoading } =
    useGoodsReceiptsByPo(id);

  const { data: globalMaterials = [] } = useQuery({
    queryKey: ['globalMaterials', po?.items?.map((i) => i.material_id)],
    queryFn: async () => {
      const [yarns, fabrics] = await Promise.all([
        fetchYarnCatalogOptions(),
        fetchFabricCatalogOptions(),
      ]);
      const all: { id: string; name: string; code: string; type: string }[] =
        [];
      yarns.forEach((y) =>
        all.push({ id: y.id, name: y.name, code: y.code, type: 'yarn' }),
      );
      fabrics.forEach((f) =>
        all.push({ id: f.id, name: f.name, code: f.code, type: 'fabric' }),
      );

      if (po?.items && po.items.length > 0) {
        const missingIds = po.items
          .map((i) => i.material_id)
          .filter((id) => !all.some((m) => m.id === id));
        if (missingIds.length > 0) {
          const { data: missingYarns } = await untypedDb
            .from('yarn_catalogs')
            .select('id, code, name')
            .in('id', missingIds);
          if (missingYarns)
            missingYarns.forEach(
              (y: { id: string; name: string; code: string }) =>
                all.push({
                  id: y.id,
                  name: y.name,
                  code: y.code,
                  type: 'yarn',
                }),
            );

          const { data: missingFabrics } = await untypedDb
            .from('fabric_catalogs')
            .select('id, code, name')
            .in('id', missingIds);
          if (missingFabrics)
            missingFabrics.forEach(
              (f: { id: string; name: string; code: string }) =>
                all.push({
                  id: f.id,
                  name: f.name,
                  code: f.code,
                  type: 'fabric',
                }),
            );
        }
      }
      return all;
    },
    enabled: !!po,
  });

  const { data: creatorProfile } = useQuery({
    queryKey: ['profile', po?.created_by],
    queryFn: async () => {
      if (!po?.created_by) return null;
      try {
        const { data: pData } = await untypedDb
          .from('profiles')
          .select('full_name')
          .eq('id', po.created_by)
          .maybeSingle();
        if (pData) return { name: pData.full_name, email: '' };

        // Fallback to employees just in case
        const { data: eData } = await untypedDb
          .from('employees')
          .select('name')
          .eq('id', po.created_by)
          .maybeSingle();
        if (eData) return { name: eData.name, email: '' };
      } catch (e) {
        console.error('Failed to fetch creator profile', e);
      }
      return null;
    },
    enabled: !!po?.created_by,
  });

  return {
    po,
    poLoading,
    receipts,
    receiptsLoading,
    globalMaterials,
    creatorProfile,
  };
}
