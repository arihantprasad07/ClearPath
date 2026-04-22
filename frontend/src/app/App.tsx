import React from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { AppProvider } from "./context/AppContext";

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        expand={false}
        richColors
        toastOptions={{
          className:
            "border border-white/10 bg-[#111111] text-white shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)]",
          descriptionClassName: "text-white/65",
          actionButtonStyle: {
            background: "#AAFF45",
            color: "#050505",
          },
          cancelButtonStyle: {
            background: "#1F1F1F",
            color: "#FFFFFF",
          },
        }}
      />
    </AppProvider>
  );
}
