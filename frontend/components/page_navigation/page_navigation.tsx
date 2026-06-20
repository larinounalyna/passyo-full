"use client";
import "./page_navigation.css";

type PageNavigationProps = {
  pageName: string;
  pageref?: number;
};

type PageNavigationListProps = {
  pageList: PageNavigationProps[];
  activePage?: number;
   onPageClick: (index: number) => void;
};

function PageNavigationList({
  pageList,
  activePage,
  onPageClick,
}: PageNavigationListProps) {
  return (
    <div className="page-navigation-list">
      {pageList.map((page, index) => (
        <li className="page-navigation-item" key={page.pageName}>
          <button
            className={`page-navigation-link ${index === activePage ? "active" : ""}`}
            onClick={() => onPageClick(index)}
          >
            {page.pageName}
          </button>
        </li>
      ))}
    </div>
  );
}

export default PageNavigationList;
