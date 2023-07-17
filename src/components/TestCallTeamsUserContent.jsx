/**---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *---------------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useMemo } from "react";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import {
  CallClientProvider,
  CallAgentProvider,
  CallProvider,
  CallComposite,
  createAzureCommunicationCallAdapter,
} from "@azure/communication-react";
import { CallScreen } from "./CallScreen";
import { endpoint } from "../authConfig";
import { Spinner } from "@fluentui/react/lib/Spinner";
import "./../styles/callScreen.css";
import { useSwitchableFluentTheme } from "./../theming/SwitchableFluentThemeProvider";

let updatedAdapter = true;

export const TestCallTeamsUserContent = ({
  teamTokens,
  meetingLink,
  endCall,
}) => {
  const [call, setCall] = useState("");
  const [callAdapter, setCallAdapter] = useState(null);
  const [callState, setCallState] = useState(false);
  const [statefulCallClient, setStatefulCallClient] = useState();
  const [callAgent, setCallAgent] = useState();
  const { currentTheme } = useSwitchableFluentTheme();

  const inCallUser = !![
    "Connecting",
    "Connected",
    "Disconnecting",
    "InLobby",
  ].includes(callState);

  const callAdapterOptions = useMemo(() => {
    const videoBackgroundImages = [
      {
        key: "ab1",
        url: "/backgrounds/contoso.png",
        tooltipText: "Custom Background",
      },
      {
        key: "ab2",
        url: "/backgrounds/abstract2.jpg",
        tooltipText: "Custom Background",
      },
      {
        key: "ab3",
        url: "/backgrounds/abstract3.jpg",
        tooltipText: "Custom Background",
      },
      {
        key: "ab4",
        url: "/backgrounds/room1.jpg",
        tooltipText: "Custom Background",
      },
      {
        key: "ab5",
        url: "/backgrounds/room2.jpg",
        tooltipText: "Custom Background",
      },
      {
        key: "ab6",
        url: "/backgrounds/room3.jpg",
        tooltipText: "Custom Background",
      },
      {
        key: "ab7",
        url: "/backgrounds/room4.jpg",
        tooltipText: "Custom Background",
      },
    ];
    return {
      videoBackgroundImages: videoBackgroundImages,
    };
  }, []);

  useEffect(() => {
    if (
      teamTokens &&
      teamTokens?.acsToken !== "" &&
      teamTokens?.communicationUserId !== "" &&
      callAdapter === null &&
      updatedAdapter &&
      meetingLink !== ""
    ) {
      updatedAdapter = false;

      createAzureCommunicationCallAdapter({
        userId: { communicationUserId: teamTokens?.communicationUserId },
        credential: new AzureCommunicationTokenCredential({
          refreshProactively: true,
          token: teamTokens?.acsToken,
          tokenRefresher: async () => {
            const refreshedToken = await getCommunicationTokenForTeamsUser();
            return refreshedToken.acsToken;
          },
        }),
        endpoint: endpoint,
        locator: { meetingLink: meetingLink },
        options: callAdapterOptions,
      })
        .then((adapter) => {
          setCallAdapter(adapter);
          setStatefulCallClient(adapter.callClient);
          setCallAgent(adapter.callAgent);

          adapter.callAgent.on("callsUpdated", (e) => {
            e.added.forEach((c) => {
              setCall(c);
            });
          });
        })
        .catch((error) => console.log(error));
    }
  }, [teamTokens, callAdapter, meetingLink]);

  useEffect(() => {
    if (call) {
      call.on("stateChanged", () => {
        setCallState(call.state);
      });
    }
  }, [call]);

  useEffect(() => {
    const destroyCall = async () => {
      try {
        callAdapter && callAdapter?.dispose();
        setCallAdapter(null);
        setStatefulCallClient("");
        setCall("");
        setCallAgent("");
        updatedAdapter = true;
        endCall();
        window.parent.postMessage("CallIsTerminated", "*");
      } catch (error) {
        console.log(error);
        endCall();
        window.parent.postMessage("CallIsTerminated", "*");
      }
    };

    if (callState === "Disconnected") {
      destroyCall();
    }
  }, [callState]);

  if (callAdapter) {
    return (
      <div
        className="call-container"
        style={{ width: "100vw", height: "100vh" }}
      >
        {!inCallUser ? (
          <CallComposite
            adapter={callAdapter}
            fluentTheme={currentTheme.theme}
          />
        ) : (
          statefulCallClient && (
            <CallClientProvider callClient={statefulCallClient}>
              <CallAgentProvider callAgent={callAgent}>
                <CallProvider call={call}>
                  <CallScreen
                    meetingLink={meetingLink}
                    teamTokens={teamTokens}
                  />
                </CallProvider>
              </CallAgentProvider>
            </CallClientProvider>
          )
        )}
      </div>
    );
  } else {
    return (
      <>
        <div className="spinner-center">
          <Spinner label="Joining call..." />
        </div>
      </>
    );
  }
};
