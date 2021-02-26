import React, { useCallback, useContext, useMemo } from 'react';
import type { TranslationLanguages } from 'stream-chat';
import type { FixedHeightMessageProps } from 'types';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';
import { ChatContext, TranslationContext } from '../../context';
import { renderText } from '../../utils';
import { Avatar } from '../Avatar';
import { Gallery } from '../Gallery';
import { MessageActions } from '../MessageActions';
import { MML } from '../MML';
import { useActionHandler, useUserRole } from './hooks';
import { MessageTimestamp } from './MessageTimestamp';
import { getMessageActions } from './utils';

const selectColor = (number: number, dark: boolean) => {
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},${dark ? '50%' : '85%'}, ${dark ? '75%' : '55%'})`;
};

const hashUserId = (userId: string) => {
  const hash = userId.split('').reduce((acc, c) => {
    acc = (acc << 5) - acc + c.charCodeAt(0); // eslint-disable-line
    return acc & acc; // eslint-disable-line no-bitwise
  }, 0);
  return Math.abs(hash) / 10 ** Math.ceil(Math.log10(Math.abs(hash) + 1));
};

const getUserColor = (theme: string, userId: string) =>
  selectColor(hashUserId(userId), theme.includes('dark'));

/**
 * FixedHeightMessage - This component renders a single message.
 * It uses fixed height elements to make sure it works well in VirtualizedMessageList
 */
const UnmemoizedFixedHeightMessage = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  groupedByUser,
  message,
}: FixedHeightMessageProps<At, Ch, Co, Me, Re, Us>) => {
  const { theme } = useContext(ChatContext);
  const { userLanguage } = useContext(TranslationContext);

  const role = useUserRole<At, Ch, Co, Ev, Me, Re, Us>(message);
  const handleAction = useActionHandler<At, Ch, Co, Ev, Me, Re, Us>(message);

  const messageTextToRender =
    message?.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    message?.text;

  const renderedText = useMemo(
    () => renderText(messageTextToRender, message.mentioned_users),
    [message.mentioned_users, messageTextToRender],
  );

  const userId = message.user?.id;
  // @ts-expect-error
  const userColor = useMemo(() => getUserColor(theme, userId), [userId, theme]);

  const messageActionsHandler = useCallback(
    () => getMessageActions(['delete'], { canDelete: role.canDeleteMessage }),
    [role],
  );

  const images = message?.attachments?.filter(({ type }) => type === 'image');

  return (
    <div
      className={`str-chat__virtual-message__wrapper ${
        role.isMyMessage ? 'str-chat__virtual-message__wrapper--me' : ''
      } ${groupedByUser ? 'str-chat__virtual-message__wrapper--group' : ''}`}
      key={message.id}
    >
      <Avatar
        // @ts-expect-error
        image={message.user?.image}
        name={message.user?.name || message.user?.id}
        shape='rounded'
        size={38}
      />

      <div className='str-chat__virtual-message__content'>
        <div className='str-chat__virtual-message__meta'>
          <div
            className='str-chat__virtual-message__author'
            style={{ color: userColor }}
          >
            <strong>{message.user?.name || 'unknown'}</strong>
          </div>
        </div>

        {images && <Gallery images={images} />}

        <div className='str-chat__virtual-message__text' data-testid='msg-text'>
          {renderedText}

          {message.mml && (
            <MML
              actionHandler={handleAction}
              align='left'
              source={message.mml}
            />
          )}

          <div className='str-chat__virtual-message__data'>
            <MessageActions
              customWrapperClass='str-chat__virtual-message__actions'
              getMessageActions={messageActionsHandler}
              message={message}
            />
            <span className='str-chat__virtual-message__date'>
              <MessageTimestamp
                customClass='str-chat__message-simple-timestamp'
                message={message}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FixedHeightMessage = React.memo(UnmemoizedFixedHeightMessage);
