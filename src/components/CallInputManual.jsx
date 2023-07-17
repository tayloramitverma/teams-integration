/**---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *---------------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import { Spinner } from "@fluentui/react/lib/Spinner";

export const CallInputManual = ({
  teamTokens,
  meetingLink,
  setMeetingLink,
  getTeamsToken,
}) => {
  const [joinTeamsButtonText, setJoinTeamsButtonText] = useState(
    "Join as a Teams user"
  );

  const joinMeeting = () => {
    setJoinTeamsButtonText("Loading call...");
    const dehst = "dehst";
    getTeamsToken(dehst);
  };

  return (
    <>
      {process.env.NODE_ENV === "production" && (
        <div className="spinner-center">
          <Spinner label="Joining call..." />
        </div>
      )}
      <div
        style={{
          display: process.env.NODE_ENV === "production" ? "none" : "block",
        }}
      >
        <h5 className="card-title">Welcome {teamTokens?.name} </h5>
        <h5 className="card-title">
          Communication Token :&nbsp;&nbsp;
          <input
            type="text"
            defaultValue={teamTokens?.acsToken}
            id="communicationTokenTextBox"
          />
        </h5>
        <h5 className="card-title">
          Teams Meeting Link :&nbsp;&nbsp;
          <input
            type="text"
            id="meetingLinkTextBox"
            value={meetingLink}
            onChange={(event) =>
              setMeetingLink(decodeURIComponent(event.target.value))
            }
          />
        </h5>
        <Button
          id="joinTeamMeeting"
          variant="secondary"
          onClick={joinMeeting}
          disabled={!meetingLink}
        >
          {joinTeamsButtonText}
        </Button>
      </div>
    </>
  );
};
