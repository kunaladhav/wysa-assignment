import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

import Login from "./pages/Login";
import MyAppointments from "./pages/MyAppointments";
import Appointment from "./pages/Appointment";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import TherapistDashboard from "./pages/TherapistDashboard";
import TherapistSchedule from "./pages/TherapistSchedule";
import { ToastContainer } from "react-toastify";

const App = () => {
  return (
    <div className="mx-4 sm:mx-[10%]">
      <ToastContainer />
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/appointment/:therapistId" element={<Appointment />} />
        <Route path="/therapist-dashboard" element={<TherapistDashboard />} />
        <Route path="/therapist-schedule" element={<TherapistSchedule />} />
      </Routes>

      <Footer />
    </div>
  );
};

export default App;
