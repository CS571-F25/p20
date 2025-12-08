import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from '../../supabaseClient'; // adjust path

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing"); // processing, success, error

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Supabase client automatically handles the hash fragment tokens
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth error:", error);
        setStatus("error");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      if (data.session) {
        console.log("User authenticated:", data.session.user);
        setStatus("success");
        
        // Redirect to your main app (or login to let them sign in)
        setTimeout(() => {
          navigate("/dashboard"); // or "/dashboard" or wherever you want
        }, 3000);
      } else {
        setStatus("error");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

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
      {status === "processing" && (
        <>
          <h1>Confirming your email...</h1>
          <p>Please wait...</p>
        </>
      )}
      {status === "success" && (
        <>
          <h1>Registration Successful 🎉</h1>
          <p>You will be redirected shortly...</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1>Something went wrong</h1>
          <p>Redirecting to login...</p>
        </>
      )}
    </div>
  );
}