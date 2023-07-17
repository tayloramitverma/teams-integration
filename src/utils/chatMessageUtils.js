export const convertObjectTeamToLocal = (_m, userId) => {
    const attachedFilesMetadata = _m?.attachments.map((c) => {
        return {
            name: c.name,
            extension: "xlsx",
            url: c.contentUrl,
            attachmentType: "fileSharing",
            id: c.id,
        };
    });

    return {
        messageType: "chat",
        senderId: _m?.from?.user?.id,
        senderDisplayName: _m?.from?.user?.displayName,
        messageId: _m.id,
        content: _m.messageType === "message" ? _m.body.content : "hideMessage",
        contentType: _m?.body?.contentType,
        createdOn: new Date(_m?.lastModifiedDateTime),
        mine: userId === _m?.from?.user?.id ? true : false,
        attached: false,
        status: "seen",
        attachedFilesMetadata: attachedFilesMetadata,
    }
}

export const extractChatId = (meetingLink) => {
    const regex = /\/([^/]+)\/0/;
    const match = meetingLink.match(regex);
    return match ? match[1] : null;
}