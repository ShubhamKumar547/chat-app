import React, { useState } from "react";
import SocketComponent from "./Socket";
import GuidePopup from "./Userguide.JSX";

const App = () => {
  return (
    <div>
      <div className="socket-container">
        <SocketComponent />
      </div>
    </div>
  );
};

export default App;
