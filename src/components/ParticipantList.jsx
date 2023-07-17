/**---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *---------------------------------------------------------------------------------------------*/
import React, { useState, useEffect, useCallback } from "react";
import { PersonaPresence, Stack } from "@fluentui/react";
import {
  ParticipantList,
  ParticipantItem,
  useCall,
  usePropsFor,
} from "@azure/communication-react";
import { Features } from "@azure/communication-calling";
import { isParticipantHandRaised } from "../utils/Utils";
import { MicIcon } from "../icons";
import { RxCheckCircled, RxCrossCircled } from "react-icons/rx";
import { HiHandRaised } from "react-icons/hi2";
import { Text } from "@fluentui/react";

export default function CustomParticipantList({
  raiseHandParticipants,
  spotLightParticipant,
  pinnedParticipants,
  setPinnedParticipants,
  participantData,
}) {
  const call = useCall();
  const participantList = usePropsFor(ParticipantList);
  const [remoteParticipants, setRmoteParticipants] = useState([]);

  const mockMyUserId = participantList.myUserId;

  useEffect(() => {
    if (call) {
      const handleParticipant = (participant) => {
        if (
          !remoteParticipants.find((p) => {
            return p.userId === participant._identifier.rawId;
          })
        ) {
          let displayName = participant?._tsParticipant.displayName;
          if (
            (displayName === undefined || displayName === "") &&
            displayName !== "You"
          ) {
            displayName = participantData.find(
              (pr) => pr.userId === participant._identifier.microsoftTeamsUserId
            )?.displayName;
          }
          setRmoteParticipants((oldRemoteParticipants) => {
            let newParticipant = {
              userId: participant._identifier.rawId,
              displayName: displayName,
              state: participant._state,
              isMuted: participant._isMuted,
              isRemovable: true,
              identifier: participant._identifier,
              raisedHandState: isParticipantHandRaised(
                participant._identifier.rawId,
                raiseHandParticipants
              ),
              spotlightState: isParticipantHandRaised(
                participant._identifier.rawId,
                spotLightParticipant
              ),
              pinState: pinnedParticipants.includes(
                participant._identifier.rawId
              ),
            };

            return [...oldRemoteParticipants, newParticipant];
          });
        }
      };

      if (
        !remoteParticipants.find((p) => {
          return p.userId === mockMyUserId;
        })
      ) {
        let activeAdmin = participantList.participants.find((p) => {
          return p.userId === mockMyUserId;
        });

        if (activeAdmin) {
          let microsoftTeamsUserId = activeAdmin.userId.split(":");

          activeAdmin._tsParticipant = { displayName: "You" };
          activeAdmin._identifier = {
            rawId: activeAdmin.userId,
            microsoftTeamsUserId: microsoftTeamsUserId[2],
          };
          activeAdmin.raisedHandState = isParticipantHandRaised(
            activeAdmin.userId,
            raiseHandParticipants
          );
          activeAdmin.spotlightState = isParticipantHandRaised(
            activeAdmin.userId,
            spotLightParticipant
          );
          activeAdmin.pinState = pinnedParticipants.includes(
            activeAdmin.userId
          );

          handleParticipant(activeAdmin);
        }
      }

      call.remoteParticipants.forEach((rp) => handleParticipant(rp));

      call.on("remoteParticipantsUpdated", (e) => {
        // console.log(
        //   `Call=${call.callId}, remoteParticipantsUpdated, added=${e.added}, removed=${e.removed}`
        // );

        e.added.forEach((participant) => {
          handleParticipant(participant);
        });

        e.removed.forEach((participant) => {
          setRmoteParticipants((oldPinnedParticipants) => {
            let remainingPart = oldPinnedParticipants.filter((p) => {
              return p.userId !== participant.identifier.rawId;
            });
            return remainingPart;
          });
        });
      });
    }
  }, [call]);

  useEffect(() => {
    setRmoteParticipants((oldRemoteParticipants) => {
      let eData = oldRemoteParticipants.map((pr) => {
        if (
          isParticipantHandRaised(pr.identifier.rawId, spotLightParticipant)
        ) {
          pr.spotlightState = true;
          return pr;
        }
        pr.spotlightState = false;
        return pr;
      });
      return eData;
    });
  }, [spotLightParticipant]);

  useEffect(() => {
    setRmoteParticipants((oldRemoteParticipants) => {
      let eData = oldRemoteParticipants.map((pr) => {
        if (pinnedParticipants.includes(pr.identifier.rawId)) {
          pr.pinState = true;
          return pr;
        }
        pr.pinState = false;
        return pr;
      });
      return eData;
    });
  }, [pinnedParticipants]);

  const onRenderParticipant = useCallback(
    (participant) => {
      const callingParticipant = participant;

      let presence = undefined;
      if (callingParticipant) {
        if (callingParticipant.state === "Connected") {
          presence = PersonaPresence.online;
        } else if (callingParticipant.state === "Idle") {
          presence = PersonaPresence.away;
        } else if (callingParticipant.state === "Connecting") {
          presence = PersonaPresence.offline;
        }
      }

      let menuItems = [];

      if (
        callingParticipant.state === "Connected" &&
        callingParticipant.userId !== mockMyUserId
      ) {
        menuItems.push(
          {
            key: "pintop",
            text: callingParticipant.pinState ? "Unpin" : "Pin for me",
            iconProps: {
              iconName: callingParticipant.pinState ? "PinnedSolid" : "Pinned",
            },
            disabled: isParticipantHandRaised(
              callingParticipant.identifier.rawId,
              spotLightParticipant
            ),
            onClick: async () => {
              setPinnedParticipants((oldPinnedParticipants) => {
                if (oldPinnedParticipants !== undefined) {
                  return !callingParticipant.pinState
                    ? [
                        ...oldPinnedParticipants,
                        callingParticipant.identifier.rawId,
                      ]
                    : oldPinnedParticipants.filter(
                        (pinItem) =>
                          pinItem !== callingParticipant.identifier.rawId
                      );
                }
              });
              setRmoteParticipants((oldRemoteParticipants) => {
                let eData = oldRemoteParticipants.map((pr) => {
                  if (callingParticipant.userId === pr.userId) {
                    pr.pinState = !callingParticipant.pinState;
                    return pr;
                  }
                  return pr;
                });
                return eData;
              });
            },
          },
          {
            key: "spotlight",
            text: callingParticipant.spotlightState
              ? "Exit spotelight"
              : "Spotelight for Everyone",
            iconProps: { iconName: "FabricUserFolder" },
            onClick: async () => {
              try {
                const spotlightFeature = call.feature(Features.Spotlight);
                callingParticipant.spotlightState
                  ? await spotlightFeature.stopSpotlight([
                      callingParticipant.identifier,
                    ])
                  : await spotlightFeature.startSpotlight([
                      callingParticipant.identifier,
                    ]);
              } catch (err) {
                console.error(err);
              }
            },
          }
        );
      }

      const admitParticipant = async (e) => {
        e.preventDefault();
        if (e.detail === 0) {
          return false;
        }
        try {
          await call.admit(callingParticipant.identifier);
          setRmoteParticipants((oldRemoteParticipants) => {
            let eData = oldRemoteParticipants.map((pr) => {
              if (callingParticipant.userId === pr.userId) {
                pr.state = "Connected";
                return pr;
              }
              return pr;
            });
            return eData;
          });
        } catch (err) {
          console.error(err);
        }
      };

      const rejectParticipant = async (e) => {
        e.preventDefault();
        if (e.detail === 0) {
          return false;
        }
        try {
          await call.removeParticipant(callingParticipant.identifier);
          setRmoteParticipants((oldRemoteParticipants) => {
            let eData = oldRemoteParticipants.filter(
              (item) => item.userId != callingParticipant.userId
            );
            return eData;
          });
        } catch (err) {
          console.error(err);
        }
      };

      const onRenderIcon = () => (
        <>
          {callingParticipant.state === "InLobby" ? (
            <div className="participant-icons" style={{ marginBottom: 6 }}>
              <span onClick={(e) => admitParticipant(e)}>
                <Text variant="xLarge" className="green">
                  <RxCheckCircled />
                </Text>
              </span>
              <span onClick={(e) => rejectParticipant(e)}>
                <Text variant="xLarge" className="red">
                  <RxCrossCircled />
                </Text>
              </span>
            </div>
          ) : (
            <div className="participant-icons">
              {callingParticipant.raisedHandState && (
                <HiHandRaised className="raiseHand" />
              )}
              {callingParticipant?.isMuted && <MicIcon />}
            </div>
          )}
        </>
      );

      if (participant.displayName) {
        return (
          <ParticipantItem
            key={participant.userId}
            displayName={participant.displayName}
            me={participant.userId === mockMyUserId}
            menuItems={menuItems}
            presence={presence}
            onRenderIcon={onRenderIcon}
          />
        );
      }
      return <></>;
    },
    [remoteParticipants]
  );

  return (
    <Stack>
      {remoteParticipants !== undefined && remoteParticipants.length > 0 && (
        <ParticipantList
          participants={remoteParticipants}
          myUserId={mockMyUserId}
          onRenderParticipant={onRenderParticipant}
        />
      )}
    </Stack>
  );
}
