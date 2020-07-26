module.exports = {
  apps: [
    {
      name: "api",
      script: "./server.js",
      watch: false,
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
}
