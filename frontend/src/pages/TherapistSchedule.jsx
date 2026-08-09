import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const TherapistSchedule = () => {
  const { backendUrl, token } = useContext(AppContext);

  const [schedules, setSchedules] = useState([]);
  const [selectedDay, setSelectedDay] = useState("MONDAY");
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --------------------------------------------------
  // Get therapist schedule
  // --------------------------------------------------

  const getSchedule = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const { data } = await axios.get(`${backendUrl}api/therapist/schedule`, {
        headers: { token },
      });

      if (data.success) {
        setSchedules(data.schedule);
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
    getSchedule();
  }, [token]);

  // --------------------------------------------------
  // Load selected day's windows
  // --------------------------------------------------

  useEffect(() => {
    const schedule = schedules.find((item) => item.dayOfWeek === selectedDay);

    if (schedule) {
      setWindows(
        schedule.windows.map((window) => ({
          startTime: window.startTime,
          endTime: window.endTime,
        })),
      );
    } else {
      setWindows([]);
    }
  }, [selectedDay, schedules]);

  // --------------------------------------------------
  // Add window
  // --------------------------------------------------

  const addWindow = () => {
    setWindows((prev) => [
      ...prev,
      {
        startTime: "",
        endTime: "",
      },
    ]);
  };

  // --------------------------------------------------
  // Remove window
  // --------------------------------------------------

  const removeWindow = (index) => {
    setWindows((prev) =>
      prev.filter((_, windowIndex) => windowIndex !== index),
    );
  };

  // --------------------------------------------------
  // Update window
  // --------------------------------------------------

  const updateWindow = (index, field, value) => {
    setWindows((prev) =>
      prev.map((window, windowIndex) =>
        windowIndex === index
          ? {
              ...window,
              [field]: value,
            }
          : window,
      ),
    );
  };

  // --------------------------------------------------
  // Save schedule
  // --------------------------------------------------

  const saveSchedule = async () => {
    // Validate windows

    for (const window of windows) {
      if (!window.startTime || !window.endTime) {
        toast.error("Please fill all time fields.");
        return;
      }

      if (window.startTime >= window.endTime) {
        toast.error("End time must be after start time.");
        return;
      }
    }

    try {
      setSaving(true);

      const { data } = await axios.patch(
        `${backendUrl}api/therapist/schedule`,
        {
          dayOfWeek: selectedDay,
          windows,
        },
        {
          headers: { token },
        },
      );

      if (data.success) {
        toast.success("Schedule updated successfully.");

        // Refresh schedule
        await getSchedule();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);

      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-gray-500">Loading schedule...</p>
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Manage Schedule</h1>

        <p className="text-gray-500 mt-1">
          Update your availability without affecting existing appointments.
        </p>
      </div>

      {/* Day selection */}

      <div className="flex flex-wrap gap-2 mb-8">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-5 py-2 rounded-full border transition ${
              selectedDay === day
                ? "bg-primary text-white"
                : "hover:bg-primary hover:text-white"
            }`}
          >
            {day.charAt(0) + day.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Schedule editor */}

      <div className="border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium">
              {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Available appointment windows
            </p>
          </div>

          <button
            onClick={addWindow}
            className="border px-4 py-2 rounded-full hover:bg-gray-100"
          >
            + Add Window
          </button>
        </div>

        {windows.length === 0 ? (
          <div className="border border-dashed rounded-lg p-8 text-center">
            <p className="text-gray-500">
              No availability configured for this day.
            </p>

            <button
              onClick={addWindow}
              className="mt-4 bg-primary text-white px-5 py-2 rounded-full"
            >
              Add Availability
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {windows.map((window, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-4 items-start sm:items-end"
              >
                <div className="flex-1 w-full">
                  <label className="block text-sm text-gray-600 mb-2">
                    Start Time
                  </label>

                  <input
                    type="time"
                    value={window.startTime}
                    onChange={(e) =>
                      updateWindow(index, "startTime", e.target.value)
                    }
                    className="border rounded-lg px-4 py-3 w-full"
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-sm text-gray-600 mb-2">
                    End Time
                  </label>

                  <input
                    type="time"
                    value={window.endTime}
                    onChange={(e) =>
                      updateWindow(index, "endTime", e.target.value)
                    }
                    className="border rounded-lg px-4 py-3 w-full"
                  />
                </div>

                <button
                  onClick={() => removeWindow(index)}
                  className="text-red-600 border border-red-200 px-4 py-3 rounded-lg hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Save */}

        <div className="mt-8 pt-6 border-t">
          <button
            onClick={saveSchedule}
            disabled={saving}
            className="bg-primary text-white px-7 py-3 rounded-full disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </div>

      {/* Important note */}

      <div className="mt-6 bg-gray-50 rounded-xl p-5 text-sm text-gray-600">
        <p className="font-medium text-gray-800 mb-2">Important</p>

        <p>
          Changing your schedule only affects future availability. Existing
          one-time and recurring appointments are not modified.
        </p>
      </div>
    </div>
  );
};

export default TherapistSchedule;
