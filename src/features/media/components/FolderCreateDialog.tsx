/**
 * FolderCreateDialog — Simple modal for creating new folders
 *
 * Uses AdaptiveSheet for consistent UI with the rest of the ERP.
 */

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

import { useCreateFolder } from '@/features/media/useMedia';
import { MEDIA_LABELS, MEDIA_MESSAGES } from '@/features/media/media.constants';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTenant } from '@/shared/hooks/useTenant';

interface FolderCreateDialogProps {
  open: boolean;
  onClose: () => void;
  parentId: string | null;
}

export function FolderCreateDialog({
  open,
  onClose,
  parentId,
}: FolderCreateDialogProps) {
  const [name, setName] = useState('');
  const createFolder = useCreateFolder();
  const { data: tenant } = useTenant();
  const { user } = useAuth();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) {
        toast.error(MEDIA_MESSAGES.FOLDER_NAME_REQUIRED);
        return;
      }

      try {
        await createFolder.mutateAsync({
          tenantId: tenant?.id || '',
          userId: user?.id || '',
          payload: {
            name: trimmed,
            parent_id: parentId,
          },
        });
        toast.success(MEDIA_LABELS.FOLDER_CREATED);
        setName('');
        onClose();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('duplicate') || message.includes('unique')) {
          toast.error(MEDIA_MESSAGES.FOLDER_EXISTS);
        } else {
          toast.error(message);
        }
      }
    },
    [name, parentId, createFolder, onClose, tenant?.id, user?.id],
  );

  const handleClose = useCallback(() => {
    setName('');
    onClose();
  }, [onClose]);

  return (
    <AdaptiveSheet
      open={open}
      onClose={handleClose}
      title={MEDIA_LABELS.NEW_FOLDER}
    >
      <form onSubmit={handleSubmit} className="media-folder-dialog">
        <div className="form-field">
          <label htmlFor="folder-name-input">{MEDIA_LABELS.NEW_FOLDER}</label>
          <input
            id="folder-name-input"
            type="text"
            className="field-input"
            placeholder={MEDIA_LABELS.FOLDER_NAME_PLACEHOLDER}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={100}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Huỷ
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!name.trim() || createFolder.isPending}
          >
            {createFolder.isPending ? 'Tạo...' : 'Tạo thư mục'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
