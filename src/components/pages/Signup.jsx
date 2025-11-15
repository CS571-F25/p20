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
                    <Image src={logo} alt="Logo" height={120} width={120} />
                </div>

                <h3 className="text-center mb-4">Sign Up</h3>

                {/* Display error message */}
                {error && <div className="alert alert-danger">{error}</div>}

                <Form onSubmit={handleSignup}>

                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" ref={emailRef} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" ref={passwordRef} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control type="password" ref={confirmPasswordRef} />
                    </Form.Group>

                    {/* sign up submit button */}
                    <div className="d-grid mb-2">
                        <Button type="submit" disabled={loading}>
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