import { useRef, useContext } from "react"
import { Link, useNavigate } from "react-router"
import UserContext from "../contexts/UserContext"
import { Button, Form, Image } from "react-bootstrap"
import AppCard from "../reusable/AppCard"
import logo from "../../assets/logo.png" 

export default function Signup() {

    const usernameRef = useRef();
    const emailRef = useRef();
    const passwordRef = useRef();
    const confirmPasswordRef = useRef();

    const { setUser } = useContext(UserContext)
    const navigate = useNavigate();

    function handleSignup(e){
        e.preventDefault();

        const username = usernameRef.current.value.trim();
        const email = emailRef.current.value.trim();
        const password = passwordRef.current.value;
        const confirmPassword = confirmPasswordRef.current.value;

        // todo: validation
        if(!username || !email || !password || !confirmPassword){
            alert("All fields are required.");
            return;
        }

        if(password !== confirmPassword){
            alert("Passwords do not match.");
            return;
        }

        // simulate signup success
        const newUser = { username, email };
        setUser(newUser);
        sessionStorage.setItem("user", JSON.stringify(newUser));

        alert("Signup successful!");
        navigate("/dashboard"); // navigate after signup
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


                <Form onSubmit={handleSignup}>

                    {/* sign up username, email, password, confirm password fields */}
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control type="text" ref={usernameRef} />
                    </Form.Group>

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
                        <Button type="submit">Sign Up</Button>
                    </div>

                    {/* log in link -- link to the /login page when pressed */}
                    <div className="text-center">
                        <span>Already have an account? </span>
                        <Link to="/login">Log In</Link>
                    </div>
                </Form>
            </AppCard>
        </div>
    )
}
