import "./page_section.css";

type pagesectionprops = {
  sectionName: string;
};

function PageSection({ sectionName }: pagesectionprops) {
  return (
    <div className="section">
      <p>{sectionName}</p>
      <div className="section-line"></div>
    </div>
  );
}

export default PageSection;
