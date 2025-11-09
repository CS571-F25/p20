import { useRef, useContext } from "react"
import { Link, useNavigate } from "react-router"
import UserContext from "../contexts/UserContext"
import { Button, Form, Image } from "react-bootstrap"
import AppCard from "../reusable/AppCard"
import logo from "../../assets/logo.png" 

export default function Login() {

    const usernameRef = useRef();
    const passwordRef = useRef();
    const { user, setUser } = useContext(UserContext)
    const navigate = useNavigate();


    // when user press log in button, call this function
    function handleLogin(e){
        e.preventDefault();
        const username = usernameRef.current.value;
        const password = passwordRef.current.value;

        if(username === "admin" && password === "123") {
            const user = { username };
            setUser(user);
            sessionStorage.setItem("user", JSON.stringify(user));
            navigate("/dashboard")
        } else {
            alert("invalid login");
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

                <Form onSubmit={handleLogin}>
                    {/* log in username and password fields */}
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control type="text" ref={usernameRef} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" ref={passwordRef} />
                    </Form.Group>

                    {/* log in submit button */}
                    <div className="d-grid mb-2">
                        <Button type="submit">Log In</Button>
                    </div>

                    {/* sign up link -- link to the /signup page when pressed */}
                    <div className="text-center">
                        <span>Don't have an account? </span>
                        <Link to="/signup">Sign Up</Link>
                    </div>
                </Form>
            </AppCard>
        </div>
    )
}
