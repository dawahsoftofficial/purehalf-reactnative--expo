import _ from 'lodash';
import { useCallback, useState } from 'react';

type Params = {
  totalMessages: any[];
  messages: any[];
  setMessages: (updater: any) => void;

  handleLastDeletedBy: (msgs: any[], lastDeleted?: boolean) => Promise<any>;

  listReachedStart: boolean;
  setListReachedStart: (v: boolean) => void;

  setLastDeletedByFound: (v: boolean) => void;
};

export const useMessagePagination = ({
  totalMessages,
  messages,
  setMessages,
  handleLastDeletedBy,
  listReachedStart,
  setListReachedStart,
  setLastDeletedByFound,
}: Params) => {
  const [messagesPage, setMessagesPage] = useState({ start: 0, end: 15 });
  const [footerLoading, setFooterLoading] = useState(false);

  const handleEndReached = useCallback(() => {
    if (totalMessages.length < 15) return;

    if (listReachedStart) setListReachedStart(false);

    setFooterLoading(true);

    const newPage = {
      start: messagesPage.start + 15,
      end: messagesPage.end + 15,
    };

    const filtered = _.slice(totalMessages, newPage.start, newPage.end);

    if (filtered.length === 0) {
      setFooterLoading(false);
      return;
    }

    setMessagesPage(newPage);

    handleLastDeletedBy(filtered)
      .then((res: any) => {
        if (res !== 'ignore') {
          setMessages((prev: any[]) => [...prev, ...res]);
        }
      })
      .finally(() => {
        setFooterLoading(false);
      });
  }, [
    totalMessages,
    listReachedStart,
    setListReachedStart,
    messagesPage,
    handleLastDeletedBy,
    setMessages,
  ]);

  const resetToFirstPage = useCallback(() => {
    if (messages.length <= 15) return Promise.resolve();

    const filtered = _.slice(messages, 0, 15);

    setMessagesPage({ start: 0, end: 15 });
    setLastDeletedByFound(false);

    return handleLastDeletedBy(filtered, false).then((res: any) => {
      if (res !== 'ignore') setMessages(res);
    });
  }, [messages, handleLastDeletedBy, setMessages, setLastDeletedByFound]);

  return {
    footerLoading,
    handleEndReached,
    resetToFirstPage,
  };
};
