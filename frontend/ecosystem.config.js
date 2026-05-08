module.exports = {
    apps: [
        {
            name: "qms-fe",

            script: "./node_modules/next/dist/bin/next",

            args: "start -p 9102",

            cwd: "D:/QMS/frontend",

            exec_mode: "fork",

            autorestart: true,

            watch: false,

            env: {
                NODE_ENV: "production"
            }
        }
    ]
}