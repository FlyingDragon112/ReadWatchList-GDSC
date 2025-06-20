import React from "react";

function MainPage() {
  const handleLogin = () => {
    // Redirect to your FastAPI backend's /login endpoint
    window.location.href = "http://localhost:8000/login";
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Welcome!</h1>
      <button onClick={handleLogin} style={{ fontSize: "1.2rem", padding: "0.5rem 1.5rem" }}>
        Login with Google
      </button>
    </div>
  );
}

export default MainPage;