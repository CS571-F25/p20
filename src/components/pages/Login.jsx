import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuth } from "../contexts/AuthContext"
import { Button, Form, Image } from "react-bootstrap"
import AppCard from "../reusable/AppCard"
import logo from "../../assets/logo.png" 

export default function Login() {

    const emailRef = useRef();
    const passwordRef = useRef();
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // when user press log in button, call this function
    async function handleLogin(e) {
        e.preventDefault();
        const email = emailRef.current.value;
        const password = passwordRef.current.value;

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setError('');
            setLoading(true);
            
            const { data, error } = await signIn(email, password);
            
            if (error) {
                setError(error.message);
            } else {
                // Successfully logged in
                sessionStorage.setItem("email", email);   // <--- add this
                navigate("/dashboard");
            }
        } catch (err) {
            setError('Failed to log in');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
            <AppCard width="450px">
                {/* Logo at the top */}
                <div className="text-center mb-3">
                    <Image src={logo} alt="Logo" height={120} width={120} />
                </div>

                <h3 className="text-center mb-4">Login</h3>
                
                {/* Display error message */}
                {error && <div className="alert alert-danger">{error}</div>}

                <Form onSubmit={handleLogin}>
                    {/* Email and password fields */}
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" ref={emailRef} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" ref={passwordRef} />
                    </Form.Group>

                    {/* log in submit button */}
                    <div className="d-grid mb-2">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Logging in...' : 'Log In'}
                        </Button>
                    </div>

                    {/* sign up link */}
                    <div className="text-center">
                        <span>Don't have an account? </span>
                        <Link to="/signup">Sign Up</Link>
                    </div>
                </Form>
            </AppCard>
        </div>
    )
}