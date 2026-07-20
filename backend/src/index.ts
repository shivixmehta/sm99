import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import locationsRouter from "./routes/locations";
import staffRouter from "./routes/staff";
import attendanceRouter from "./routes/attendance";
import inventoryRouter from "./routes/inventory";
import otCasesRouter from "./routes/otCases";
import ivfPackagesRouter from "./routes/ivfPackages";
import dashboardRouter from "./routes/dashboard";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/staff", staffRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/ot-cases", otCasesRouter);
app.use("/api/ivf-packages", ivfPackagesRouter);
app.use("/api/dashboard", dashboardRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Hospital inventory API listening on port ${PORT}`);
});
