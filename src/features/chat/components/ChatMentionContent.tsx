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
  if (!mentions || mentions.length === 0) return <div>{content}</div>;

  const escapeRegExp = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mentionLabels = mentions
    .map((m) => escapeRegExp(m.label))
    .sort((a, b) => b.length - a.length);

  if (mentionLabels.length === 0) return <div>{content}</div>;

  const regex = new RegExp(`(${mentionLabels.join('|')})`, 'g');
  const parts = content.split(regex);

  return (
    <div>
      {parts.map((part, index) => {
        const mention = mentions.find((item) => item.label === part);
        if (mention) {
          return (
            <span
              key={`mention-${mention.label}-${index}`}
              className={`chat-mention-inline chat-mention-inline--${mention.type}`}
            >
              {part}
            </span>
          );
        }
        return <span key={`text-${index}-${part.slice(0, 8)}`}>{part}</span>;
      })}
    </div>
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
      <div className="chat-bubble-content-with-quote">
        <div className="chat-bubble-quote-snippet">
          <Icon name="CornerUpLeft" size={12} />
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
