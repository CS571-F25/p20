import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from '../contexts/AuthContext';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard after 2 seconds
        const timer = setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
        
        return () => clearTimeout(timer);
      } else {
        // No user found, redirect to login
        navigate("/login");
      }
    }
  }, [user, loading, navigate]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
      }}
    >
      {user ? (
        <>
          <h1>Registration Successful 🎉</h1>
          <p>Welcome {user.email}! Redirecting to dashboard...</p>
        </>
      ) : (
        <>
          <h1>Confirming your email...</h1>
          <p>Please wait...</p>
        </>
      )}
    </div>
  );
}