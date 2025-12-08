import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from '../../supabaseClient';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Extract tokens from the hash
      const hashString = window.location.hash;
      
      // Check if there's an access_token in the hash
      if (hashString.includes('access_token=')) {
        // Extract everything after the second #
        const tokenPart = hashString.split('#').find(part => part.includes('access_token='));
        
        if (tokenPart) {
          // Parse the token parameters
          const params = new URLSearchParams(tokenPart);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Set the session using the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) {
              console.error("Auth error:", error);
              setStatus("error");
              setTimeout(() => navigate("/login"), 3000);
              return;
            }
            
            if (data.session) {
              console.log("User authenticated:", data.session.user);
              setStatus("success");
              
              // Clean up the URL and redirect
              window.location.hash = '/dashboard'; // This will navigate and clean URL
              return;
            }
          }
        }
      }
      
      // If we get here, something went wrong
      setStatus("error");
      setTimeout(() => navigate("/login"), 3000);
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