const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const User = require("../models/userModel");

beforeEach(async () => {
  await User.deleteMany({});
});

describe("POST /api/users/signup", () => {
  describe("when the payload is valid", () => {
    it("should signup a new user with status 201 and return a token", async () => {
      const userData = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "R3g5T7#gh",
        phone_number: "09-123-4567",
        gender: "Female",
        date_of_birth: "1995-06-15",
        membership_status: "Active",
      };

      const result = await api
        .post("/api/users/signup")
        .send(userData)
        .expect(201)
        .expect("Content-Type", /application\/json/);

      expect(result.body).toHaveProperty("token");
      expect(result.body.email).toBe(userData.email);

      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).not.toBeNull();
      expect(savedUser.name).toBe(userData.name);
    });
  });

  describe("when the payload is invalid", () => {
    it("should return 400 if required fields are missing", async () => {
      const userData = {
        email: "incomplete@example.com",
        password: "R3g5T7#gh",
      };

      const result = await api
        .post("/api/users/signup")
        .send(userData)
        .expect(400);

      expect(result.body).toHaveProperty("error");

      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeNull();
    });
  });

  describe("when the email is already taken", () => {
    it("should return 400 for duplicate email", async () => {
      const userData = {
        name: "First User",
        email: "duplicate@example.com",
        password: "R3g5T7#gh",
        phone_number: "09-111-2222",
        gender: "Male",
        date_of_birth: "1990-01-01",
        membership_status: "Active",
      };


      await api.post("/api/users/signup").send(userData).expect(201);


      const result = await api
        .post("/api/users/signup")
        .send({ ...userData, name: "Second User" })
        .expect(400);

      expect(result.body).toHaveProperty("error");
    });
  });
});


describe("POST /api/users/login", () => {
  beforeEach(async () => {
    await api.post("/api/users/signup").send({
      name: "Login Tester",
      email: "login@example.com",
      password: "R3g5T7#gh",
      phone_number: "09-123-4567",
      gender: "Male",
      date_of_birth: "1992-03-20",
      membership_status: "Active",
    });
  });

  describe("when the credentials are valid", () => {
    it("should login and return a token with status 200", async () => {
      const result = await api
        .post("/api/users/login")
        .send({
          email: "login@example.com",
          password: "R3g5T7#gh",
        })
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(result.body).toHaveProperty("token");
      expect(result.body.email).toBe("login@example.com");
    });
  });

  describe("when the credentials are invalid", () => {
    it("should return 400 with a wrong password", async () => {
      const result = await api
        .post("/api/users/login")
        .send({
          email: "login@example.com",
          password: "WrongPassword1!",
        })
        .expect(400);

      expect(result.body).toHaveProperty("error");
    });

    it("should return 400 with a non-existing email", async () => {
      const result = await api
        .post("/api/users/login")
        .send({
          email: "nobody@example.com",
          password: "R3g5T7#gh",
        })
        .expect(400);

      expect(result.body).toHaveProperty("error");
    });
  });
});


afterAll(async () => {
  await mongoose.connection.close();
});