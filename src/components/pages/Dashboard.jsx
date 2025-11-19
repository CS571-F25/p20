import "../../App.css";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    Cell,
} from "recharts";

export default function Dashboard() {
    // Placeholder data
    const monthlyData = [
        { month: "Jan", spending: 400 },
        { month: "Feb", spending: 350 },
        { month: "Mar", spending: 500 },
        { month: "Apr", spending: 300 },
        { month: "May", spending: 600 },
    ];

    const weeklyData = [
        { day: "Mon", amount: 50 },
        { day: "Tue", amount: 75 },
        { day: "Wed", amount: 40 },
        { day: "Thu", amount: 90 },
        { day: "Fri", amount: 60 },
    ];

    const categoryData = [
        { name: "Food", value: 300 },
        { name: "Transport", value: 150 },
        { name: "Shopping", value: 200 },
        { name: "Bills", value: 250 },
    ];

    const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-box">
                <h1>Dashboard</h1>
                <p>Your spending overview</p>

                {/* TOTAL SPENDING CARD */}
                <div className="single-card">
                    <h2>Total Spending</h2>
                    <h1 style={{ color: "#2a4d69" }}>$1,250</h1>
                </div>

                {/* MONTHLY SPENDING */}
                <div className="single-card">
                    <h3>Monthly Spending</h3>
                    <LineChart width={600} height={300} data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="spending" stroke="#8884d8" strokeWidth={3} />
                    </LineChart>
                </div>

                {/* WEEKLY SPENDING */}
                <div className="single-card">
                    <h3>Weekly Spending</h3>
                    <BarChart width={600} height={300} data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="amount" fill="#82ca9d" />
                    </BarChart>
                </div>

                {/* CATEGORIES PIE */}
                <div className="single-card">
                    <h3>Spending Categories</h3>
                    <PieChart width={400} height={300}>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </div>

            </div>
        </div>
    );

}
