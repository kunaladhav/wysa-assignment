import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const MyAppointments = () => {
  const { backendUrl, token } = useContext(AppContext);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // Get patient's appointments
  // --------------------------------------------------

  const getUserAppointments = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const { data } = await axios.get(backendUrl + "api/user/appointments", {
        headers: { token },
      });

      if (data.success) {
        setAppointments(
          [...data.appointments].sort(
            (a, b) => new Date(a.startTime) - new Date(b.startTime),
          ),
        );
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

  // --------------------------------------------------
  // Cancel appointment
  // --------------------------------------------------

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "api/user/cancel-appointment",
        { appointmentId },
        {
          headers: { token },
        },
      );

      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --------------------------------------------------
  // Load appointments
  // --------------------------------------------------

  useEffect(() => {
    getUserAppointments();
  }, [token]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <p className="text-2xl font-medium text-gray-800 mb-8">My Appointments</p>

      {loading ? (
        <p className="text-gray-500">Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p className="text-gray-500">You don't have any appointments yet.</p>
      ) : (
        <div className="space-y-5">
          {appointments.map((appointment) => (
            <div
              key={appointment._id}
              className="border rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
            >
              {/* Appointment information */}

              <div>
                <p className="text-lg font-medium text-gray-800">
                  {appointment.therapistData?.name || "Therapist"}
                </p>

                <p className="text-sm text-gray-500 mt-1">Therapist</p>

                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium">Date:</span>{" "}
                    {formatDate(appointment.startTime)}
                  </p>

                  <p>
                    <span className="font-medium">Time:</span>{" "}
                    {formatTime(appointment.startTime)} -{" "}
                    {formatTime(appointment.endTime)}
                  </p>
                </div>

                {/* Recurring information */}

                {appointment.recurringSeriesId && (
                  <p className="text-sm text-blue-500 mt-3">
                    Recurring appointment
                  </p>
                )}
              </div>

              {/* Status / actions */}

              <div className="flex flex-col gap-3 md:min-w-52">
                {appointment.status === "scheduled" && (
                  <>
                    <button
                      onClick={() => cancelAppointment(appointment._id)}
                      className="text-sm text-stone-500 py-2 px-5 border rounded hover:bg-red-600 hover:text-white transition-all duration-300"
                    >
                      Cancel Appointment
                    </button>

                    <div className="text-sm text-center py-2 border border-blue-400 rounded text-blue-500">
                      Scheduled
                    </div>
                  </>
                )}

                {appointment.status === "completed" && (
                  <div className="text-sm text-center py-2 border border-green-500 rounded text-green-500">
                    Completed
                  </div>
                )}

                {appointment.status === "no_show" && (
                  <div className="text-sm text-center py-2 border border-yellow-500 rounded text-yellow-600">
                    No Show
                  </div>
                )}

                {appointment.status === "cancelled" && (
                  <div className="text-sm text-center py-2 border border-red-500 rounded text-red-500">
                    Cancelled
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
