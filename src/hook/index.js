import { Client } from "@microsoft/microsoft-graph-client";

export const getGrapthParticipantList = async (meetingLink, accessToken) => {
  if (meetingLink && accessToken) {
    const regex = /\/([^/]+)\/0/;
    const match = meetingLink.match(regex);
    const meetingId = match ? match[1] : null;

    console.log("meetingId", meetingId);

    const client = Client.init({
      defaultVersion: "v1.0",
      debugLogging: true,
      authProvider: (done) => {
        done("error", accessToken);
      },
    });

    return await client.api(`/chats/${meetingId}/members`).get();
  } else {
    return [];
  }
};
