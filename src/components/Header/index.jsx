import React from "react";
import bgImage from "./assets/bgImage.png";
import NavBar from "./NavBar.jsx";

const Header = () => {
  return (
    <div>
      <div style={{
        backgroundImage: `url(${bgImage})`,
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 0,
        opacity: 0.4
      }}>
      </div>
      <div style={{
        backgroundColor: "rgba(0, 0, 0, 0.04)",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 0,
      }}></div>
      <div style={{
        position: "relative",
        minHeight: "63px"
      }}>
        <NavBar/>
      </div>
    </div>
  )
}

export default Header;