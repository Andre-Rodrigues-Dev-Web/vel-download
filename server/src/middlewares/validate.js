const { ZodError } = require("zod");

function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Falha de validação",
          details: error.issues
        });
      }

      return next(error);
    }
  };
}

module.exports = {
  validate
};
