import { Logger } from "@hdapp/shared/web2-common/utils";
import { HttpException } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "express";
import { AuthModule } from "./api/auth/auth.module";
import { FileModule } from "./api/file/file.module";
import { UsersModule } from "./api/users/users.module";
import { AppModule } from "./app.module";
import { ErrorInterceptor } from "./interceptors/error.interceptor";
import { PerformanceLoggingInterceptor } from "./interceptors/performance-logging.interceptor";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import "pg";

HttpException.createBody = (objectOrErrorMessage: object | string, description?: string, statusCode?: number) => {
    if (!objectOrErrorMessage) {
        return { message: description };
    }
    return typeof objectOrErrorMessage === "object"
        && !Array.isArray(objectOrErrorMessage)
        ? objectOrErrorMessage
        : { message: objectOrErrorMessage };
};

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { cors: true, logger: new Logger("nest") });

    app.use(json({ limit: "50mb" }));
    app.use(urlencoded({ limit: "50mb", extended: true }));
    app.useGlobalInterceptors(
        new PerformanceLoggingInterceptor(),
        new ErrorInterceptor(),
        new ResponseInterceptor(),
    );

    const options = new DocumentBuilder()
        .setTitle("Healthcare DApp Web2 Backend")
        .setDescription(
            "A decentralized healthcare data management application.",
        )
        .setVersion("1.0")
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(
        app,
        options,
        { include: [AuthModule, FileModule, UsersModule] },
    );

    SwaggerModule.setup("/api/swagger-ui", app, document);

    await app.listen(8080);
}
void bootstrap();
