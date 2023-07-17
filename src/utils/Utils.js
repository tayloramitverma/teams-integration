/**---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *---------------------------------------------------------------------------------------------*/

import {
  isCommunicationUserIdentifier,
  isPhoneNumberIdentifier,
  isMicrosoftTeamsUserIdentifier,
  isUnknownIdentifier,
} from "@azure/communication-common";

export const getIdentifierText = (identifier) => {
  if (isCommunicationUserIdentifier(identifier)) {
    return identifier.communicationUserId;
  } else if (isPhoneNumberIdentifier(identifier)) {
    return identifier.phoneNumber;
  } else if (isMicrosoftTeamsUserIdentifier(identifier)) {
    return identifier.microsoftTeamsUserId;
  } else if (isUnknownIdentifier(identifier) && identifier.id === "8:echo123") {
    return "Echo Bot";
  } else {
    return "Unknown Identifier";
  }
};

export const isParticipantHandRaised = (participantId, raisedHandState) => {
  if (!participantId || !raisedHandState) {
    return false;
  }
  let rtn = raisedHandState.find(
    (element) => element.identifier.rawId === participantId
  );
  return !!rtn;
};

export const isParticipantSpotlighted = (participantId, spotlightState) => {
  if (!participantId || !spotlightState) {
    return false;
  }
  let rtn = spotlightState.find(
    (element) => element.identifier.rawId === participantId
  );
  return !!rtn;
};

export const callScreenLoadingState = [
  "InLobby",
  "Connecting",
  "Disconnecting",
];

export const callScreenLoaderLable = (state) => {
  switch (state) {
    case "InLobby":
      return "Waiting to be admitted...";
    case "Connecting":
      return "Connecting...";
    case "Disconnecting":
      return "Disconnecting...";
    default:
      return "Loading...";
  }
};
