/**---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *---------------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from "react";
import "./styles/App.css";
import { TestCallTeamsUserContent } from "./components/TestCallTeamsUserContent";
import { CallInputManual } from "./components/CallInputManual";
import { SwitchableFluentThemeProvider } from "./theming/SwitchableFluentThemeProvider";
import { getAccessToken } from "./acsAuthApiCaller";

export default function App() {
  const [teamTokens, setTeamTokens] = useState(null);
  const [meetingLink, setMeetingLink] = useState(null);

  useEffect(() => {
    const messageListener = (event) => {
      const data = event.data;

      try {
        const parsedData = JSON.parse(data);

        setMeetingLink(decodeURIComponent(parsedData?.link));
        getTeamsToken(parsedData?.RepId);
      } catch (error) {
        console.log(error, "error");
      }
    };

    // Add the event listener
    window.addEventListener("message", messageListener);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("message", messageListener);
    };
  }, []);

  const getTeamsToken = (payload) => {
    getAccessToken(payload)
      .then((res) => {
        setTeamTokens(res.data);
      })
      .catch((error) => {
        console.log(error, "error");
      });
  };

  const endCall = () => {
    setTeamTokens(null);
    setMeetingLink("")
  }

  return (
    <>
      <SwitchableFluentThemeProvider scopeId="SampleCallingApp">
        <div className="App">
          {teamTokens && (
            <TestCallTeamsUserContent
              teamTokens={teamTokens}
              meetingLink={meetingLink}
              endCall={endCall}
            />
          )}

          {!teamTokens && (
            <CallInputManual
              meetingLink={meetingLink}
              setMeetingLink={setMeetingLink}
              teamTokens={teamTokens}
              getTeamsToken={getTeamsToken}
            />
          )}
        </div>
      </SwitchableFluentThemeProvider>
    </>
  );
}
