import "./App.css";
import { useState } from "react";
import Compress from "./compress";
import BottomNavigation from "../components/BottomNavigation";
import {
  EditOutlined,
  MinusCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import About from "./about";

const APP = () => {
  const [menu, setMenu] = useState<string>("compress");
  return (
    <div className="app">
      <div className="app-content">
        <div
          style={{
            height: "100%",
            display: menu === "compress" ? "block" : "none",
          }}
        >
          <Compress />
        </div>
        <div
          style={{
            height: "100%",
            display: menu === "about" ? "block" : "none",
          }}
        >
          <About />
        </div>
      </div>
      <BottomNavigation
        value={menu}
        onChange={setMenu}
        options={[
          { label: "压缩", value: "compress", icon: <MinusCircleOutlined /> },
          // { label: "修改", value: "modify", icon: <EditOutlined /> },
          { label: "关于", value: "about", icon: <QuestionCircleOutlined /> },
        ]}
      />
      {/* <BottomNavigation
        value={menu}
        onChange={(event, newValue) => {
          setMenu(newValue);
        }}
        showLabels
        className="navigation"
      >
        <BottomNavigationAction
          label="字体压缩"
          value="compress"
          icon={<RestoreIcon />}
        />
        <BottomNavigationAction label="Favorites" icon={<FavoriteIcon />} />
        <BottomNavigationAction label="Nearby" icon={<QuestionAnswer />} />
      </BottomNavigation> */}
    </div>
  );
};

export default APP;
