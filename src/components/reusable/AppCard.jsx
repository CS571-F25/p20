import { Card } from "react-bootstrap";

export default function AppCard({ children, width = "350px", marginTop = "0px" }) {
    return (
        <Card style={{ width, marginTop }} className="p-4 shadow">
            {children}
        </Card>
    );
}
