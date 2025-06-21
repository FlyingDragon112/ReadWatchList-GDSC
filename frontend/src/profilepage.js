import React from "react";

// Sidebar and card styles
const containerStyle = {
  display: "flex",
  maxWidth: "1400px",
  margin: "0rem 0 2rem 1rem",
  fontFamily: "sans-serif",
  minHeight: "100vh",
  padding: "2rem 0",
};

const sidebarStyle = {
  flex: "0 0 350px",
  background: "#fff",
  padding: "2.5rem 2rem",
  borderRadius: "20px",
  marginRight: "3rem",
  textAlign: "center",
  minHeight: "500px",
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const profileImgStyle = {
  width: 120,
  height: 120,
  borderRadius: "50%",
  objectFit: "cover",
  marginBottom: "1.5rem",
  border: "4px solid #f6f7fa",
};

const profileNameStyle = {
  fontSize: "2rem",
  fontWeight: 600,
  margin: "0rem 0 0.2rem 0",
};

const profileRoleStyle = {
  color: "#888",
  fontSize: "1.1rem",
  marginBottom: "1.5rem",
};

const profileInfoStyle = {
  textAlign: "left",
  margin: "0 auto",
  maxWidth: 250,
  fontSize: "1rem",
  color: "#222",
};

const mainStyle = {
  flex: 1,
};

const headingStyle = {
  fontSize: "2rem",
  fontWeight: 600,
  marginBottom: "2rem",
};

const cardListStyle = {
  display: "flex",
  flexDirection: "column",
  gap : "10px"
  
};

const cardStyle = {
  width: "100%",           // Makes the card take full width of its container
  minWidth: "700px",       // Minimum width for the card
  maxWidth: "1500px",       // Maximum width for the card
  minHeight: "60px",
  maxHeigh: "100px",      // Minimum height for the card
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
const navLinksStyle = {
  display: "flex",
  gap: "2rem",
};
const navLinkStyle = {
  color: "#222",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "1.1rem",
  letterSpacing: "0.5px",
  transition: "color 0.2s",
};

function ProjectCard({ entry }) {
  return (
    <div style={cardStyle}>
      {/* Placeholder image or entry.image if available */}
      <img
        src={entry.image || "https://via.placeholder.com/100x100?text=No+Image"}
        alt=""
        style={cardImgStyle}
      />
      <div style={cardContentStyle}>
        <div style={cardTitleStyle}>{entry.text || "Untitled Project"}</div>
        <div style={cardDescStyle}><a href={entry.url}> View Original Website Here </a></div>
        <div style={cardDateStyle}>{entry.date}</div>
      </div>
    </div>
  );
}

function Navbar({ email }) {
  return (
    <nav style={navbarStyle}>
      <div style={{ fontWeight: 700, fontSize: "1.3rem", color: "#2a2a2a" }}>MyApp</div>
      <div style={navLinksStyle}>
        <a href="/ForYou" style={navLinkStyle}>Home</a>
        <a href={email ? `/profile?email=${encodeURIComponent(email)}` : "/profile"} style={navLinkStyle}>My Profile</a>
      </div>
    </nav>
  );
}

function ProfilePage({ email }) {
  const [profile, setProfile] = React.useState(null);
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editFields, setEditFields] = React.useState({
    name: "",
    role: "",
    location: "",
  });
  const [showFirstTimeModal, setShowFirstTimeModal] = React.useState(false);

  React.useEffect(() => {
    if (email) {
      // Only store email if it matches the logged-in user
      const loggedInEmail = localStorage.getItem("user_email");
      if (!loggedInEmail || loggedInEmail === email) {
        localStorage.setItem("user_email", email);
      }
      setLoading(true);
      fetch(`http://localhost:8000/profile?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          // If profile exists, use it; else show modal
          if (data.profile) {
            setProfile({
              name: data.profile.name,
              role: data.profile.role,
              email: email,
              location: data.profile.location,
              about: data.profile.about || "Passionate about creating human-centered design experiences.",
              picture: data.profile.picture,
            });
            setShowFirstTimeModal(false);
          } else {
            setEditFields({ name: "", role: "", location: "" });
            setShowFirstTimeModal(true);
          }
          setEntries(data.entries || []);
          setLoading(false);
        });
    }
  }, [email]);

  // Handle edit button click
  const handleEdit = () => {
    setEditFields({
      name: profile.name || "Random123",
      role: profile.role || 'Student',
      location: profile.location || "India",
    });
    setEditing(true);
  };

  // Handle save button click
  const handleSave = () => {
    // Save to backend
    fetch('http://localhost:8000/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: editFields.name,
        role: editFields.role,
        location: editFields.location
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(prev => ({
            ...prev,
            name: editFields.name,
            role: editFields.role,
            location: editFields.location,
          }));
          setEditing(false);
        }
      });
  };

  // Handle input changes
  const handleChange = e => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };

  // Handle first-time modal save
  const handleFirstTimeSave = () => {
    // Save to backend
    fetch('http://localhost:8000/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: editFields.name,
        role: editFields.role,
        location: editFields.location
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(prev => ({
            ...prev,
            name: editFields.name,
            role: editFields.role,
            location: editFields.location,
          }));
          setShowFirstTimeModal(false);
        }
      });
  };

  return (
    <>
      <Navbar email={email} />
      <div style={containerStyle}>
        {/* First-time modal */}
        {showFirstTimeModal && (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "16px",
              minWidth: 320,
              boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <h2>Welcome! Complete Your Profile</h2>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={editFields.name}
                onChange={handleChange}
                style={{ margin: "0.5rem 0", width: "90%", padding: "0.5rem" }}
              />
              <input
                type="text"
                name="role"
                placeholder="Role"
                value={editFields.role}
                onChange={handleChange}
                style={{ margin: "0.5rem 0", width: "90%", padding: "0.5rem" }}
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={editFields.location}
                onChange={handleChange}
                style={{ margin: "0.5rem 0", width: "90%", padding: "0.5rem" }}
              />
              <button
                onClick={handleFirstTimeSave}
                style={{ marginTop: "1rem", padding: "0.5rem 1.5rem" }}
                disabled={!editFields.name || !editFields.role || !editFields.location}
              >
                Save
              </button>
            </div>
          </div>
        )}
        {/* Sidebar */}
        <div style={sidebarStyle}>
          {profile && (
            <>
              <img
                src={profile.picture}
                alt="Profile"
                style={profileImgStyle}
              />
              {editing ? (
                <>
                  <input
                    type="text"
                    name="name"
                    value={editFields.name}
                    onChange={handleChange}
                    style={{ ...profileNameStyle, width: "90%" }}
                  />
                  <input
                    type="text"
                    name="role"
                    value={editFields.role}
                    onChange={handleChange}
                    style={{ ...profileRoleStyle, width: "90%" }}
                  />
                  <input
                    type="text"
                    name="location"
                    value={editFields.location}
                    onChange={handleChange}
                    style={{ ...profileInfoStyle, width: "90%", margin: "0.5rem 0" }}
                  />
                  <button onClick={handleSave} style={{ marginTop: "1rem" }}>
                    Save
                  </button>
                </>
              ) : (
                <>
                  <div style={profileNameStyle}>{profile.name}</div>
                  <div style={profileRoleStyle}>{profile.role}</div>
                  <div style={profileInfoStyle}>
                    <div>
                      <b>Email:</b> {profile.email}
                    </div>
                    <div>
                      <b>Location:</b> {profile.location || "India"}
                    </div>
                  </div>
                  <button onClick={handleEdit} style={{ marginTop: "1.5rem" }}>
                    Edit
                  </button>
                </>
              )}
            </>
          )}
        </div>
        {/* Main Content */}
        <div style={mainStyle}>
          <div style={headingStyle}>My Reading List</div>
          <div style={cardListStyle}>
            {loading && <p>Loading...</p>}
            {!loading && entries.length === 0 && (
              <p>No entries found for this email.</p>
            )}
            {!loading &&
              entries.map((entry, idx) => <ProjectCard key={idx} entry={entry} />)}
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;