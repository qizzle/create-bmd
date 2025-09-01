// This runs when the automation is ran from ActionPallete
// Documentation: https://github.com/RatWasHere/bmods/blob/master/AUTOMATIONS.md

module.exports = {
  run: async (options) => {
    // This is where your code will go
    options.result("Hello from //name//!");
  },
};
