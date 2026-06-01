import { useEffect } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';

import {
  SPUN_YARN_CATEGORIES,
  YARN_SPINNING_METHOD_OPTIONS,
  YARN_FINISH_OPTIONS,
  YARN_COLOR_STATUS_OPTIONS,
} from '@/shared/constants/yarn-classification';
import type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema';

export function useYarnNameGenerator(
  methods: UseFormReturn<YarnCatalogFormValues>,
) {
  const watchedSpecs = useWatch({
    control: methods.control,
    name: [
      'category',
      'yarn_type',
      'count_ne',
      'spinning_method',
      'denier',
      'filament_count',
      'finish',
      'color_status',
      'color_name',
      'intermingle',
    ],
  });

  useEffect(() => {
    const [
      category,
      yarnType,
      countNe,
      spinningMethod,
      denier,
      filamentCount,
      finish,
      colorStatus,
      colorName,
      intermingle,
    ] = watchedSpecs;

    const getSpinningLabel = (val?: string) => {
      if (!val) return '';
      if (val === 'ring_spun') return 'Ring';
      if (val === 'open_end') return 'OE';
      if (val === 'compact') return 'Compact';
      return (
        YARN_SPINNING_METHOD_OPTIONS.find((o) => o.value === val)?.label?.split(
          ' ',
        )[0] ?? val
      );
    };

    const getFinishLabel = (val?: string) =>
      YARN_FINISH_OPTIONS.find((o) => o.value === val)?.label ?? val ?? '';
    const getColorStatusLabel = (val?: string) =>
      YARN_COLOR_STATUS_OPTIONS.find((o) => o.value === val)?.label ??
      val ??
      '';

    let nameParts: string[] = [];
    const finishLabel = getFinishLabel(finish);
    const colorPart = colorName || getColorStatusLabel(colorStatus);

    if (SPUN_YARN_CATEGORIES.has(category ?? '')) {
      const spinLabel = getSpinningLabel(spinningMethod);
      nameParts = [
        category ?? '',
        spinLabel,
        countNe ?? '',
        finishLabel,
        colorPart,
      ];
    } else {
      let denierPart = denier ?? '';
      if (denier && filamentCount) {
        denierPart = `${denier}/${filamentCount}`;
      } else if (filamentCount) {
        denierPart = filamentCount;
      }
      nameParts = [
        category ?? '',
        yarnType ?? '',
        denierPart,
        finishLabel,
        colorPart,
        intermingle ?? '',
      ];
    }

    const generatedName = nameParts.filter(Boolean).join(' ').trim();
    if (generatedName && generatedName !== methods.getValues('name')) {
      methods.setValue('name', generatedName, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watchedSpecs, methods]);
}
