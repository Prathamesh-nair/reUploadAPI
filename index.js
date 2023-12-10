require("dotenv").config();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const reUploadRouter = require("./routers/reUpload");
const clientCodeRouter = require("./routers/clientCode");

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());


app.use("/application", reUploadRouter);
app.use("/checkApplication", clientCodeRouter);


app.listen(PORT, () => console.log(`Sever is Up on http://localhost:${PORT}`));
