import React from "react";
import MainPage from "./LoginPage";
import ProfilePage from "./profilepage";

function App() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");

  return email ? <ProfilePage email={email} /> : <MainPage />;
}

export default App;