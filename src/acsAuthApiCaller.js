/**---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *---------------------------------------------------------------------------------------------*/

import axios from "axios";
import { SERVER_ADDRESS } from "./authConfig";

export async function GetAcsToken(accessToken) {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  const options = {
    method: "GET",
    headers: headers,
  };

  return fetch(`${SERVER_ADDRESS}/api/token`, options)
    .then((response) => response.json())
    .catch((error) => console.log(error));
}

export async function GetAcsTokenForTeamsUser(accessToken, teamsToken) {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);
  headers.append("teams-user-aad-token", teamsToken);

  const options = {
    method: "GET",
    headers: headers,
  };

  return fetch(`${SERVER_ADDRESS}/api/token/teams`, options)
    .then((response) => response.json())
    .catch((error) => console.log(error));
}

export async function CreateOrGetACSUser(accessToken) {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  const options = {
    method: "POST",
    headers: headers,
  };

  return fetch(`${SERVER_ADDRESS}/api/user`, options)
    .then((response) => response.json())
    .catch((error) => console.log(error));
}

export function createChatSubcription({ accessToken, chatId }) {
  const bearer = `Bearer ${accessToken}`;

  return new Promise((resolve, rejact) => {
    axios({
      url: `${SERVER_ADDRESS}/api/chat/subscription`,
      method: "post",
      data: { chatId: chatId },
      headers: { Authorization: bearer },
    })
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        rejact(error);
      });
  });
}

export function getAccessToken(username) {
  return new Promise((resolve, rejact) => {
    axios({
      url: `${SERVER_ADDRESS}/api/token/genrateAcsToken`,
      method: "post",
      data: { RepId: {"Json":`{\"RepId\":\"${username}\"}`} },
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        rejact(error);
      });
  });
}
