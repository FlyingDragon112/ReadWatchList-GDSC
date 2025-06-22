import React from "react";

const navbarStyle = {
  width: "96%",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  padding: "1rem 2rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  position: "sticky",
  top: 0,
  zIndex: 2000,
};
const navLinkStyle = {
  color: "#222",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "1.1rem",
  letterSpacing: "0.5px",
  transition: "color 0.2s",
};

function Navbar({ email, searchTerm, setSearchTerm }) {
  return (
    <nav style={navbarStyle}>
      <div style={{ fontWeight: 700, fontSize: "1.3rem", color: "#2a2a2a" }}>MyApp</div>
      <div><input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: "700px",
            padding: "0.5rem 1rem",
            borderRadius: "20px",
            border: "1px solid #ccc",
            fontSize: "1rem"
          }}
        /></div>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <a href="/ForYou" style={navLinkStyle}>Home</a>
        <a href={email ? `/profile?email=${encodeURIComponent(email)}` : "/profile"} style={navLinkStyle}>My Profile</a>
        {/* Search Bar in Navbar */}

      </div>
    </nav>
  );
}

// ...existing code...

const containerStyle = {
  maxWidth: "1400px",
  margin: "2rem auto",
  fontFamily: "sans-serif",
  minHeight: "100vh",
  padding: "2rem 0",
};

// Card styles (copied from profilepage.js for consistency)
const cardListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};
const cardStyle = {
  width: "100%",
  minWidth: "700px",
  maxWidth: "1500px",
  minHeight: "60px",
  maxHeigh: "100px",
  background: "#fff",
  borderRadius: "20px",
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
  padding: "2rem",
  display: "flex",
  alignItems: "flex-start",
  gap: "1.5rem",
  marginBottom: "rem",
  wordBreak: "break-word",
};
const cardImgStyle = {
  width: 100,
  height: 100,
  borderRadius: "12px",
  objectFit: "cover",
  background: "#f0f0f0",
};
const cardContentStyle = {
  flex: 1,
  wordBreak: "break-word",
  overflowWrap: "break-word",
  whiteSpace: "pre-line",
};
const cardTitleStyle = {
  fontSize: "1rem",
  fontWeight: "normal   ",
  marginBottom: "0.5rem",
};
const cardDescStyle = {
  color: "#444",
  fontSize: "16px",
  marginBottom: "0.5rem",
};
const cardDateStyle = {
  color: "#888",
  fontSize: "0.95rem",
};

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function ProjectCard({ entry }) {
  return (
    <div style={cardStyle}>
      <img
        src={entry.image || "https://via.placeholder.com/100x100?text=No+Image"}
        alt=""
        style={cardImgStyle}
      />
      <div style={cardContentStyle}>
        {/* Name of the person who posted it */}
        <div style={{ display: "flex", alignItems: "center", gap: "60rem", fontWeight: 600, fontSize: "1.1rem", marginBottom: "0.3rem" }}>
          <a href={`/profile?email=${encodeURIComponent(entry.email)}`}>{`Read by: ${entry.name}`}</a>
          <div style={cardDateStyle}>{formatDate(entry.date)}</div>
        </div>
        <div style={cardTitleStyle}>{entry.text || "Untitled Project"}</div>
        <div style={cardDescStyle}><a href={entry.url}> View Original Website Here </a></div>
      </div>
    </div>
  );
}

function Homepage({ email: propEmail }) {
  // Try to get email from prop, then from localStorage
  const [email, setEmail] = React.useState(propEmail || "");
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    // If no email prop, try to get from localStorage
    if (!propEmail) {
      const storedEmail = localStorage.getItem("user_email");
      if (storedEmail) setEmail(storedEmail);
    }
  }, [propEmail]);

  React.useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8000/ForYou")
      .then(res => res.json())
      .then(data => {
        setEntries(data.entries || []);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Navbar email={email} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <div style={containerStyle}>
        <div style={cardListStyle}>
          {loading && <p>Loading...</p>}
          {!loading && entries.length === 0 && (
            <p>No entries found.</p>
          )}
          {!loading &&
            entries
              .filter(entry =>
                entry.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.name?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((entry, idx) => <ProjectCard key={idx} entry={entry} />)}
        </div>
      </div>
    </>
  );
}

export default Homepage;