import { forwardRef } from 'react';

import { CHAT_LABELS } from '@/schema/chat.schema';
import { Icon } from '@/shared/components/Icon';

export type ChatUtilityType = 'order' | 'shipment' | 'quotation';

interface ChatUtilityMenuProps {
  onSelectUtility: (type: ChatUtilityType) => void;
  onSelectImage?: () => void;
  onSelectFile?: () => void;
  onClose: () => void;
}

export const ChatUtilityMenu = forwardRef<HTMLDivElement, ChatUtilityMenuProps>(
  function ChatUtilityMenu(
    { onSelectUtility, onSelectImage, onSelectFile, onClose },
    ref,
  ) {
    const utilityItems: Array<{
      type: ChatUtilityType;
      title: string;
      desc: string;
      icon: 'Package' | 'Truck' | 'FileText';
      colorClass: string;
      bgClass: string;
    }> = [
      {
        type: 'order',
        title: CHAT_LABELS.UTILITY_ORDER_TITLE,
        desc: CHAT_LABELS.UTILITY_ORDER_DESC,
        icon: 'Package',
        colorClass: 'text-primary',
        bgClass: 'bg-primary/10',
      },
      {
        type: 'shipment',
        title: CHAT_LABELS.UTILITY_SHIPMENT_TITLE,
        desc: CHAT_LABELS.UTILITY_SHIPMENT_DESC,
        icon: 'Truck',
        colorClass: 'text-info',
        bgClass: 'bg-info/10',
      },
      {
        type: 'quotation',
        title: CHAT_LABELS.UTILITY_QUOTATION_TITLE,
        desc: CHAT_LABELS.UTILITY_QUOTATION_DESC,
        icon: 'FileText',
        colorClass: 'text-success',
        bgClass: 'bg-success/10',
      },
    ];

    return (
      <div
        ref={ref}
        className="chat-utility-menu absolute bottom-full mb-2 left-2 right-2 sm:left-auto sm:right-4 sm:w-72 bg-surface border border-border rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-label={CHAT_LABELS.UTILITIES_MENU}
      >
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50 mb-1">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            {CHAT_LABELS.UTILITIES_MENU}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground p-1 rounded-md hover:bg-surface-secondary border-none bg-transparent cursor-pointer"
            aria-label={CHAT_LABELS.CLOSE}
          >
            <Icon name="X" size={14} />
          </button>
        </div>

        {/* Media Attachments */}
        {(onSelectImage || onSelectFile) && (
          <div className="grid grid-cols-2 gap-1.5 p-1 mb-1 border-b border-border/40">
            {onSelectImage && (
              <button
                type="button"
                onClick={() => {
                  onSelectImage();
                  onClose();
                }}
                className="flex items-center gap-2 p-2 rounded-xl bg-surface-secondary hover:bg-primary/10 hover:text-primary transition-colors border-none cursor-pointer text-left"
              >
                <Icon name="Image" size={16} className="text-primary" />
                <span className="text-xs font-medium text-foreground">
                  Gửi ảnh
                </span>
              </button>
            )}
            {onSelectFile && (
              <button
                type="button"
                onClick={() => {
                  onSelectFile();
                  onClose();
                }}
                className="flex items-center gap-2 p-2 rounded-xl bg-surface-secondary hover:bg-info/10 hover:text-info transition-colors border-none cursor-pointer text-left"
              >
                <Icon name="Paperclip" size={16} className="text-info" />
                <span className="text-xs font-medium text-foreground">
                  Đính kèm tệp
                </span>
              </button>
            )}
          </div>
        )}

        <div className="space-y-1">
          {utilityItems.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => {
                onSelectUtility(item.type);
                onClose();
              }}
              className="w-full p-2 rounded-xl text-left hover:bg-surface-secondary transition-colors flex items-center gap-3 border-none bg-transparent cursor-pointer group"
            >
              <div
                className={`w-9 h-9 rounded-xl ${item.bgClass} ${item.colorClass} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
              >
                <Icon name={item.icon} size={18} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground m-0 leading-tight">
                  {item.title}
                </p>
                <p className="text-[11px] text-muted m-0 mt-0.5 leading-normal truncate">
                  {item.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  },
);

ChatUtilityMenu.displayName = 'ChatUtilityMenu';
