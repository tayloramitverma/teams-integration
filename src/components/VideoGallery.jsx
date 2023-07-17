/**---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *---------------------------------------------------------------------------------------------*/
import { useCallback, useMemo } from "react";
import { usePropsFor, VideoGallery } from "@azure/communication-react";
import { Stack, Persona, PersonaSize } from "@fluentui/react";
import React, { useEffect, useState } from "react";
import * as utils from "./../utils/Utils";
import { PinnedIcon, SpotLightIcon, ThreeDotIcon } from "../icons";
import { DefaultButton } from "@fluentui/react/lib/Button";
import { HiHandRaised } from "react-icons/hi2";

const containerStyle = { height: "90vh" };
const remoteVideoViewOptions = {
  scalingMode: "Crop",
  isMirrored: true,
};

export default function VideoGalleryComponent({
  raiseHandParticipants,
  spotLightParticipant,
  pinnedParticipants,
  setPinnedParticipants,
  participantData,
}) {
  const videoGalleryProps = usePropsFor(VideoGallery);

  const [localSpotLightParticipant, setLocalSpotLightParticipant] = useState(
    []
  );

  useEffect(() => {
    const _localSpotLightParticipant = spotLightParticipant.map((p) => {
      return p.identifier.rawId;
    });
    setLocalSpotLightParticipant(_localSpotLightParticipant);
  }, [videoGalleryProps.remoteParticipants, spotLightParticipant]);

  const hightLightParticipant = useMemo(() => {
    const hlParticipant = [...localSpotLightParticipant, ...pinnedParticipants];
    return hlParticipant.filter(
      (item, index) => hlParticipant.indexOf(item) === index
    );
  }, [localSpotLightParticipant, pinnedParticipants]);

  const onRenderAvatar = useCallback(
    (userId, options) => {
      const isRaiseHand = utils.isParticipantHandRaised(
        userId,
        raiseHandParticipants
      );
      const inSpotLight = localSpotLightParticipant.includes(userId);
      const isPinned = pinnedParticipants.includes(userId);
      let item = [];

      if (!isPinned) {
        item = [
          {
            key: "Pin for me",
            iconProps: { iconName: "Pinned" },
            text: "Pin for me",
            onClick: () =>
              setPinnedParticipants(pinnedParticipants.concat(userId)),
            disabled: inSpotLight,
          },
        ];
      } else {
        item = [
          {
            key: "Unpin",
            iconProps: { iconName: "Unpin" },
            text: "Unpin",
            onClick: () =>
              setPinnedParticipants(
                pinnedParticipants.filter((u) => u !== userId)
              ),
          },
        ];
      }
      const menuProps = {
        shouldFocusOnMount: true,
        items: item,
        className: "contextual-menu-render-video-tile",
      };

      return (
        <>
          <div className="custom-avtar-video-gallary">
            <Persona
              size={PersonaSize.size72}
              imageInitials={getInitials(options.text)}
              showOverflowTooltip={false}
            />
            <div className="video-gallary-icon">
              {isRaiseHand && (
                <div className="video-gallry-raise-hand">
                  <HiHandRaised className="raiseHand" />
                </div>
              )}
              <div className="contextual-video-tile-icon-container">
                <div className="contextual-video-tile-icons">
                  {inSpotLight && <SpotLightIcon />}
                  {isPinned && !inSpotLight && <PinnedIcon />}
                </div>

                <DefaultButton
                  className="custom-contextual-button"
                  menuProps={menuProps}
                >
                  <ThreeDotIcon />
                </DefaultButton>
              </div>
            </div>
          </div>
        </>
      );
    },
    [pinnedParticipants, raiseHandParticipants, localSpotLightParticipant]
  );

  const participantList = useMemo(() => {
    const _remoteParticipants = videoGalleryProps.remoteParticipants;
    if (participantData && participantData.length > 0) {
      return _remoteParticipants.map((p) => {
        if (!p.displayName) {
          const spilted = p.userId.split(":");
          const userId = spilted[2];

          const part = participantData.find((pr) => pr.userId === userId);
          p.displayName = part.displayName;
        }
        return p;
      });
    } else {
      return _remoteParticipants;
    }
  }, [participantData, videoGalleryProps.remoteParticipants]);

  return (
    <Stack className="video-gallary" style={containerStyle}>
      <VideoGallery
        onRenderAvatar={onRenderAvatar}
        layout="floatingLocalVideo"
        overflowGalleryPosition={"VerticalRight"}
        {...videoGalleryProps}
        pinnedParticipants={hightLightParticipant}
        localParticipant={videoGalleryProps.localParticipant}
        remoteParticipants={participantList}
        onPinParticipant={(userId) =>
          setPinnedParticipants(pinnedParticipants.concat(userId))
        }
        onUnpinParticipant={(userId) =>
          setPinnedParticipants(pinnedParticipants.filter((u) => u !== userId))
        }
        remoteVideoViewOptions={remoteVideoViewOptions}
      />
    </Stack>
  );
}

function getInitials(name) {
  const words = name.split("");
  const initials = words.map((word) => word.charAt(0));
  const truncatedInitials = initials.slice(0, 2);
  return truncatedInitials.join("").toUpperCase();
}
