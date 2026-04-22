import { useAppContext } from "../context/AppContext";
import ShipperDashboard from "./dashboard/ShipperDashboard";
import TransporterDashboard from "./dashboard/TransporterDashboard";
import ReceiverDashboard from "./dashboard/ReceiverDashboard";

export default function Dashboard() {
  const { stakeholderRole, authLoading, authUser } = useAppContext();

  if (authLoading || !authUser) return null;

  if (stakeholderRole === "transporter") return <TransporterDashboard />;
  if (stakeholderRole === "receiver") return <ReceiverDashboard />;
  return <ShipperDashboard />;
}
