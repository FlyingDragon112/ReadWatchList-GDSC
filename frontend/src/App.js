import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./LoginPage";
import ProfilePage from "./profilepage";
import Homepage from "./homepage";

function App() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");

  return (
    <Router>
      <Routes>
        <Route path="/ForYou" element={<Homepage />} />
        <Route path="/profile" element={<ProfilePage email={email} />} />
        <Route path="*" element={<MainPage />} />
      </Routes>
    </Router>
  );
}

export default App;