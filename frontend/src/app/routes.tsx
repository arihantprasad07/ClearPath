import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ShipmentDetail = lazy(() => import("./pages/ShipmentDetail"));
const AddShipment = lazy(() => import("./pages/AddShipment"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

function withSuspense(Component: React.LazyExoticComponent<() => React.JSX.Element>) {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">Loading...</div>}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: withSuspense(LandingPage) },
      { path: "login", element: withSuspense(LoginPage) },
      { path: "contact", element: withSuspense(ContactPage) },
      { path: "dashboard", element: withSuspense(Dashboard) },
      { path: "shipment/:id", element: withSuspense(ShipmentDetail) },
      { path: "add-shipment", element: withSuspense(AddShipment) },
    ],
  },
]);
