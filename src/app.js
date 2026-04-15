require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const path = require("path");
require("./config/redis");
const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");
const passport = require("./config/passport");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs");
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(passport.initialize());
// Set view engine
app.set("view engine", "ejs");

// Set views folder
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", routes);

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ error: "URL Not Found" });
  }

  return res.status(404).render("pages/error", {
    title: "Page Not Found",
    message: "The page you requested could not be found.",
    currentPath: req.path,
    pageName: "error",
  });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on  port ${PORT}`);
});
server.on("error", (err) => {
  console.error("Server Failed to start");
});
