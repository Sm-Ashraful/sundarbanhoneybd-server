import { Cart } from "../models/cart.models.js";

export const transferCartItems = async (req, res, next) => {
  if (req.user && req.sessionID) {
    const anonymousUser = await User.findOne({
      isAnonymous: true,
      sessionId: req.sessionID,
    });
    if (anonymousUser) {
      const anonymousCart = await Cart.findOne({ owner: anonymousUser._id });
      if (anonymousCart) {
        let userCart = await Cart.findOne({ owner: req.user._id });
        if (!userCart) {
          userCart = new Cart({ owner: req.user._id });
        }

        // Transfer items
        anonymousCart.items.forEach((anonItem) => {
          const existingItem = userCart.items.find(
            (item) => item.product.toString() === anonItem.product.toString()
          );
          if (existingItem) {
            existingItem.quantity += anonItem.quantity;
          } else {
            userCart.items.push(anonItem);
          }
        });

        await userCart.save();
        await Cart.deleteOne({ owner: anonymousUser._id });
        await User.deleteOne({ _id: anonymousUser._id });
      }
    }
  }
  next();
};
