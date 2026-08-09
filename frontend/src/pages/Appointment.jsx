import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const Appointment = () => {
  const { therapistId } = useParams();
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);

  // Hold state
  const [hold, setHold] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [holding, setHolding] = useState(false);

  // Booking state
  const [showBookingOptions, setShowBookingOptions] = useState(false);
  const [bookingType, setBookingType] = useState(null);

  // Recurring state
  const [frequency, setFrequency] = useState("WEEKLY");
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [booking, setBooking] = useState(false);

  // --------------------------------------------------
  // Get therapist availability for selected date
  // --------------------------------------------------

  const getAvailability = async (date) => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${backendUrl}api/therapist/${therapistId}/availability`,
        {
          params: { date },
        },
      );

      if (data.success) {
        setSlots(data.slots);
      } else {
        toast.error(data.message);
        setSlots([]);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Restore active hold after page refresh
  // --------------------------------------------------

  const getActiveHold = async () => {
    if (!token) return;

    try {
      const { data } = await axios.get(`${backendUrl}api/user/active-hold`, {
        headers: { token },
      });

      if (data.success && data.hold) {
        setHold(data.hold);
        setRemainingSeconds(data.remainingSeconds);

        const start = new Date(data.hold.startTime);
        const end = new Date(data.hold.endTime);

        // Restore selected date
        const year = start.getFullYear();
        const month = String(start.getMonth() + 1).padStart(2, "0");
        const day = String(start.getDate()).padStart(2, "0");

        const restoredDate = `${year}-${month}-${day}`;

        setSelectedDate(restoredDate);

        // Load availability
        await getAvailability(restoredDate);

        // Restore selected slot
        setSelectedSlot({
          startTime: start.toTimeString().slice(0, 5),
          endTime: end.toTimeString().slice(0, 5),
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getActiveHold();
  }, [token]);

  // --------------------------------------------------
  // Hold countdown
  // --------------------------------------------------

  useEffect(() => {
    if (!hold) return;

    if (remainingSeconds <= 0) {
      setHold(null);
      setSelectedSlot(null);
      setShowBookingOptions(false);
      setBookingType(null);

      toast.info("Your slot hold has expired.");
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hold, remainingSeconds]);

  // --------------------------------------------------
  // Date selection
  // --------------------------------------------------

  const handleDateChange = (e) => {
    const date = e.target.value;

    setSelectedDate(date);
    setSelectedSlot(null);
    setShowBookingOptions(false);
    setBookingType(null);

    if (date) {
      getAvailability(date);
    } else {
      setSlots([]);
    }
  };

  // --------------------------------------------------
  // Convert date + window time into Date
  // --------------------------------------------------

  const createDateTime = (date, time) => {
    return new Date(`${date}T${time}:00`);
  };

  // --------------------------------------------------
  // Hold selected therapist window
  // --------------------------------------------------

  const handleHoldSlot = async () => {
    if (!selectedSlot) {
      toast.error("Please select a slot");
      return;
    }

    if (!token) {
      toast.error("Please login to book an appointment");
      return;
    }

    try {
      setHolding(true);

      const startTime = createDateTime(selectedDate, selectedSlot.startTime);

      const endTime = createDateTime(selectedDate, selectedSlot.endTime);

      const { data } = await axios.post(
        `${backendUrl}api/user/hold-slot`,
        {
          therapistId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
        {
          headers: { token },
        },
      );

      if (data.success) {
        setHold(data.hold);

        setRemainingSeconds(
          Math.max(
            0,
            Math.floor(
              (new Date(data.hold.expiresAt).getTime() - Date.now()) / 1000,
            ),
          ),
        );

        toast.success("Slot held for 1 minute");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setHolding(false);
    }
  };

  // --------------------------------------------------
  // Confirm one-time appointment
  // --------------------------------------------------

  const handleOneTimeBooking = async () => {
    if (!hold) {
      toast.error("Your slot hold has expired");
      return;
    }

    try {
      setBooking(true);

      const idempotencyKey = `one-time-${hold._id}-${Date.now()}`;

      const { data } = await axios.post(
        `${backendUrl}api/user/confirm-slot`,
        {
          holdId: hold._id,
          idempotencyKey,
        },
        {
          headers: { token },
        },
      );

      if (data.success) {
        toast.success("Appointment booked successfully");

        setHold(null);
        setSelectedSlot(null);
        setShowBookingOptions(false);
        setBookingType(null);

        navigate("/my-appointments");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBooking(false);
    }
  };

  // --------------------------------------------------
  // Create recurring appointment series
  // --------------------------------------------------

  const handleRecurringBooking = async () => {
    if (!hold) {
      toast.error("Your slot hold has expired");
      return;
    }

    if (!recurringEndDate) {
      toast.error("Please select an end date");
      return;
    }

    if (recurringEndDate < selectedDate) {
      toast.error("End date cannot be before the appointment date");
      return;
    }

    try {
      setBooking(true);

      const { data: seriesData } = await axios.post(
        `${backendUrl}api/user/recurring-series`,
        {
          therapistId,
          startDate: selectedDate,
          endDate: recurringEndDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          frequency,
        },
        {
          headers: { token },
        },
      );

      if (!seriesData.success) {
        toast.error(seriesData.message);
        return;
      }

      // Generate actual appointment instances
      const { data: generationData } = await axios.post(
        `${backendUrl}api/user/generate-recurring-appointments`,
        {
          seriesId: seriesData.recurringSeries._id,
        },
        {
          headers: { token },
        },
      );

      if (!generationData.success) {
        toast.error(generationData.message);
        return;
      }

      // The original hold is no longer needed.
      // The generated recurring appointment occupies the slot.
      toast.success("Recurring appointments booked successfully");

      if (generationData.conflicts?.length > 0) {
        toast.info(
          `${generationData.conflicts.length} occurrence(s) could not be booked because of conflicts.`,
        );
      }

      setHold(null);
      setSelectedSlot(null);
      setShowBookingOptions(false);
      setBookingType(null);
      setRecurringEndDate("");

      navigate("/my-appointments");
    } catch (error) {
      console.log(error);

      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBooking(false);
    }
  };

  // --------------------------------------------------
  // Format countdown
  // --------------------------------------------------

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0",
    )}`;
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-8">Book Appointment</h1>

      {/* Date selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">Select Date</label>

        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="border rounded-lg px-4 py-3"
          disabled={!!hold}
        />
      </div>

      {/* Availability */}
      {selectedDate && (
        <div>
          <h2 className="text-lg font-medium mb-4">Available Windows</h2>

          {loading ? (
            <p className="text-gray-500">Loading availability...</p>
          ) : slots.length === 0 ? (
            <p className="text-gray-500">No availability for this date.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-3">
                {slots.map((slot, index) => (
                  <button
                    key={index}
                    disabled={!!hold}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setShowBookingOptions(false);
                      setBookingType(null);
                    }}
                    className={`border rounded-lg px-5 py-3 transition ${
                      selectedSlot?.startTime === slot.startTime &&
                      selectedSlot?.endTime === slot.endTime
                        ? "bg-primary text-white"
                        : "hover:bg-primary hover:text-white"
                    } ${hold ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {slot.startTime} - {slot.endTime}
                  </button>
                ))}
              </div>

              {/* Selected slot */}
              {selectedSlot && !hold && (
                <div className="mt-6 border rounded-xl p-5">
                  <p className="mb-4">
                    Selected window:{" "}
                    <strong>
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </strong>
                  </p>

                  <button
                    onClick={handleHoldSlot}
                    disabled={holding}
                    className="bg-primary text-white px-6 py-3 rounded-full"
                  >
                    {holding ? "Holding..." : "Hold Slot"}
                  </button>
                </div>
              )}

              {/* Active hold */}
              {hold && (
                <div className="mt-8 border rounded-xl p-5">
                  <p className="font-medium text-lg">Slot Held Successfully</p>

                  <p className="mt-2 text-gray-600">
                    {selectedSlot?.startTime} - {selectedSlot?.endTime}
                  </p>

                  <p className="mt-4 text-lg font-semibold">
                    Time remaining:{" "}
                    <span className="text-primary">
                      {formatTime(remainingSeconds)}
                    </span>
                  </p>

                  {/* Booking type selection */}
                  {!showBookingOptions && (
                    <button
                      className="mt-5 bg-primary text-white px-6 py-3 rounded-full"
                      onClick={() => setShowBookingOptions(true)}
                    >
                      Continue to Booking
                    </button>
                  )}

                  {showBookingOptions && (
                    <div className="mt-6">
                      <h3 className="font-medium text-lg mb-4">
                        Choose Booking Type
                      </h3>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={() => {
                            setBookingType("ONE_TIME");
                          }}
                          className={`border rounded-lg px-6 py-3 transition ${
                            bookingType === "ONE_TIME"
                              ? "bg-primary text-white"
                              : "hover:bg-primary hover:text-white"
                          }`}
                        >
                          One-time Appointment
                        </button>

                        <button
                          onClick={() => {
                            setBookingType("RECURRING");
                          }}
                          className={`border rounded-lg px-6 py-3 transition ${
                            bookingType === "RECURRING"
                              ? "bg-primary text-white"
                              : "hover:bg-primary hover:text-white"
                          }`}
                        >
                          Recurring Appointment
                        </button>
                      </div>

                      {/* One-time booking */}
                      {bookingType === "ONE_TIME" && (
                        <div className="mt-6 border rounded-xl p-5">
                          <p className="text-gray-600 mb-4">
                            Book this therapist window as a one-time
                            appointment.
                          </p>

                          <button
                            onClick={handleOneTimeBooking}
                            disabled={booking}
                            className="bg-primary text-white px-6 py-3 rounded-full"
                          >
                            {booking ? "Booking..." : "Confirm Appointment"}
                          </button>
                        </div>
                      )}

                      {/* Recurring booking */}
                      {bookingType === "RECURRING" && (
                        <div className="mt-6 border rounded-xl p-5">
                          <div className="mb-5">
                            <label className="block text-sm font-medium mb-2">
                              Recurrence Frequency
                            </label>

                            <select
                              value={frequency}
                              onChange={(e) => setFrequency(e.target.value)}
                              className="border rounded-lg px-4 py-3"
                            >
                              <option value="DAILY">Daily</option>

                              <option value="WEEKLY">Weekly</option>

                              <option value="BIWEEKLY">Bi-weekly</option>

                              <option value="MONTHLY">Monthly</option>
                            </select>
                          </div>

                          <div className="mb-5">
                            <label className="block text-sm font-medium mb-2">
                              Recurrence End Date
                            </label>

                            <input
                              type="date"
                              min={selectedDate}
                              value={recurringEndDate}
                              onChange={(e) =>
                                setRecurringEndDate(e.target.value)
                              }
                              className="border rounded-lg px-4 py-3"
                            />
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4 mb-5 text-sm text-gray-600">
                            <p>
                              <strong>Start:</strong> {selectedDate}
                            </p>

                            <p>
                              <strong>Time:</strong> {selectedSlot.startTime} -{" "}
                              {selectedSlot.endTime}
                            </p>

                            <p>
                              <strong>Frequency:</strong> {frequency}
                            </p>

                            {recurringEndDate && (
                              <p>
                                <strong>Until:</strong> {recurringEndDate}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={handleRecurringBooking}
                            disabled={booking}
                            className="bg-primary text-white px-6 py-3 rounded-full"
                          >
                            {booking
                              ? "Booking..."
                              : "Confirm Recurring Appointment"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Appointment;
