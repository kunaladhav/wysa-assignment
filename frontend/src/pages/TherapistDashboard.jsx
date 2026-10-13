import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const TherapistDashboard = () => {
  const { backendUrl, token, userData } = useContext(AppContext);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // --------------------------------------------------
  // Get therapist appointments
  // --------------------------------------------------

  const getAppointments = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const { data } = await axios.get(
        `${backendUrl}api/therapist/appointments`,
        {
          headers: { token },
        },
      );

      if (data.success) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);

      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAppointments();
  }, [token]);

  // --------------------------------------------------
  // Update appointment status
  // --------------------------------------------------

  const updateStatus = async (appointmentId, status) => {
    console.log("Token being send: ", token);

    try {
      setUpdatingId(appointmentId);

      const { data } = await axios.put(
        `${backendUrl}api/therapist/appointment-status`,
        {
          appointmentId,
          status,
        },
        {
          headers: { token },
        },
      );

      if (data.success) {
        toast.success(data.message);

        // Update only the appointment that changed
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment._id === appointmentId
              ? {
                  ...appointment,
                  status,
                }
              : appointment,
          ),
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);

      toast.error(error.response?.data?.message || error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // --------------------------------------------------
  // Format date
  // --------------------------------------------------

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // Format time
  // --------------------------------------------------

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-gray-500">Loading appointments...</p>
      </div>
    );
  }

  // --------------------------------------------------
  // Dashboard
  // --------------------------------------------------

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Therapist Dashboard</h1>

        <p className="text-gray-500 mt-1">
          Welcome, {userData?.name || "Therapist"}
        </p>
      </div>

      {/* Appointment section */}

      <div>
        <h2 className="text-xl font-medium mb-5">My Appointments</h2>

        {appointments.length === 0 ? (
          <div className="border rounded-xl p-8 text-center">
            <p className="text-gray-500">You have no appointments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="border rounded-xl p-5 bg-white"
              >
                {/* Top row */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {appointment.patientId?.name || "Unknown Patient"}
                    </h3>

                    <p className="text-gray-500 text-sm">
                      {appointment.patientId?.email || "No email available"}
                    </p>
                  </div>

                  {/* Status */}

                  <span
                    className={`px-3 py-1 rounded-full text-sm w-fit ${
                      appointment.status === "scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : appointment.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : appointment.status === "no_show"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>

                {/* Appointment information */}

                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>

                    <p className="font-medium">
                      {formatDate(appointment.startTime)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Time</p>

                    <p className="font-medium">
                      {formatTime(appointment.startTime)}
                      {" - "}
                      {formatTime(appointment.endTime)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Appointment Type</p>

                    <p className="font-medium">
                      {appointment.recurringSeriesId
                        ? "Recurring Appointment"
                        : "One-time Appointment"}
                    </p>
                  </div>
                </div>

                {/* Status actions */}

                {appointment.status === "scheduled" && (
                  <div className="mt-5 pt-5 border-t flex flex-wrap gap-3">
                    <button
                      onClick={() => updateStatus(appointment._id, "completed")}
                      disabled={updatingId === appointment._id}
                      className="bg-green-600 text-white px-5 py-2 rounded-full disabled:opacity-50"
                    >
                      Completed
                    </button>

                    <button
                      onClick={() => updateStatus(appointment._id, "no_show")}
                      disabled={updatingId === appointment._id}
                      className="bg-yellow-500 text-white px-5 py-2 rounded-full disabled:opacity-50"
                    >
                      No Show
                    </button>

                    <button
                      onClick={() => updateStatus(appointment._id, "cancelled")}
                      disabled={updatingId === appointment._id}
                      className="bg-red-600 text-white px-5 py-2 rounded-full disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistDashboard;
