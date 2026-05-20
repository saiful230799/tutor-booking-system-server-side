// basic-crud-server/auth.js
const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");

function initAuth(client) {
  return betterAuth({
    database: mongodbAdapter(client.db("mediQueueDB")),
    
    baseURL: "http://localhost:8000", 

    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    
    socialProviders: {
      google: {
       
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    
    trustedOrigins: ["http://localhost:3000"],
    
    secret: process.env.BETTER_AUTH_SECRET || "your-super-secret-key-min-32-chars-long!",
  });
}

module.exports = { initAuth };