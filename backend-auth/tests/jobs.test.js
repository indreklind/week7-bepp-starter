const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const Job = require("../models/jobModel");
const User = require("../models/userModel");

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

let token = null;

beforeAll(async () => {
  await User.deleteMany({});
  const result = await api.post("/api/users/signup").send({
    name: "John Doe",
    email: "john@example.com",
    password: "R3g5T7#gh",
    phone_number: "1234567890",
    gender: "Male",
    date_of_birth: "1990-01-01",
    membership_status: "Active",
  });
  token = result.body.token;
});

describe("Job Routes", () => {
  beforeEach(async () => {
    await Job.deleteMany({});
    await api
    .post("/api/jobs")
    .set("Authorization", "Bearer " + token)
    .send(jobs[0]);

    await api
      .post("/api/jobs")
      .set("Authorization", "Bearer " + token)
      .send(jobs[1]);
  });

  describe("GET /api/jobs", () => {
    it("should return all jobs as JSON with status 200", async () => {
      const response = await api
        .get("/api/jobs")
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(response.body).toHaveLength(jobs.length);
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

    it("should return 404 for an invalid job ID format", async () => {
      const invalidId = "12345";
      await api.get(`/api/jobs/${invalidId}`).expect(404);
    });
  });

  describe("POST /api/jobs", () => {
    describe("when the user is authenticated", () => {
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
          .set("Authorization", "Bearer " + token)
          .send(newJob)
          .expect(201);

        expect(response.body.title).toBe(newJob.title);

        const jobsAtEnd = await jobsInDb();
        expect(jobsAtEnd).toHaveLength(jobs.length + 1);
      });
    });

    describe("when the user is not authenticated", () => {
      it("should return 401 if no token is provided", async () => {
        const newJob = {
          title: "Ghost Job",
          type: "Full-Time",
          description: "This should not be created.",
          company: {
            name: "NoCo",
            contactEmail: "no@no.com",
            contactPhone: "000",
          },
        };

        await api.post("/api/jobs").send(newJob).expect(401);

        const jobsAtEnd = await jobsInDb();
        expect(jobsAtEnd).toHaveLength(jobs.length);
      });
    });
  });

  describe("PUT /api/jobs/:jobId", () => {
    describe("when the user is authenticated", () => {
      it("should update the job and return the updated document", async () => {
        const job = await Job.findOne();
        const updates = { title: "Updated Title", type: "Contract" };

        const response = await api
          .put(`/api/jobs/${job._id}`)
          .set("Authorization", "Bearer " + token)
          .send(updates)
          .expect(200)
          .expect("Content-Type", /application\/json/);

        expect(response.body.title).toBe(updates.title);

        const updatedJob = await Job.findById(job._id);
        expect(updatedJob.type).toBe(updates.type);
      });
    });

    describe("when the user is not authenticated", () => {
      it("should return 401 if no token is provided", async () => {
        const job = await Job.findOne();
        await api.put(`/api/jobs/${job._id}`).send({ title: "Nope" }).expect(401);
      });
    });

    describe("when the id is invalid", () => {
      it("should return 404 for an invalid ID format", async () => {
        const invalidId = "12345";
        await api
          .put(`/api/jobs/${invalidId}`)
          .set("Authorization", "Bearer " + token)
          .send({})
          .expect(404);
      });
    });
  });

  describe("DELETE /api/jobs/:jobId", () => {
    describe("when the user is authenticated", () => {
      it("should delete the job and return status 204", async () => {
        const jobsAtStart = await jobsInDb();
        const jobToDelete = jobsAtStart[0];

        await api
          .delete(`/api/jobs/${jobToDelete.id}`)
          .set("Authorization", "Bearer " + token)
          .expect(204);

        const jobsAtEnd = await jobsInDb();
        expect(jobsAtEnd).toHaveLength(jobsAtStart.length - 1);
        expect(jobsAtEnd.map((j) => j.title)).not.toContain(jobToDelete.title);
      });
    });

    describe("when the user is not authenticated", () => {
      it("should return 401 if no token is provided", async () => {
        const job = await Job.findOne();
        await api.delete(`/api/jobs/${job._id}`).expect(401);
      });
    });

    describe("when the id is invalid", () => {
      it("should return 404 for an invalid ID format", async () => {
        const invalidId = "12345";
        await api
          .delete(`/api/jobs/${invalidId}`)
          .set("Authorization", "Bearer " + token)
          .expect(404);
      });
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});