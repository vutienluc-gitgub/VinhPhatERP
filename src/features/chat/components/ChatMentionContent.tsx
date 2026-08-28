import { memo } from 'react';

import { Icon } from '@/shared/components/Icon';
import type { ChatMention } from '@/schema/chat.schema';

interface Props {
  content: string;
  mentions?: ChatMention[] | null;
}

function renderTextWithMentions(
  content: string,
  mentions?: ChatMention[] | null,
) {
  if (!content) return null;

  // 1. If explicit mentions metadata exists
  if (mentions && mentions.length > 0) {
    const escapeRegExp = (str: string) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mentionLabels = mentions
      .map((m) => escapeRegExp(m.label))
      .sort((a, b) => b.length - a.length);

    if (mentionLabels.length > 0) {
      const regex = new RegExp(`(${mentionLabels.join('|')})`, 'g');
      const parts = content.split(regex);

      return (
        <span className="chat-bubble-text">
          {parts.map((part, index) => {
            const mention = mentions.find((item) => item.label === part);
            if (mention) {
              return (
                <span
                  key={`mention-${mention.label}-${index}`}
                  className={`chat-mention-inline chat-mention-inline--${mention.type || 'user'}`}
                >
                  {part}
                </span>
              );
            }
            return (
              <span key={`text-${index}-${part.slice(0, 8)}`}>{part}</span>
            );
          })}
        </span>
      );
    }
  }

  // 2. Fallback: Auto-highlight @mentions and #documents in raw text
  const tokenRegex =
    /(@[\p{L}\p{N}_-]+(?:\s+[\p{L}\p{N}_-]+)?|#[\p{L}\p{N}_-]+)/gu;
  const parts = content.split(tokenRegex);

  return (
    <span className="chat-bubble-text">
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          return (
            <span
              key={`auto-mention-${part}-${index}`}
              className="chat-mention-inline chat-mention-inline--user"
            >
              {part}
            </span>
          );
        }
        if (part.startsWith('#')) {
          return (
            <span
              key={`auto-mention-${part}-${index}`}
              className="chat-mention-inline chat-mention-inline--document"
            >
              {part}
            </span>
          );
        }
        return <span key={`raw-text-${index}`}>{part}</span>;
      })}
    </span>
  );
}

export const ChatMentionContent = memo(function ChatMentionContent({
  content,
  mentions,
}: Props) {
  const quoteMatch = content.match(/^↩️ "(.*?)"\n([\s\S]*)$/);

  if (quoteMatch) {
    const [, quoteText, bodyText] = quoteMatch;
    return (
      <div className="chat-bubble-reply-container">
        <div className="chat-bubble-reply-header">
          <Icon name="CornerUpLeft" size={11} />
          <span>Bạn đã trả lời</span>
        </div>
        <div className="chat-bubble-quote-snippet">
          <span className="chat-bubble-quote-text">{quoteText}</span>
        </div>
        <div className="chat-bubble-text-body">
          {renderTextWithMentions(bodyText ?? '', mentions)}
        </div>
      </div>
    );
  }

  return renderTextWithMentions(content, mentions);
});
