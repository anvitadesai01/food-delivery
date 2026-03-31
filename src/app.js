require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
require("./config/redis");
const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");
const passport = require("./config/passport");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(passport.initialize());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", routes);

// app.get('/', (req, res) => {
//   res.send('API is running...');
// });

app.use((req, res) => {
  res.status(404).json({ error: "URL Not Found" });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on  port ${PORT}`);
});
server.on("error", (err) => {
  console.error("Server Failed to start");
});
