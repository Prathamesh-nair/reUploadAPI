const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const logger = require("../services/logger");
const client = require("../services/connection");

const checkToken = (req, res, next) => {
  const headerToken = req.headers["authorization"];
  if (!headerToken) {
    return res
      .status(401)
      .json({ message: "Token Not Found. Kindly provide the Bearer Token" });
  }

  const token = headerToken.split(" ")[1];
  const bearerToken = jwt.decode(token);
  req.bearerToken = bearerToken;

  if (!bearerToken || bearerToken.agentData.role !== 38) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};

// Get request API call to check the application status in the Scrutiny Table (using the application number as the parameter ID)
router.get("/:id", checkToken, async (req, res) => {
  try {
    const result = await client.query(
      `SELECT * FROM scrutiny WHERE app_number = $1`,
      [req.params.id]
    );
    res.send(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Post request API call to update the application status in the Scrutiny Table (using the application number as the parameter ID)
router.post("/:id", checkToken, async (req, res) => {
  const { requestID } = req.body;

  if (!requestID) {
    return res.status(400).json({ message: "Kindly provide Request ID" });
  }

  try {
    await client.query(
      `UPDATE scrutiny SET status = 'pending', last_update_ts = CURRENT_TIMESTAMP, last_update_source = 'techops_api' WHERE app_number = $1`,
      [req.params.id]
    );
    res.status(200).json({ message: `${req.params.id} updated successfully` });
    logger.info(
      `${req.params.id} has been updated by ${req.bearerToken.agentData.id}: ${req.bearerToken.agentData.name} against the request id: ${requestID}`
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
