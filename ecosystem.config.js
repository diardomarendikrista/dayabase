module.exports = {
  apps: [
    {
      name: "app",
      script: "app.js",
      cwd: "./dayabase-be/",

      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
