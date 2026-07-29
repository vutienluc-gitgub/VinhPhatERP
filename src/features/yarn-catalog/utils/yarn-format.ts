import {
  getYarnTypeLabel,
  YARN_COLOR_STATUS_OPTIONS,
  YARN_FINISH_OPTIONS,
  YARN_INTERMINGLE_OPTIONS,
} from '@/shared/constants/yarn-classification';
import type { YarnCatalog } from '@/domain/settings/yarn-catalog.types';

export function formatYarnTechnicalSpecs(yarn: Partial<YarnCatalog>) {
  // Main line: Specs + Type (e.g. 75D/72F DTY)
  const specs = yarn.denier
    ? `${yarn.denier}${yarn.filament_count ? `/${yarn.filament_count}` : ''}`
    : yarn.count_ne
      ? `${yarn.count_ne}`
      : '';

  const typeLabel = getYarnTypeLabel(yarn.yarn_type || '');
  const mainText = specs
    ? `${specs} ${yarn.yarn_type || ''}`.trim()
    : yarn.yarn_type || '—';

  const mainTooltipLines = [
    mainText,
    '',
    yarn.denier ? `• Độ thô: ${yarn.denier.replace('D', ' Denier')}` : '',
    yarn.filament_count
      ? `• Filament: ${yarn.filament_count.replace('F', ' sợi')}`
      : '',
    yarn.count_ne ? `• Chỉ số: ${yarn.count_ne}` : '',
    yarn.yarn_type ? `• Loại: ${typeLabel}` : '',
  ].filter((line) => line !== undefined && line !== null && line !== '');

  const mainTooltip =
    mainTooltipLines.length > 2 ? mainTooltipLines.join('\n') : mainText;

  // Sub line: Color + Finish + Intermingle (e.g. Raw SD SIM)
  const colorAbbr =
    yarn.color_status === 'raw_white'
      ? 'Raw'
      : yarn.color_status === 'dope_dyed'
        ? 'DDB'
        : yarn.color_status === 'dyed'
          ? 'Dyed'
          : yarn.color_name || '';

  const finishAbbr =
    yarn.finish === 'semi_dull'
      ? 'SD'
      : yarn.finish === 'full_dull'
        ? 'FD'
        : yarn.finish === 'bright'
          ? 'BR'
          : yarn.finish === 'trilobal_bright'
            ? 'TBR'
            : '';

  const intermingleAbbr = yarn.intermingle || '';

  const subText = [colorAbbr, finishAbbr, intermingleAbbr]
    .filter(Boolean)
    .join(' ');

  const fullColor =
    YARN_COLOR_STATUS_OPTIONS.find((o) => o.value === yarn.color_status)
      ?.label || yarn.color_name;
  const fullFinish = YARN_FINISH_OPTIONS.find(
    (o) => o.value === yarn.finish,
  )?.label;
  const fullIntermingle = YARN_INTERMINGLE_OPTIONS.find(
    (o) => o.value === yarn.intermingle,
  )?.label;

  const subTooltipLines = [
    subText,
    '',
    fullColor ? `• Màu: ${fullColor}` : '',
    fullFinish ? `• Độ bóng: ${fullFinish}` : '',
    fullIntermingle ? `• Intermingle: ${fullIntermingle}` : '',
  ].filter((line) => line !== undefined && line !== null && line !== '');

  const subTooltip =
    subTooltipLines.length > 2 ? subTooltipLines.join('\n') : subText;

  return {
    mainText,
    mainTooltip,
    subText,
    subTooltip,
  };
}
