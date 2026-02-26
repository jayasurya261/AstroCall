import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Astrologers from "@/pages/Astrologers";
import UserDashboard from "@/pages/UserDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AstrologerDashboard from "@/pages/AstrologerDashboard";
import AstrologerReviews from "@/pages/AstrologerReviews";
import About from "@/pages/About";
import CallRoom from "@/pages/CallRoom";

function HomeRedirect() {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Home />;
  if (userRole === "astrologer") return <Navigate to="/astrologer-dashboard" replace />;
  if (userRole === "superadmin") return <Navigate to="/admin-dashboard" replace />;
  return <Navigate to="/user-dashboard" replace />;
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-background font-sans antialiased">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/astrologers" element={<Astrologers />} />
                <Route path="/user-dashboard" element={<UserDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/astrologer-dashboard" element={<AstrologerDashboard />} />
                <Route path="/astrologer-reviews" element={<AstrologerReviews />} />
                <Route path="/about" element={<About />} />
                <Route path="/call-room" element={<CallRoom />} />
              </Routes>
            </main>
            <Footer />
            <Toaster richColors position="top-center" />
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
