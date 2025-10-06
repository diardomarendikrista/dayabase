module.exports = {
  apps: [
    {
      name: "dayabase-be",
      script: "app.js",
      cwd: "./dayabase-be/",

      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
