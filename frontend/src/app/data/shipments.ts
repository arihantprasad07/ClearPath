export const initialShipments = [
  {
    id: "1",
    name: "Electronics - BLR to BOM",
    source: "Bengaluru",
    destination: "Mumbai",
    eta: "Tomorrow, 14:00",
    riskLevel: "high",
    currentRoute: "Route 4B",
    transporter: "+91 9876543210",
    company: "Tech Corp",
    routes: [
      { id: "r1", name: "Route 4C", eta: "Tomorrow, 17:20", cost: "+₹200", reliability: "98%", isRecommended: true },
      { id: "r2", name: "Route 5A", eta: "Tomorrow, 19:00", cost: "+₹0", reliability: "85%", isRecommended: false },
      { id: "r3", name: "Wait out delay", eta: "Day after, 08:00", cost: "-₹100", reliability: "99%", isRecommended: false }
    ],
    alert: "Severe flooding reported near Surat bypass. Expected delay: 4+ hours."
  },
  {
    id: "2",
    name: "Textiles - DEL to JAI",
    source: "Delhi",
    destination: "Jaipur",
    eta: "Today, 18:00",
    riskLevel: "medium",
    currentRoute: "NH-48",
    transporter: "+91 8765432109",
    company: "Fashion Hub",
    routes: [],
    alert: "Heavy traffic due to fog. 45 min delay expected."
  },
  {
    id: "3",
    name: "Auto Parts - SUR to AMD",
    source: "Surat",
    destination: "Ahmedabad",
    eta: "Today, 12:00",
    riskLevel: "low",
    currentRoute: "Expressway 1",
    transporter: "+91 7654321098",
    company: "AutoMech",
    routes: [],
    alert: null
  }
];