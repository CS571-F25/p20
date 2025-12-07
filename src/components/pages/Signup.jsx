import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuth } from "../contexts/AuthContext"
import { Button, Form, Image } from "react-bootstrap"
import AppCard from "../reusable/AppCard"
import logo from "../../assets/logo.png" 

export default function Signup() {

    const emailRef = useRef();
    const passwordRef = useRef();
    const confirmPasswordRef = useRef();

    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSignup(e) {
        e.preventDefault();

        const email = emailRef.current.value.trim();
        const password = passwordRef.current.value;
        const confirmPassword = confirmPasswordRef.current.value;

        // Validation
        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            setError('');
            setLoading(true);

            const { data, error } = await signUp(email, password);

            if (error) {
                setError(error.message);
            } else {
                // Signup successful
                alert("Signup successful! Please check your email to confirm your account.");
                navigate("/login");
            }
        } catch (err) {
            setError('Failed to create account');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="d-flex justify-content-center align-items-center"  
            style={{ minHeight: "80vh", paddingTop: "3rem" }}>
            <AppCard width="450px">
                {/* Logo at the top */}
                <div className="text-center mb-3">
                    <Image 
                        src={logo} 
                        alt="Budget tracking application logo" 
                        height={120} 
                        width={120} 
                    />
                </div>

                <h1 className="text-center mb-4" style={{ fontSize: '1.75rem' }}>Sign Up</h1>

                {/* Display error message */}
                {error && (
                    <div 
                        className="alert alert-danger" 
                        role="alert"
                        aria-live="assertive"
                    >
                        {error}
                    </div>
                )}

                <Form onSubmit={handleSignup} noValidate>

                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="signup-email">Email</Form.Label>
                        <Form.Control 
                            id="signup-email"
                            type="email" 
                            ref={emailRef}
                            autoComplete="email"
                            required
                            aria-required="true"
                            aria-describedby={error ? "signup-error" : undefined}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="signup-password">Password</Form.Label>
                        <Form.Control 
                            id="signup-password"
                            type="password" 
                            ref={passwordRef}
                            autoComplete="new-password"
                            required
                            aria-required="true"
                            aria-describedby="password-requirements"
                        />
                        <Form.Text id="password-requirements" className="text-muted">
                            Password must be at least 6 characters
                        </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="signup-confirm-password">Confirm Password</Form.Label>
                        <Form.Control 
                            id="signup-confirm-password"
                            type="password" 
                            ref={confirmPasswordRef}
                            autoComplete="new-password"
                            required
                            aria-required="true"
                            aria-describedby={error ? "signup-error" : undefined}
                        />
                    </Form.Group>

                    {/* Hidden error ID for aria-describedby */}
                    {error && <div id="signup-error" className="visually-hidden">{error}</div>}

                    {/* sign up submit button */}
                    <div className="d-grid mb-2">
                        <Button 
                            type="submit" 
                            disabled={loading}
                            aria-busy={loading}
                        >
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </Button>
                    </div>

                    {/* log in link */}
                    <div className="text-center">
                        <span>Already have an account? </span>
                        <Link to="/login">Log In</Link>
                    </div>
                </Form>
            </AppCard>
        </div>
    )
}