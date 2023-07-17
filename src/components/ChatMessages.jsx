/**---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *---------------------------------------------------------------------------------------------*/
import React, { useState, useEffect, useMemo, useRef } from "react";
import { MessageThread, SendBox } from "@azure/communication-react";
import { Client } from "@microsoft/microsoft-graph-client";
import { useCallback } from "react";
import { Spinner } from "@fluentui/react/lib/Spinner";
import useWebSocket from "react-use-websocket";
import { WS_URL } from "./../authConfig";
import { convertObjectTeamToLocal, extractChatId } from "../utils/chatMessageUtils";

function isMessageEvent(message) {
  let evt = JSON.parse(message.data);
  return evt.type === "MESSAGE_EVENT";
}

export const ChatMessages = ({ meetingLink, teamTokens }) => {
  const [teamsMessages, setTeamsMessages] = useState({});
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { lastJsonMessage, readyState } = useWebSocket(WS_URL, {
    share: true,
    filter: isMessageEvent,
  });

  const chatId = useMemo(() => {
    return extractChatId(meetingLink);
  }, [meetingLink]);

  useEffect(() => {
    if (lastJsonMessage?.chatId === chatId) {
      getMessages();
    }
  }, [lastJsonMessage]);

  const calledNextApi = useRef([]);
  const messageIds = useRef([]);
  const callApiRef = useRef(false);

  const client = useMemo(() => {
    if (teamTokens?.accessToken) {
      return Client.init({
        defaultVersion: "v1.0",
        debugLogging: true,
        authProvider: (done) => {
          done("error", teamTokens?.accessToken);
        },
      });
    }
  }, [teamTokens?.accessToken]);

  const getMessages = async (loading = false) => {
    messageIds.current = [];
    setIsLoading(loading);
    const response = await client
      .api(`/chats/${chatId}/messages?$top=40`)
      .get();
    setTeamsMessages(response);
    cleanifyMessage(response?.value, true);
    setIsLoading(false);

    // if (
    //   response?.value?.filter(
    //     (m) => m?.messageType === "message" && m?.body?.content
    //   ).length < 10
    // ) {
    //   client
    //     .api(response["@odata.nextLink"])
    //     .get()
    //     .then((response) => {
    //       setTeamsMessages(response);
    //       cleanifyMessage(response.value);
    //     });
    // }
  };

  const cleanifyMessage = (tMessages, initial = false) => {
    let _message = tMessages.filter(
      (m) => m.messageType === "message" && m.body.content
    );

    _message = _message.filter((_m) => {
      if (messageIds.current.includes(_m.id)) {
        return false;
      } else {
        const ids = [...messageIds.current];
        messageIds.current = [...ids, _m.id];
        return true;
      }
    });

    _message = _message.map((_m) => {
      return convertObjectTeamToLocal(_m, teamTokens?.userId);
    });

    _message.reverse();
    if (initial) {
      setMessages(_message);
    } else {
      setMessages((oldMessages) => [..._message, ...oldMessages]);
    }
  };

  const onDeleteMessage = async (messageId) => {
    setMessages((oldMessages) => {
      return oldMessages.filter((m) => m.messageId !== messageId);
    });
    try {
      await client
        .api(
          `/users/${teamTokens?.userId}/chats/${chatId}/messages/${messageId}/softDelete`
        )
        .post();
    } catch (error) {
      console.log(error);
    }
  };

  const onSendMessage = async (message) => {
    try {
      const response = await client.api(`/chats/${chatId}/messages`).post({
        body: { content: message },
      });
      setMessages((oldMessages) => [
        ...oldMessages,
        convertObjectTeamToLocal(response, teamTokens?.userId),
      ]);
      if (!readyState) {
        getMessages();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onUpdateMessage = async (messageId, message) => {
    try {
      setMessages((oldMessages) => {
        const index = oldMessages.findIndex((m) => m.messageId === messageId);
        oldMessages[index].content = message;
        return oldMessages;
      });
      await client.api(`/chats/${chatId}/messages/${messageId}`).patch({
        body: { content: message },
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (chatId) {
      getMessages(true);
    }
  }, [chatId]);

  const onLoadPreviousChatMessages = useCallback(() => {
    if (
      teamTokens?.accessToken &&
      teamsMessages["@odata.nextLink"] &&
      !callApiRef.current &&
      !calledNextApi.current.includes(teamsMessages["@odata.nextLink"])
    ) {
      calledNextApi.current = [
        ...calledNextApi.current,
        teamsMessages["@odata.nextLink"],
      ];

      callApiRef.current = true;
      client
        .api(teamsMessages["@odata.nextLink"])
        .get()
        .then((response) => {
          callApiRef.current = false;

          setTeamsMessages(response);
          cleanifyMessage(response.value);
        });
    }
  }, [teamTokens?.accessToken, client, teamsMessages["@odata.nextLink"]]);

  return (
    <>
      <div className="c-chat-container" id="chat_container">
        {isLoading && (
          <div className="spinner-center">
            <Spinner label="Loading messages..." />
          </div>
        )}
        {!isLoading && (
          <MessageThread
            onLoadPreviousChatMessages={onLoadPreviousChatMessages}
            styles={{
              chatContainer: { padding: 0 },
              blockedMessageContainer: { display: "none" },
            }}
            userId={teamTokens?.userId}
            messages={messages}
            onUpdateMessage={onUpdateMessage}
            onDeleteMessage={onDeleteMessage}
            numberOfChatMessagesToReload={10000}
          />
        )}
      </div>
      <div className="send-message">
        <SendBox
          styles={{
            textFieldContainer: { margin: 0 },
          }}
          onSendMessage={onSendMessage}
          onTyping={async () => {
            return;
          }}
        />
      </div>
    </>
  );
};
