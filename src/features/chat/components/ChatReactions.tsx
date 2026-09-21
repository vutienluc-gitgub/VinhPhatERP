import { memo } from 'react';

import { Icon } from '@/shared/components/Icon';
import { CHAT_LABELS, type ChatReaction } from '@/schema/chat.schema';

interface Props {
  reactions?: ChatReaction[] | null;
  currentUserId?: string | null;
  showEmojiPicker: boolean;
  onToggleReaction: (emoji: string) => void;
  onAddReaction: (emoji: string) => void;
}

// eslint-disable-next-line no-restricted-syntax -- Allowed reaction dataset
const COMMON_EMOJIS = ['👍', '👎', '❤️', '😂', '🔥', '🎉', '🙏', '🤝'] as const;

function groupChatReactions(reactions?: ChatReaction[] | null) {
  if (!reactions || reactions.length === 0) return [];
  const grouped = new Map<
    string,
    { emoji: string; count: number; user_ids: string[] }
  >();
  for (const reaction of reactions) {
    const existing = grouped.get(reaction.emoji);
    if (existing) {
      existing.count++;
      existing.user_ids.push(reaction.user_id);
    } else {
      grouped.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        user_ids: [reaction.user_id],
      });
    }
  }
  return Array.from(grouped.values());
}

function renderReactionDisplay(codeOrEmoji: string) {
  if (codeOrEmoji === 'like' || codeOrEmoji === '👍') {
    return <Icon name="ThumbsUp" size={12} />;
  }
  if (codeOrEmoji === 'heart' || codeOrEmoji === '❤️') {
    return <Icon name="Heart" size={12} />;
  }
  return <span className="chat-reaction-emoji">{codeOrEmoji}</span>;
}

export const ChatReactions = memo(function ChatReactions({
  reactions,
  currentUserId,
  showEmojiPicker,
  onToggleReaction,
  onAddReaction,
}: Props) {
  const groups = groupChatReactions(reactions);

  if (groups.length === 0 && !showEmojiPicker) return null;

  return (
    <>
      {groups.length > 0 && (
        <div className="chat-reactions">
          {groups.map((group) => {
            const hasReacted = group.user_ids.includes(currentUserId ?? '');
            return (
              <button
                key={group.emoji}
                type="button"
                className={`chat-reaction-btn ${hasReacted ? 'chat-reaction-btn--active' : ''}`}
                onClick={() => onToggleReaction(group.emoji)}
                title={`${group.count} ${CHAT_LABELS.REACTED_SUFFIX}`}
              >
                {renderReactionDisplay(group.emoji)}
                <span className="chat-reaction-count">{group.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {showEmojiPicker && (
        <div className="chat-reaction-emoji-picker">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="chat-reaction-emoji-btn"
              onClick={() => onAddReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </>
  );
});
