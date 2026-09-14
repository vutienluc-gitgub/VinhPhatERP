import React from 'react';

import { formatFullAuditTime } from '@/features/chat/chat.utils';
import { CHAT_LABELS, type ChatMessage } from '@/schema/chat.schema';
import { Icon } from '@/shared/components/Icon';

export interface ChatDrawerSearchPanelProps {
  isOpen: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onCloseSearch: () => void;
  searchResults?: ChatMessage[] | null;
  onSelectResult: (messageId: string) => void;
}

export const ChatDrawerSearchPanel = React.memo(function ChatDrawerSearchPanel({
  isOpen,
  searchQuery,
  onSearchQueryChange,
  onCloseSearch,
  searchResults,
  onSelectResult,
}: ChatDrawerSearchPanelProps) {
  if (!isOpen) return null;

  const trimmedQuery = searchQuery.trim();
  const hasResults = Boolean(
    searchResults && Array.isArray(searchResults) && searchResults.length > 0,
  );
  const isEmpty = Boolean(
    trimmedQuery &&
    searchResults &&
    Array.isArray(searchResults) &&
    searchResults.length === 0,
  );

  return (
    <>
      {/* Search Input Bar */}
      <div className="chat-search-bar">
        <input
          type="text"
          className="chat-search-input"
          placeholder={CHAT_LABELS.SEARCH_PLACEHOLDER ?? 'Tìm kiếm tin nhắn...'}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          autoFocus
        />
        <button
          type="button"
          className="chat-search-clear-btn"
          onClick={onCloseSearch}
          aria-label={CHAT_LABELS.CLEAR ?? 'Xóa'}
        >
          <Icon name="X" size={14} />
        </button>
      </div>

      {/* Search Results List */}
      {trimmedQuery && hasResults ? (
        <div className="chat-search-results">
          <div className="chat-search-results-header">
            {searchResults?.length} kết quả
          </div>
          {searchResults?.map((msg) => (
            <div
              key={msg.id}
              className="chat-search-result-item"
              onClick={() => onSelectResult(msg.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectResult(msg.id);
                }
              }}
            >
              <div className="chat-search-result-time">
                {formatFullAuditTime(msg.created_at)}
              </div>
              <div className="chat-search-result-content">{msg.content}</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Search Empty State */}
      {isEmpty ? (
        <div className="chat-search-empty">Không tìm thấy kết quả</div>
      ) : null}
    </>
  );
});
