module.exports = {
  apps: [
    {
      name: "my-app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: "C:/Share/my-app",
      interpreter: "node",
      env: {
       NODE_ENV: "production",
      },
    },
  ],
};