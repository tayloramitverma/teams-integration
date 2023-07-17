/**---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *---------------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from "react";
import axios from "axios";
import { ActionButton, Panel } from "@fluentui/react";
import { pdf_host } from "../authConfig";

const complianceAudit = { iconName: "PDF", className: "pdf-icon" };
const clearIcon = { iconName: "Hide3", className: "close-doc" };

export default function DocumentList({ isOpen }) {
  const [documents, setDocuments] = useState([]);
  const [docView, setDocView] = useState("");

  useEffect(() => {
    const url =
      "https://www.phiapps.mobi/DeGrToolBeiGeneTrainee/UIL/DeGrToolWebService.asmx/GetPresentationDetailsForCall";
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
    };
    const requestBody = {
      UniqueId: "b4587cc1-55dc-80b7-c282-6f03b3d4079c",
      RepID: "hstuser",
      Extra: "",
    };

    axios
      .post(url, requestBody, { headers })
      .then((response) => {
        const data = JSON.parse(response.data.d);
        if (data.dt_ReturnedTables.length > 0) {
          setDocuments(data.dt_ReturnedTables[0]);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const handleDocView = (doc) => {
    let newWin = window.open(
      `${pdf_host}?pdfid=${doc.DocId}`,
      "_blank",
      "width=800px, height=600px"
    );

    newWin.focus();
    //setDocView(doc);
  };

  const renderDocuments = () => {
    return documents.map((doc, index) => {
      return (
        <div className="d-flex justify-content-between" key={index}>
          <ActionButton
            onClick={() => handleDocView(doc)}
            iconProps={complianceAudit}
            allowDisabledFocus
          >
            {doc.PresentationName}
          </ActionButton>
          {docView !== "" && docView.DocId === doc.DocId && (
            <ActionButton
              index={index}
              onClick={() => handleDocView("")}
              iconProps={clearIcon}
              allowDisabledFocus
            ></ActionButton>
          )}
        </div>
      );
    });
  };

  const renderDocView = () => {
    if (docView !== "") {
      return (
        <div className={`${isOpen ? "w-75" : "w-100"} pdf-container`}>
          {/* <iframe src={docView.PdfPath} title={docView.Presentation} height="550px" width="100%" /> */}
          <embed
            src={docView.PdfPath + "#toolbar=0"}
            type="application/pdf"
            height={550}
            width="100%"
          />
        </div>
      );
    }
    return;
  };

  return (
    <div>
      <Panel
        headerText="Documents List"
        isOpen={isOpen}
        // You MUST provide this prop! Otherwise screen readers will just say "button" with no label.
        allowTouchBodyScroll={true}
        overlayProps={{ allowTouchBodyScroll: true, className: "pdf-overlay" }}
        hasCloseButton={false}
      >
        {renderDocuments()}
      </Panel>

      {renderDocView()}
    </div>
  );
}
