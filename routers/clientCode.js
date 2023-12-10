const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { sequelize } = require("../services/sequelize");
const client = require("../services/connection");

// Get request API call to check the application status in Fulfillment Tables and Aadhaar PAN seeding (using Client Code as Parameter ID)
router.get("/:id", async (req, res) => {
  try {
    const headerToken = req.headers["authorization"];
    if (!headerToken) {
      return res
        .status(401)
        .json({ message: "Token Not Found. Kindly provide the Bearer Token" });
    }

    const token = headerToken.split(" ")[1];
    const bearerToken = jwt.decode(token);
    req.bearerToken = bearerToken;

    if (bearerToken.agentData.role !== 38) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const query1 = `
      SELECT ui.app_number, s.segment, s.exchange, s.status, s.remarks
      FROM segment s
      INNER JOIN user_id ui ON ui.app_number = s.app_number
      WHERE ui.user_id = '${id}' AND s.segment = 'C';
    `;

    const query2 = `
      SELECT cd.app_number, cd.status, cd.last_update_ts, cd.error_message
      FROM cdsl_app cd
      INNER JOIN user_id ui ON ui.app_number = cd.app_number
      WHERE ui.user_id = '${id}';
    `;

    const query3 = `
      SELECT ui.app_number, ui.user_id, RIGHT(ck.status, 2) AS "status",
        CASE
          WHEN RIGHT(ck.status, 2) = '01' THEN 'SUBMITTED'
          WHEN RIGHT(ck.status, 2) = '02' THEN 'KRA_VERIFIED'
          WHEN RIGHT(ck.status, 2) = '03' THEN 'HOLD'
          WHEN RIGHT(ck.status, 2) = '04' THEN 'REJECTED'
          WHEN RIGHT(ck.status, 2) = '05' THEN 'NOT_AVAILABLE'
          WHEN RIGHT(ck.status, 2) = '06' THEN 'DEACTIVATED'
          WHEN RIGHT(ck.status, 2) = '07' THEN 'KRA_VALIDATED'
          WHEN RIGHT(ck.status, 2) = '11' THEN 'EXISTING_KYC_SUBMITTED'
          WHEN RIGHT(ck.status, 2) = '12' THEN 'EXISTING_KYC_VERIFIED'
          WHEN RIGHT(ck.status, 2) = '13' THEN 'EXISTING_KYC_HOLD'
          WHEN RIGHT(ck.status, 2) = '14' THEN 'EXISTING_KYC_REJECTED'
          WHEN RIGHT(ck.status, 2) = '22' THEN 'KYC_REGISTERED_WITH_CVLMF'
          WHEN RIGHT(ck.status, 2) = '88' THEN 'NOT_CHECKED_WITH_MULTIPLE_KRA'
        END AS "Current_status"
      FROM user_id ui
      INNER JOIN pan pn ON pn.app_number = ui.app_number
      INNER JOIN cvlkra ck ON ck.pan = pn.pan
      WHERE ui.user_id = '${id}';
    `;

    const query4 = `
      SELECT user_id.app_number, pan.pan, pan.is_aadhaar_pan_seeded
      FROM user_id
      INNER JOIN pan ON pan.app_number = user_id.app_number
      WHERE user_id.user_id = '${id}';
    `;

    const [result1, error1] = await sequelize.query(query1);
    const [result2, error2] = await sequelize.query(query2);
    const [result3, error3] = await sequelize.query(query3);
    const [result4, error4] = await sequelize.query(query4);

    if (result1 && result2 && result3 && result4) {
      res.status(200).json({
        UCCDate: result1,
        CDSLData: result2,
        KRA_Data: result3,
        PAN_seeding_Data: result4,
      });
    } else {
      res.status(500).json({
        UCCDate: error1,
        CDSLData: error2,
        KRA_Data: error3,
        PAN_seeding_Data: error4,
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

client.connect();

module.exports = router;
