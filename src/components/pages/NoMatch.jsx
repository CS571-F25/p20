import { Link } from "react-router";
import { useAuth } from '../contexts/AuthContext';

function NoMatch() {
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>404</h1>
      <h2 style={styles.subheading}>Page Not Found</h2>
      <p style={styles.message}>Uh oh, looks like you're lost!</p>
      <Link to={user ? "/dashboard" : "/"} style={styles.link}>
        Back to safety
      </Link>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "70vh",
    textAlign: "center",
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },
  heading: {
    fontSize: "6rem",
    margin: "0",
    color: "#e74c3c",
  },
  subheading: {
    fontSize: "2rem",
    margin: "0.5rem 0",
  },
  message: {
    fontSize: "1.2rem",
    margin: "1rem 0",
  },
  link: {
    marginTop: "1rem",
    textDecoration: "none",
    color: "#3498db",
    fontWeight: "bold",
  },
};

export default NoMatch;
