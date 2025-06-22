import React from "react";

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3c72, #2a5298)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    flexDirection: "row",
  },
  card: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)",
    textAlign: "center",
    width: "100%",
    maxWidth: "300px",
    minHeight: "500px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: "32px",
    marginBottom: "24px",
    color: "#333333",
    textAlign: "center",
    width: "100%",
  },
  button: {
    backgroundColor: "#1e90ff",
    color: "#ffffff",
    border: "none",
    padding: "14px 32px",
    fontSize: "16px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    width: "100%",
    display: "block",
    margin: "0 auto",
  },
};

function MainPage() {
  React.useEffect(() => {
    localStorage.clear();
    console.log('localStorage after clear:', JSON.stringify(localStorage, null, 2));
  }, []);

  const handleLogin = () => {
    // Redirect to your FastAPI backend's /login endpoint
    window.location.href = "http://localhost:8000/login";
  };
  return (
    <div style={styles.container}>
      <div style={{
        ...styles.card,
        marginRight: '32px', // move to left
        background: '#f7faff',
        color: '#1e3c72',
        minHeight: '500px',
        minWidth: '700px',
        width: '420px',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: "0 15px 40px rgba(30,60,114,0.10)",
      }}>
        <h2 style={{ fontSize: '28px', marginBottom: '18px', color: '#1e3c72', textAlign: 'center' }}>Why ShelfShare?</h2>
        <p style={{ fontSize: '17px', color: '#333', textAlign: 'left', lineHeight: 1.7, marginBottom: 18 }}>
          ShelfShare is your personal digital library for the web.<br/><br/>
          <b>✨ Save and summarize:</b> Instantly save articles, blogs, and YouTube videos. Get concise summaries for quick reading.<br/><br/>
          <b>🔍 Organize and search:</b> Tag, search, and revisit your favorite content anytime.<br/><br/>
          <b>🛡️ Private & Secure:</b> Your data is yours. Sign in with Google for a seamless, secure experience.<br/><br/>
          <b>🚀 Get started now!</b> Click login to begin building your knowledge shelf.
        </p>
      </div>
      <div style={styles.card}>
        <h1 style={styles.heading}>ShelfShare</h1>
        <h2 style={styles.heading}>Click Below to Login</h2>
        <button
          style={styles.button}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#1c86ee")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#1e90ff")}
          onClick={handleLogin}
        >
          GMAIL
        </button>
      </div>
    </div>
  );
}

export default MainPage;