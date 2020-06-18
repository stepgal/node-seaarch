module.exports = {
    options: {
        swaggerDefinition: {
            title: "swagger",
            info: {
                description: "The swagger documentation contains REST API references and data models for Search Items Service.",
                version: "1.0.0",
                title: "SHOP2020 API",
                contact: {
                    email: "step.ga;.2020@gmail.com"
                }
            },
            host: this.HOST,
            schemes: ["http" ]
        },
        apis: [
            "./server.js"
        ]
    }
};
