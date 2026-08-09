import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";

// API for Register a New User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check for Missing Fields
    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "Please fill in Missing Details",
      });
    }

    // Check Password Length is 8 or above
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password should be at least 8 characters",
      });
    }

    // Validate Email
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // Crypting Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Adding New User Data To Database
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: "PATIENT",
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
    );

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API For User Login

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User Does Not Exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
      );
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Email or Password does not match" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get the User Profile Data

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userData = await userModel.findById(userId).select("-password");

    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to Update User Profile Data

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({
        success: false,
        message: "Please fill in Missing Details",
      });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.json({ success: true, message: "Profile Updated Successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API To Book an Appointment

const bookAppointment = async (req, res) => {
  try {
    const { docId, slotDate, slotTime } = req.body;
    const userId = req.user.id;

    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData.available) {
      return res.json({ success: false, message: "Doctor is not available" });
    }

    let slots_booked = docData.slots_booked;

    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({
          success: false,
          message: "Slot already booked, please choose another slot",
        });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select("-password");

    delete docData.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // save new slot data in docData

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: "Appointment Booked Successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for the User Appointments idsplay on the my-appointments page in frontend

const listAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await appointmentModel
      .find({ patientId })
      .populate("therapistId", "name email");

    const formattedAppointments = appointments.map((appointment) => ({
      ...appointment.toObject(),
      therapistData: appointment.therapistId,
      therapistId: appointment.therapistId?._id,
    }));

    res.json({
      success: true,
      appointments: formattedAppointments,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// API for the Patient to cancel an Appointment

const cancelAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    // Find the appointment
    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Make sure this appointment belongs to the logged-in patient
    if (appointment.patientId.toString() !== patientId) {
      return res.json({
        success: false,
        message: "Unauthorised Access",
      });
    }

    // Only scheduled appointments can be cancelled
    if (appointment.status !== "scheduled") {
      return res.json({
        success: false,
        message: `Appointment cannot be cancelled because its status is ${appointment.status}`,
      });
    }

    // Update appointment status
    appointment.status = "cancelled";

    await appointment.save();

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// API for Payment Using Razorpay

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment Cancelled or Not Found",
      });
    }

    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY,
      receipt: appointmentId,
    };

    const order = await razorpayInstance.orders.create(options);

    res.json({ success: true, order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to verify the payment of razorpay

const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === "paid") {
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {
        payment: true,
      });
      res.json({ success: true, message: "Payment Successfull" });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointments,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
};
