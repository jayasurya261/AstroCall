import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Astrologers from "@/pages/Astrologers";
import UserDashboard from "@/pages/UserDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AstrologerDashboard from "@/pages/AstrologerDashboard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-background font-sans antialiased">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/astrologers" element={<Astrologers />} />
              <Route path="/user-dashboard" element={<UserDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/astrologer-dashboard" element={<AstrologerDashboard />} />
            </Routes>
          </main>
          <Footer />
          <Toaster richColors position="top-center" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
