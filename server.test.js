const supertest = require("supertest");

const { app } = require("./server");

const cookieSession = require("cookie-session");
const { TestScheduler } = require("jest");

// user who are logged out are redirected to registration, when attempting going to petition

test("redirect logged out users from petition to register", () => {
    cookieSession.mockSessionOnce({
        userId: false,
        signatureId: false,
    });
    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.Head.location).toBe("/register");
        });
});
