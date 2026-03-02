const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const Job = require("../models/jobModel");

// Seed data
const jobs = [
  {
    title: "Senior React Developer",
    type: "Full-Time",
    description: "We are seeking a talented Front-End Developer to join our team in Helsinki.",
    company: {
      name: "NewTek Solutions",
      contactEmail: "contact@nteksolutions.com",
      contactPhone: "09-123-4567",
    },
  },
  {
    title: "Junior Python Developer",
    type: "Part-Time",
    description: "Join our Python team and help build data-driven applications.",
    company: {
      name: "DataSoft",
      contactEmail: "hr@datasoft.com",
      contactPhone: "09-765-4321",
    },
  },
];

// Helper: read all jobs straight from DB
const jobsInDb = async () => {
  const allJobs = await Job.find({});
  return allJobs.map((j) => j.toJSON());
};

// Reset the jobs collection before each test
beforeEach(async () => {
  await Job.deleteMany({});
  await Job.insertMany(jobs);
});

// ────────────────── GET /api/jobs ──────────────────
describe("GET /api/jobs", () => {
  it("should return all jobs as JSON with status 200", async () => {
    const response = await api
      .get("/api/jobs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body).toHaveLength(jobs.length);
  });

  it("should contain the first seed job title", async () => {
    const response = await api.get("/api/jobs");
    const titles = response.body.map((j) => j.title);
    expect(titles).toContain(jobs[0].title);
  });
});

// ────────────────── GET /api/jobs/:jobId ──────────────────
describe("GET /api/jobs/:jobId", () => {
  it("should return one job by ID", async () => {
    const job = await Job.findOne();
    const response = await api
      .get(`/api/jobs/${job._id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body.title).toBe(job.title);
  });

  it("should return 404 for a non-existing job ID", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    await api.get(`/api/jobs/${nonExistentId}`).expect(404);
  });

  it("should return 400 for an invalid job ID format", async () => {
    const invalidId = "12345";
    await api.get(`/api/jobs/${invalidId}`).expect(400);
  });
});

// Close DB connection once after all tests
afterAll(async () => {
  await mongoose.connection.close();
});