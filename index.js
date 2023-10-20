require("dotenv").config();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const express = require("express");
const jwt = require("jsonwebtoken");
const logger = require("./logger");
const app = express();
const bodyParser = require("body-parser");
const client = require("./connection");
const { sequelize } = require("./sequelize");

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

//Middleware for Bearer Token authentication

app.use((req, res, next) => {
  const headerToken = req.headers["authorization"];
  if (typeof headerToken !== "undefined") {
    const token = headerToken.split(" ")[1];
    const bearerToken = jwt.decode(token);
    req.bearerToken = bearerToken;
    if (bearerToken.agentData.role !== "38") {
      next();
    }
  } else {
    res
      .status(401)
      .json({ message: `Token Not Found. Kindly provide the Bearer Token` });
  }
});

//Get request API call to check the application status in Scrutiny Table(using application number as Parameter ID)
app.get("/application/:id", (req, res) => {
  client.query(
    `select * from scrutiny where app_number ='${req.params.id}'`,
    (err, result) => {
      if (!err) {
        res.send(result.rows);
      } else {
        console.log(err.message);
      }
    }
  );
  client.end;
});

//Post request API call to update the application status in Scrutiny Table(using application number as Parameter ID)
app.post("/application/:id", (req, res) => {
  const { requestID } = req.body;

  if (!requestID) {
    res.status(401).json({ message: `Kindly provide Request ID` });
  }
  client.query(
    `
    update scrutiny set status = 'pending' , last_update_ts = CURRENT_TIMESTAMP, last_update_source = 'techops_api' where app_number = '${req.params.id}';
    `,
    (err, result) => {
      if (!err) {
        res
          .status(200)
          .json({ message: `${req.params.id} updated Successfully` });
        logger.info(
          `${req.params.id} has been updated by ${req.bearerToken.agentData.id}: ${req.bearerToken.agentData.name} against the request id: ${requestID}`
        );
      } else {
        res.status(500).json({
          message: `There is some technical issue. Please try again.`,
        });
      }
    }
  );
});

//Get request API call to check the application status in Fulfillment Tables and aadhaar PAN seeding(using Client Code as Parameter ID)
app.get("/checkApplication/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query1 = `select ui.app_number, s.segment , s.exchange , s.status, s.remarks  from segment s
inner join user_id ui on ui.app_number  = s.app_number where ui.user_id ='${id}' and s.segment = 'C';	`;

    const query2 = `select cd.app_number , cd.status , cd.last_update_ts, cd.error_message from cdsl_app cd 
inner join user_id ui on ui.app_number = cd.app_number where ui.user_id  = '${id}';`;
    const query3 = `
      select ui.app_number, ui.user_id,right(ck.status,2) as "status",
CASE
WHEN right(ck.status,2) = '01' then 'SUBMITTED'
WHEN right(ck.status,2) = '02' then 'KRA_VERIFIED'
WHEN right(ck.status,2) = '03' then 'HOLD'
WHEN right(ck.status,2) = '04' then 'REJECTED'
WHEN right(ck.status,2) = '05' then 'NOT_AVAILABLE'
WHEN right(ck.status,2) = '06' then 'DEACTIVATED'
WHEN right(ck.status,2) = '07' then 'KRA_VALIDATED'
WHEN right(ck.status,2) = '11' then 'EXISTING_KYC_SUBMITTED'
WHEN right(ck.status,2) = '12' then 'EXISTING_KYC_VERIFIED'
WHEN right(ck.status,2) = '13' then 'EXISTING_KYC_HOLD'
WHEN right(ck.status,2) = '14' then 'EXISTING_KYC_REJECTED'
WHEN right(ck.status,2) = '22' then 'KYC_REGISTERED_WITH_CVLMF'
WHEN right(ck.status,2) = '88' then 'NOT_CHECKED_WITH_MULTIPLE_KRA'
END AS "Current_status"
from user_id ui
inner join pan pn on pn.app_number = ui.app_number
inner join cvlkra ck on ck.pan = pn.pan
where  ui.user_id = '${id}';`;

    const query4 = `select user_id.app_number, pan.pan, pan.is_aadhaar_pan_seeded  from user_id
inner join pan on pan.app_number = user_id.app_number 
where user_id.user_id  = '${id}';`;

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
app.listen(PORT, () => console.log(`Sever is Up on http://localhost:${PORT}`));
