import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Staff from "./pages/Staff";
import Inventory from "./pages/Inventory";
import OTDisposables from "./pages/OTDisposables";
import IVFInjections from "./pages/IVFInjections";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/ot-disposables" element={<OTDisposables />} />
            <Route path="/ivf-injections" element={<IVFInjections />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
