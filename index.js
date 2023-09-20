require("dotenv").config();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const express = require("express");
// const jwt = require("jsonwebtoken");
const logger = require("./logger");
const app = express();
const bodyParser = require("body-parser");
const client = require("./connection");
const PORT = 3000;

app.use(bodyParser.json());

// app.use((req, res, next) => {
//   const headerToken = req.headers["authorization"];
//   if (typeof headerToken !== "undefined") {
//     const token = headerToken.split(" ")[1];
//     const bearerToken = jwt.decode(token);
//     // console.log(bearerToken);
//     if (bearerToken.agentData.exp >= dateNow.getTime() / 1000) {
//       if (bearerToken.agentData.role !== "38") {
//         next();
//       } else {
//         res.status(401).json({ message: `User not Authenticated.` });
//       }
//     } else {
//       res.status(400).json({ message: `Token is expired.` });
//     }
//   } else {
//     res.status(401).json({ message: `Token Not Found.` });
//   }
// });

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

app.post("/application/:id", (req, res) => {
  const { Ecode, requestID } = req.body;

  if (!Ecode || !requestID) {
    res.status(401).json({ message: `Kindly provide Ecode and Request ID` });
  }
  client.query(
    `
  update scrutiny set status = 'pending' , last_update_ts = CURRENT_TIMESTAMP where app_number = '${req.params.id}';
  `,
    (err, result) => {
      if (!err) {
        res
          .status(200)
          .json({ message: `${req.params.id} updated Successfully` });
        logger.info(
          `${req.params.id} has been updated by ${Ecode} against request id:${requestID}`
        );
      } else {
        res.status(500).json({
          message: `There is some technical issue. Please try again.`,
        });
        console.log(error);
        // logger.error(``)
      }
    }
  );
});

client.connect();
app.listen(PORT, () => console.log(`Sever is Up on http://localhost:${PORT}`));
