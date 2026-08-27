import { memo } from 'react';

import { Icon } from '@/shared/components/Icon';
import { CHAT_LABELS, type ChatReaction } from '@/schema/chat.schema';

interface Props {
  reactions?: ChatReaction[] | null;
  currentUserId?: string | null;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: () => void;
  onToggleReaction: (emoji: string) => void;
  onAddReaction: (emoji: string) => void;
}

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

export const ChatReactions = memo(function ChatReactions({
  reactions,
  currentUserId,
  showEmojiPicker,
  onToggleEmojiPicker,
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
                <span className="chat-reaction-emoji">{group.emoji}</span>
                <span className="chat-reaction-count">{group.count}</span>
              </button>
            );
          })}
          <button
            type="button"
            className="chat-reaction-add-btn"
            onClick={onToggleEmojiPicker}
            title={CHAT_LABELS.ADD_REACTION}
          >
            <Icon name="Smile" size={14} />
          </button>
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
