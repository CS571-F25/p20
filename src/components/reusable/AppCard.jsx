import { Card } from "react-bootstrap";

export default function AppCard({ children, width = "350px", height = "100%", marginTop = "0px" }) {
    return (
        <Card style={{ width, height, marginTop }} className="p-4 shadow">
            {children}
        </Card>
    );
}
