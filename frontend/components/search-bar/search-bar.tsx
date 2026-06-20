import "./search-bar.css";
import { IoIosSearch } from "react-icons/io";

type SearchBarProps = {
  value?: string;
  onChange?: (value: string) => void;
};

function SearchBar({ value = "", onChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search projects..."
        className="search-input"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
      <IoIosSearch />
    </div>
  );
}

export default SearchBar;
