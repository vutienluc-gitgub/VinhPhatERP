import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useCompanySettings } from '@/application/settings';
import { upsertPartialSettings } from '@/api/settings.api';
import {
  printSettingsDefaults,
  type PrintSettingsFormValues,
} from '@/schema/company-settings.schema';

const QUERY_KEY = ['company-settings'] as const;

export function usePrintSettings(): {
  data: PrintSettingsFormValues;
  isLoading: boolean;
} {
  const { data: rawSettings, isLoading } = useCompanySettings();

  const data: PrintSettingsFormValues = useMemo(() => {
    if (!rawSettings) return printSettingsDefaults;

    let margin = printSettingsDefaults.print_margin;
    if (rawSettings.print_margin) {
      try {
        margin = JSON.parse(rawSettings.print_margin);
      } catch {
        margin = printSettingsDefaults.print_margin;
      }
    }

    return {
      print_default_format:
        (rawSettings.print_default_format as PrintSettingsFormValues['print_default_format']) ||
        printSettingsDefaults.print_default_format,
      print_orientation:
        (rawSettings.print_orientation as PrintSettingsFormValues['print_orientation']) ||
        printSettingsDefaults.print_orientation,
      print_dot_matrix_width:
        rawSettings.print_dot_matrix_width ||
        printSettingsDefaults.print_dot_matrix_width,
      print_dot_matrix_height:
        rawSettings.print_dot_matrix_height ||
        printSettingsDefaults.print_dot_matrix_height,
      print_margin: margin,
      print_show_logo: rawSettings.print_show_logo !== 'false',
      print_show_qr: rawSettings.print_show_qr !== 'false',
      print_footer_note:
        rawSettings.print_footer_note ??
        printSettingsDefaults.print_footer_note,
    };
  }, [rawSettings]);

  return { data, isLoading };
}

export function useUpdatePrintSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: PrintSettingsFormValues) => {
      const payload: Record<string, string> = {
        print_default_format: values.print_default_format,
        print_orientation: values.print_orientation,
        print_dot_matrix_width: values.print_dot_matrix_width || '',
        print_dot_matrix_height: values.print_dot_matrix_height || '',
        print_margin: JSON.stringify(values.print_margin),
        print_show_logo: String(values.print_show_logo),
        print_show_qr: String(values.print_show_qr),
        print_footer_note: values.print_footer_note || '',
      };
      await upsertPartialSettings(payload);
    },
    onMutate: async (newValues) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousSettings = queryClient.getQueryData(QUERY_KEY);

      queryClient.setQueryData(
        QUERY_KEY,
        (old: Record<string, string> | undefined) => ({
          ...old,
          print_default_format: newValues.print_default_format,
          print_orientation: newValues.print_orientation,
          print_dot_matrix_width: newValues.print_dot_matrix_width || '',
          print_dot_matrix_height: newValues.print_dot_matrix_height || '',
          print_margin: JSON.stringify(newValues.print_margin),
          print_show_logo: String(newValues.print_show_logo),
          print_show_qr: String(newValues.print_show_qr),
          print_footer_note: newValues.print_footer_note || '',
        }),
      );

      return { previousSettings };
    },
    onError: (_err, _newValues, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(QUERY_KEY, context.previousSettings);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
