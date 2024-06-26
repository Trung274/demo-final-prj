const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const model = mongoose.model("User");

class AuthController {
  login = async (request, response) => {
    try {
      const user = await model.findOne({ email: request.body.email });
      if (!user) {
        return response.status(401).json({ error: "error", message: "User does not exist" });
      }

      const match = await bcrypt.compare(request.body.password, user.password);

      if (!match) {
        return response.status(401).json({ error: "error", message: "Password mismatch" });
      }

      const token = jwt.sign({ user_id: user._id }, process.env.AUTH_SECRET, {
        expiresIn: "3h",
      });

      response.status(200).json({
        _id: user._id,
        email: user.email,
        roleId: user.roleId,
        token,
      });
    } catch (error) {
      response.status(500).json({ error: error, message: "Internal server error" });
    }
  };

  verifyToken = (request, response, next) => {
    const bearerFormat = request.get("authorization");

    if (bearerFormat) {
      const token = bearerFormat.split(" ")[1];

      try {
        const decoded = jwt.verify(token, process.env.AUTH_SECRET);
        request.user = decoded;

        return next();
      } catch (error) {
        return response.status(401).json({ error: error, message: "Invalid Token" });
      }
    } else {
      response.status(401).json("Token is required");
    }
  };
}

module.exports = new AuthController();