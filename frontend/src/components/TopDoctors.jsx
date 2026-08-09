import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const TopDoctors = () => {
  const navigate = useNavigate();
  const { therapists } = useContext(AppContext);

  return (
    <div className="flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10">
      <h1 className="text-3xl font-medium">Our Therapists</h1>

      <p className="sm:w-1/3 text-center text-sm">
        Choose a therapist and book an appointment at a time that works for you.
      </p>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-5">
        {therapists.map((therapist) => (
          <div
            key={therapist._id}
            onClick={() => {
              navigate(`/appointment/${therapist._id}`);
              scrollTo(0, 0);
            }}
            className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:-translate-y-2 transition-all duration-500"
          >
            <div className="p-5">
              <div className="flex items-center gap-2 text-sm text-green-500 mb-3">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Available for booking
              </div>

              <h2 className="text-lg font-medium text-gray-800">
                {therapist.name}
              </h2>

              <p className="text-sm text-gray-500 mt-1">Therapist</p>

              <button className="mt-5 w-full bg-blue-50 text-gray-700 py-2 rounded-full">
                View Availability
              </button>
            </div>
          </div>
        ))}
      </div>

      {therapists.length === 0 && (
        <p className="text-gray-500 mt-5">No therapists available.</p>
      )}
    </div>
  );
};

export default TopDoctors;
