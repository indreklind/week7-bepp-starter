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


const jobsInDb = async () => {
  const allJobs = await Job.find({});
  return allJobs.map((j) => j.toJSON());
};


beforeEach(async () => {
  await Job.deleteMany({});
  await Job.insertMany(jobs);
});


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


describe("POST /api/jobs", () => {
  describe("when the payload is valid", () => {
    it("should create a new job with status 201", async () => {
      const newJob = {
        title: "DevOps Engineer",
        type: "Full-Time",
        description: "Manage CI/CD pipelines and cloud infrastructure.",
        company: {
          name: "CloudOps",
          contactEmail: "jobs@cloudops.fi",
          contactPhone: "09-111-2222",
        },
      };

      const response = await api
        .post("/api/jobs")
        .send(newJob)
        .expect(201)
        .expect("Content-Type", /application\/json/);

      expect(response.body.title).toBe(newJob.title);

      const jobsAtEnd = await jobsInDb();
      expect(jobsAtEnd).toHaveLength(jobs.length + 1);
      expect(jobsAtEnd.map((j) => j.title)).toContain(newJob.title);
    });
  });

  describe("when the payload is invalid", () => {
    it("should return 400 if required fields are missing", async () => {
      const incompleteJob = { title: "Missing Fields" };

      await api.post("/api/jobs").send(incompleteJob).expect(400);

      const jobsAtEnd = await jobsInDb();
      expect(jobsAtEnd).toHaveLength(jobs.length);
    });
  });
});


describe("PUT /api/jobs/:jobId", () => {
  describe("when the id is valid", () => {
    it("should update the job and return the updated document", async () => {
      const job = await Job.findOne();
      const updates = { title: "Updated Title", type: "Contract" };

      const response = await api
        .put(`/api/jobs/${job._id}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(response.body.title).toBe(updates.title);

      const updatedJob = await Job.findById(job._id);
      expect(updatedJob.type).toBe(updates.type);
    });
  });

  describe("when the id is invalid", () => {
    it("should return 400 for an invalid ID format", async () => {
      const invalidId = "12345";
      await api.put(`/api/jobs/${invalidId}`).send({}).expect(400);
    });
  });
});


describe("DELETE /api/jobs/:jobId", () => {
  describe("when the id is valid", () => {
    it("should delete the job and return status 204", async () => {
      const jobsAtStart = await jobsInDb();
      const jobToDelete = jobsAtStart[0];

      await api.delete(`/api/jobs/${jobToDelete.id}`).expect(204);

      const jobsAtEnd = await jobsInDb();
      expect(jobsAtEnd).toHaveLength(jobsAtStart.length - 1);
      expect(jobsAtEnd.map((j) => j.title)).not.toContain(jobToDelete.title);
    });
  });

  describe("when the id is invalid", () => {
    it("should return 400 for an invalid ID format", async () => {
      const invalidId = "12345";
      await api.delete(`/api/jobs/${invalidId}`).expect(400);
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});