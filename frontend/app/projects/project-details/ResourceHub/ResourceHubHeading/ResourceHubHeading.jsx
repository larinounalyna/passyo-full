import React from "react";
import ResourceMangementHeader from "../ResourceHubHeader/ResourceHubHeader.jsx";
import Button_ from "@/components/General/Button/button";
import "./ResourceHubHeading.css";

export default function ResourceHeading() {
  return (
    <div className="resource-hub-heading">
      <ResourceMangementHeader></ResourceMangementHeader>
      <Button_ label="+ New Task" onClick={() => {}} />
    </div>
  );
}
