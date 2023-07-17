/**---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *---------------------------------------------------------------------------------------------*/
import React, { useState, useEffect } from "react";
import { Features } from "@azure/communication-calling";
import { useCall, VideoTile } from "@azure/communication-react";
import {
  mergeStyleSets,
  Panel,
  DefaultButton,
  FocusTrapZone,
  Layer,
  Overlay,
  Popup,
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import useWebSocket from "react-use-websocket";
import ParticipantList from "./ParticipantList";
import VideoGalleryComponent from "./VideoGallery";
import ControlBarComponent from "./ControlBar";
import { ChatMessages } from "./ChatMessages";
import { WS_URL } from "./../authConfig";
import { createChatSubcription } from "./../acsAuthApiCaller";
import { UsersIcon, CrossTickIcon } from "../icons";
import {
  callScreenLoaderLable,
  callScreenLoadingState,
} from "./../utils/Utils";
import { extractChatId } from "./../utils/chatMessageUtils";
import { getGrapthParticipantList } from "../hook";
import "./../styles/callScreen.css";

const popupStyles = mergeStyleSets({
  root: {
    background: "rgba(0, 0, 0, 0.2)",
    bottom: "0",
    left: "0",
    position: "fixed",
    right: "0",
    top: "0",
  },
  title: {
    color: "#fff",
    margin: "0",
    fontSize: "14px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  heading: {
    color: "rgb(255, 255, 255)",
    margin: "12px 0",
    fontSize: "14px",
  },
  content: {
    background: "#000",
    left: "50%",
    maxWidth: "400px",
    padding: "1.5em 1.5em 1.5em",
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    borderRadius: "6px",
  },
  btnContainer: {
    display: "flex",
    gap: "10px",
  },
  admitBtn: {
    background: "#444791",
    border: "1px solid #444791",
    color: "#fff",
    borderRadius: "6px",
  },
  rejectBtn: {
    background: "#000",
    border: "1px solid #fff",
    color: "#fff",
    borderRadius: "6px",
  },
  closeIcon: {
    position: "absolute",
    top: "4px",
    right: "8px",
    cursor: "pointer",
  },
});

export const CallScreen = ({ teamTokens, meetingLink }) => {
  const call = useCall();
  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] =
    useBoolean(false);
  const [isChatOpen, { setTrue: openChatPanel, setFalse: dismissChatPanel }] =
    useBoolean(false);
  const [isPopupVisible, { setTrue: showPopup, setFalse: hidePopup }] =
    useBoolean(false);

  const [spotLightParticipant, setSpotLightParticipant] = useState([]);
  const [graphParticipant, setGraphParticipant] = useState([]);
  const [raiseHandParticipants, setRaiseHandParticipants] = useState([]);
  const [pinnedParticipants, setPinnedParticipants] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [lobbyParticipants, setLobbyParticipants] = useState([]);
  const [loadingBtn, setLoadingBtn] = useState(false);

  useWebSocket(WS_URL, {
    onOpen: () => {
      console.log("WebSocket connection established.");
    },
    share: true,
    filter: () => false,
    retryOnError: true,
    shouldReconnect: () => true,
  });

  useEffect(() => {
    setAccessToken(teamTokens.accessToken);
  }, [teamTokens]);

  useEffect(async () => {
    if (meetingLink) {
      const chatId = extractChatId(meetingLink);

      await createChatSubcription({
        accessToken: teamTokens?.accessToken,
        chatId,
      });
    }
  }, [meetingLink]);

  const raiseHandFeature = call?.feature(Features.RaiseHand);
  const spotlightFeature = call?.feature(Features.Spotlight);

  const raiseHandChangedHandler = () => {
    setRaiseHandParticipants(raiseHandFeature.getRaisedHands());
  };

  const spotlightStateChangedHandler = () => {
    setSpotLightParticipant(spotlightFeature.getSpotlightedParticipants());
  };

  useEffect(() => {
    raiseHandFeature.on("loweredHandEvent", raiseHandChangedHandler);
    raiseHandFeature.on("raisedHandEvent", raiseHandChangedHandler);
    spotlightFeature.on("spotlightChanged", spotlightStateChangedHandler);
  }, []);

  useEffect(() => {
    if (call && accessToken) {
      const handleLobbyParticipant = (participant) => {
        if (
          !lobbyParticipants.find((p) => {
            return p.userId === participant._identifier.rawId;
          })
        ) {
          setLobbyParticipants((oldRemoteParticipants) => {
            let newParticipant = {
              userId: participant._identifier.rawId,
              identifier: participant._identifier,
              displayName: participant?._tsParticipant.displayName,
            };

            return [...oldRemoteParticipants, newParticipant];
          });
        }
      };

      call.on("remoteParticipantsUpdated", (e) => {
        if (accessToken) {
          getGrapthParticipantList(meetingLink, accessToken).then((results) => {
            setGraphParticipant(results?.value || []);
          });
        }

        let addFlag = false;
        e.added.forEach((participant) => {
          if (participant._state === "InLobby") {
            handleLobbyParticipant(participant);
            addFlag = true;
          }
        });

        if (addFlag) {
          showPopup();
          setLoadingBtn(false);
        }
      });
    }
  }, [call, accessToken]);

  const admitParticipant = async (e, callingParticipant) => {
    e.preventDefault();
    if (e.detail === 0) {
      return false;
    }
    try {
      setLoadingBtn(true);
      await call.admit(callingParticipant.identifier);
      setLobbyParticipants((oldRemoteParticipants) => {
        let eData = oldRemoteParticipants.filter(
          (item) => item.userId != callingParticipant.userId
        );
        return eData;
      });
      setLoadingBtn(false);
    } catch (err) {
      console.error(err);
    }
  };

  const rejectParticipant = async (e, callingParticipant) => {
    if (e.detail === 0) {
      return false;
    }
    e.preventDefault();
    try {
      setLoadingBtn(true);
      await call.removeParticipant(callingParticipant.identifier);
      setLobbyParticipants((oldRemoteParticipants) => {
        let eData = oldRemoteParticipants.filter(
          (item) => item.userId != callingParticipant.userId
        );
        return eData;
      });
      setLoadingBtn(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {!callScreenLoadingState.includes(call.state) ? (
        <VideoGalleryComponent
          raiseHandParticipants={raiseHandParticipants}
          spotLightParticipant={spotLightParticipant}
          pinnedParticipants={pinnedParticipants}
          setPinnedParticipants={setPinnedParticipants}
          participantData={graphParticipant}
        />
      ) : (
        <VideoTile
          styles={{
            root: { height: "100%", width: "100", border: "0px solid #999" },
          }}
          displayName={""}
          showMuteIndicator={true}
          isMuted={true}
          renderElement={null}
          isMirrored={true}
          onRenderPlaceholder={() => (
            <div className="spinner-center">
              <Spinner
                size={SpinnerSize.large}
                label={callScreenLoaderLable(call.state)}
              />
            </div>
          )}
        />
      )}

      <Panel
        headerText="Participants"
        isOpen={isOpen}
        onDismiss={dismissPanel}
        // You MUST provide this prop! Otherwise screen readers will just say "button" with no label.
        closeButtonAriaLabel="Close"
      >
        <ParticipantList
          raiseHandParticipants={raiseHandParticipants}
          spotLightParticipant={spotLightParticipant}
          pinnedParticipants={pinnedParticipants}
          setPinnedParticipants={setPinnedParticipants}
          participantData={graphParticipant}
        />
      </Panel>
      <Panel
        className="chat-panel"
        headerText="Chat"
        isOpen={isChatOpen}
        onDismiss={dismissChatPanel}
        closeButtonAriaLabel="Close"
        // isHiddenOnDismiss={true}
      >
        <ChatMessages meetingLink={meetingLink} teamTokens={teamTokens} />
      </Panel>

      <ControlBarComponent
        openChatPanel={openChatPanel}
        openPanel={openPanel}
        acsID={teamTokens?.communicationUserId}
        raiseHandParticipants={raiseHandParticipants}
      />

      {isPopupVisible && lobbyParticipants.length > 0 && (
        <Layer>
          <Popup
            className={popupStyles.root}
            role="dialog"
            aria-modal="true"
            onDismiss={hidePopup}
          >
            <Overlay onClick={hidePopup} />
            <FocusTrapZone>
              <div role="document" className={popupStyles.content}>
                <p className={popupStyles.title}>
                  <UsersIcon /> Waiting in lobby{" "}
                  <span className={popupStyles.closeIcon} onClick={hidePopup}>
                    <CrossTickIcon />
                  </span>
                </p>
                <h4 className={popupStyles.heading}>
                  {lobbyParticipants[0].displayName}
                </h4>
                <div className={popupStyles.btnContainer}>
                  {loadingBtn ? (
                    <div className="spinner-center">
                      <Spinner />
                    </div>
                  ) : (
                    <>
                      <DefaultButton
                        className={popupStyles.rejectBtn}
                        onClick={(e) =>
                          rejectParticipant(e, lobbyParticipants[0])
                        }
                      >
                        Deny
                      </DefaultButton>
                      <DefaultButton
                        className={popupStyles.admitBtn}
                        onClick={(e) =>
                          admitParticipant(e, lobbyParticipants[0])
                        }
                      >
                        Admit
                      </DefaultButton>
                    </>
                  )}
                </div>
              </div>
            </FocusTrapZone>
          </Popup>
        </Layer>
      )}
    </>
  );
};
