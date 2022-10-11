import { ReactNode } from "react";
import "./index.css";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: {
    label: string;
    value: string;
    icon: ReactNode;
  }[];
}

const BottomNavigation: React.FC<Props> = ({
  value,
  onChange,
  options = [],
}) => {
  return (
    <div className="navigation">
      {options.map((item) => (
        <button
          key={item.value}
          className={
            item.value === value
              ? "navigationAction navigationAction-active"
              : "navigationAction"
          }
          onClick={() => onChange(item.value)}
          type="button"
        >
          <span className="navigationAction-wrapper">
            {item.icon}
            <span className="MuiBottomNavigationAction-label">
              {item.label}
            </span>
          </span>
          <span className="MuiTouchRipple-root"></span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavigation;
