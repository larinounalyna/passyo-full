import Image from "next/image";
import "./ready_template_cards.css";

type ReadyTemplateCardsProps = {
  projectName: string;
  projectDescription: string;
  projecticon: string;
};

function ReadyTemplateCards({
  projectName,
  projectDescription,
  projecticon,
}: ReadyTemplateCardsProps) {
  const safeIconSrc = projecticon
    ? projecticon.startsWith("/") ||
      projecticon.startsWith("http://") ||
      projecticon.startsWith("https://")
      ? projecticon
      : `/${projecticon.replace(/^\.\//, "")}`
    : "/file.svg";

  return (
    <div className="ready-templates">
      <div className="template-card-icon">
        <Image
          src={safeIconSrc}
          alt={`${projectName} icon`}
          className="template-icon"
          width={40}
          height={40}
        />
      </div>
      <div className="template-card-content">
        <h3 className="template-card-title">{projectName}</h3>
        <p className="template-card-description">{projectDescription}</p>
      </div>
    </div>
  );
}

export default ReadyTemplateCards;
