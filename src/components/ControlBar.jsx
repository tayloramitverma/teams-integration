/**---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *---------------------------------------------------------------------------------------------*/
import React, { useEffect, useState, useRef } from "react";
import {
  useCall,
  CameraButton,
  ControlBar,
  EndCallButton,
  MicrophoneButton,
  usePropsFor,
  ScreenShareButton,
} from "@azure/communication-react";
import { Features } from "@azure/communication-calling";
import { DefaultButton, Text } from "@fluentui/react";
import * as utils from "./../utils/Utils";
import { RxShare2 } from "react-icons/rx";
import { CgFileDocument } from "react-icons/cg";
import { HiOutlineHandRaised, HiHandRaised } from "react-icons/hi2";
import { BsChatText } from "react-icons/bs";
import { BsFillPeopleFill } from "react-icons/bs";
import { pdf_host } from "../authConfig";

export default function ControlBarComponent({
  openChatPanel,
  openPanel,
  acsID,
  raiseHandParticipants,
}) {
  const controllBarEle = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const microphoneProps = usePropsFor(MicrophoneButton);
  const endCallProps = usePropsFor(EndCallButton);
  const cameraProps = usePropsFor(CameraButton);
  const screenShareProps = usePropsFor(ScreenShareButton);
  const call = useCall();
  const buttonsDisabled = !(call?.state === "Connected");
  const raiseHandFeature = call?.feature(Features.RaiseHand);

  useEffect(() => {
    setIsHandRaised(
      utils.isParticipantHandRaised(acsID, raiseHandParticipants)
    );
  }, [raiseHandParticipants]);

  const handleRaiseHand = async () => {
    try {
      isHandRaised
        ? await raiseHandFeature.lowerHand()
        : await raiseHandFeature.raiseHand();
    } catch (e) {
      console.error(e);
    }
  };

  const handleScreenShare = async () => {
    try {
      await screenShareProps.onToggleScreenShare();
      controllBarEle.current?.scrollIntoView({ behavior: "smooth" });
    } catch (ex) {
      console.log("Error occurred", ex);
    }
  };

  const handleDocView = () => {
    //window.document.getElementsByClassName("aside")[0].clientWidth
    var controlBarHeight = document.getElementById("controlBar").offsetHeight;
    let viewerWidth = window.innerWidth - 200;
    let viewerHeight = window.outerHeight - (controlBarHeight + 74);
    let vieweTop = 0;

    let params = `menubar=no, toolbar=no, width=${viewerWidth}, height=${viewerHeight}, left=78, top=${vieweTop}`;

    let newWin = window.open(`${pdf_host}`, "_blank", params);

    newWin.focus();
    //setDocView(doc);
  };

  return (
    <div className="controllbar-container" id="controlBar" ref={controllBarEle}>
      <ControlBar layout={"horizontal"}>
        <CameraButton
          {...cameraProps}
          disabled={buttonsDisabled ?? cameraProps.disabled}
          showLabel={cameraProps.checked ? "Turn off" : "Turn on"}
        />
        <MicrophoneButton
          {...microphoneProps}
          disabled={buttonsDisabled ?? microphoneProps.disabled}
          showLabel={microphoneProps.checked ? "Mute" : "Un mute"}
        />
        {/* <ScreenShareButton
            {...screenShareProps}
            disabled={buttonsDisabled}
            showLabel={screenShareProps.checked ? 'Present' : 'Stop presenting'}
          /> */}

        <DefaultButton
          className="custom-controll-bar-button"
          disabled={buttonsDisabled}
          onClick={handleScreenShare}
          checked={screenShareProps.checked}
        >
          <Text variant="mediumPlus">
            <RxShare2 />
          </Text>
          <Text variant="xSmall" className="ms-Button-label">
            {!screenShareProps.checked ? "Present" : "Stop presenting"}
          </Text>
        </DefaultButton>
        <DefaultButton
          className="custom-controll-bar-button"
          disabled={buttonsDisabled}
          onClick={() => {
            handleDocView();
            setIsOpen((oldIsOpen) => !oldIsOpen);
          }}
          checked={isOpen}
        >
          <Text variant="large">
            <CgFileDocument />
          </Text>
          <Text variant="xSmall" className="ms-Button-label">
            Show Documents
          </Text>
        </DefaultButton>

        <DefaultButton
          className="custom-controll-bar-button"
          disabled={buttonsDisabled}
          onClick={handleRaiseHand}
          checked={false}
        >
          <Text variant="large">
            {!isHandRaised ? (
              <HiOutlineHandRaised />
            ) : (
              <HiHandRaised className="fill-icon" />
            )}
          </Text>

          <Text variant="xSmall" className="ms-Button-label">
            {!isHandRaised ? `Raise hand` : `Lower hand`}
          </Text>
        </DefaultButton>

        <DefaultButton
          className="custom-controll-bar-button"
          disabled={buttonsDisabled}
          onClick={openChatPanel}
          checked={false}
        >
          <Text variant="large">
            <BsChatText />
          </Text>
          <Text variant="xSmall" className="ms-Button-label">
            Chat
          </Text>
        </DefaultButton>

        <DefaultButton
          className="custom-controll-bar-button"
          disabled={buttonsDisabled}
          onClick={openPanel}
          checked={false}
        >
          <Text variant="large">
            <BsFillPeopleFill />
          </Text>
          <Text variant="xSmall" className="ms-Button-label">
            Participants
          </Text>
        </DefaultButton>
        {endCallProps && (
          <EndCallButton onHangUp={() => call.hangUp({ forEveryone: true })} />
        )}
      </ControlBar>
    </div>
  );
}
