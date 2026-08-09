import multer from "multer";

const storage = multer.diskStorage({
  filname: function (req, file, callback) {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

export default upload;
