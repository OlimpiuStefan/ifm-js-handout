// Service configuration, read once at startup. PORT defaults to 3000.
export const config = {
  port: Number(process.env.PORT ?? 3000),
};
