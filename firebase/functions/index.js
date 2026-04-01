const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.routeDecisionPipeline = onRequest(async (request, response) => {
  const payload = request.body || {};
  logger.info("Route decision pipeline trigger received", {
    source: payload.source,
    destination: payload.destination,
    riskScore: payload.riskScore,
    recommendedRouteId: payload.recommendedRouteId,
  });

  response.status(202).json({
    status: "accepted",
    executionMode: "firebase_functions",
    receivedAt: new Date().toISOString(),
  });
});
