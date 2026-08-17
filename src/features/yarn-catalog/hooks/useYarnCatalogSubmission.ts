import { useCallback } from 'react';
import toast from 'react-hot-toast';

import { useConfirm } from '@/shared/hooks/useConfirm';
import {
  useCreateYarnCatalog,
  useUpdateYarnCatalog,
} from '@/application/settings';
import type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema';
import { logError } from '@/shared/utils/logger';
import type { YarnCatalog } from '@/domain/settings/yarn-catalog.types';
const SUBMISSION_MESSAGES = {
  createSuccess: 'Thêm mới thành công',
  updateSuccess: 'Cập nhật thành công',
  genericError: 'Có lỗi xảy ra',
} as const;

type UseYarnCatalogSubmissionParams = {
  catalog: YarnCatalog | null;
  onClose: () => void;
};

export function useYarnCatalogSubmission({
  catalog,
  onClose,
}: UseYarnCatalogSubmissionParams) {
  const isEditing = catalog !== null;
  const createMutation = useCreateYarnCatalog();
  const updateMutation = useUpdateYarnCatalog();
  const { alert } = useConfirm();

  const handleSubmit = useCallback(
    async (values: YarnCatalogFormValues) => {
      try {
        if (isEditing) {
          await updateMutation.mutateAsync({ id: catalog.id, values });
          toast.success(SUBMISSION_MESSAGES.updateSuccess);
        } else {
          await createMutation.mutateAsync(values);
          toast.success(SUBMISSION_MESSAGES.createSuccess);
        }
        onClose();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : SUBMISSION_MESSAGES.genericError;

        // Proper error logging instead of console.error
        logError('YarnCatalogSubmissionError', err, {
          isEditing,
          catalogId: catalog?.id,
          operation: isEditing ? 'update' : 'create',
        });

        void alert(`Lỗi: ${errorMessage}`);
      }
    },
    [isEditing, catalog, createMutation, updateMutation, onClose, alert],
  );

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return {
    handleSubmit,
    mutationError,
    isPending,
  };
}
