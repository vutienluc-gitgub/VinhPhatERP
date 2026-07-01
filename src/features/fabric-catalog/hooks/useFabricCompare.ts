import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

export interface CompareItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  composition: string | null;
  target_width_cm: number | null;
  target_gsm: number | null;
  stretch_type: string | null;
  thickness: string | null;
  moq: string;
  lead_time: string;
}

export function useFabricCompare(
  fabric: Partial<FabricCatalog> | null | undefined,
  displayMOQ: string,
  displayLeadTime: string,
) {
  const [compareList, setCompareList] = useState<CompareItem[]>([]);

  useEffect(() => {
    try {
      const savedCompare = localStorage.getItem('vp_fabric_compare');
      if (savedCompare) {
        setCompareList(JSON.parse(savedCompare));
      }
    } catch (err) {
      console.error('[CompareListInitError]', err);
      localStorage.removeItem('vp_fabric_compare');
    }
  }, []);

  const isCompared = fabric
    ? compareList.some((item) => item.id === fabric.id)
    : false;

  const handleToggleCompare = () => {
    if (!fabric) return;

    let updated: CompareItem[];
    if (isCompared) {
      updated = compareList.filter((item) => item.id !== fabric.id);
      toast.success(LABELS.removeCompareSuccess);
    } else {
      if (compareList.length >= 3) {
        toast.error(LABELS.compareLimit);
        return;
      }
      updated = [
        ...compareList,
        {
          id: fabric.id || '',
          code: fabric.code || '',
          name: fabric.name || '',
          slug: fabric.slug || '',
          composition: fabric.composition || null,
          target_width_cm: fabric.target_width_cm || null,
          target_gsm: fabric.target_gsm || null,
          stretch_type: fabric.stretch_type || null,
          thickness: fabric.thickness || null,
          moq: displayMOQ,
          lead_time: displayLeadTime,
        },
      ];
      toast.success(LABELS.addCompareSuccess);
    }
    setCompareList(updated);
    try {
      localStorage.setItem('vp_fabric_compare', JSON.stringify(updated));
    } catch (err) {
      console.error('[CompareListSaveError]', err);
    }
  };

  return {
    compareList,
    setCompareList,
    isCompared,
    handleToggleCompare,
  };
}
