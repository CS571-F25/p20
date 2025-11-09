import { Card } from "react-bootstrap";

export default function AppCard({ children, width = "350px" }) {
    return (
        <Card style={{ width }} className="p-4 shadow">
            {children}
        </Card>
    );
}
