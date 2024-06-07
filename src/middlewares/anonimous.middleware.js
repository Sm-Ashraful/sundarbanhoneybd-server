import { Client } from "../models/auth.models.js";

export const ensureUser = async (req, res, next) => {
  if (!req.user) {
    let anonymousUser = await Client.findOne({
      isAnonymous: true,
      sessionId: req.sessionID,
    });
    if (!anonymousUser) {
      anonymousUser = new Client({
        isAnonymous: true,
        sessionId: req.sessionID,
      });
      await anonymousUser.save();
    }
    req.user = anonymousUser;
  }
  next();
};
