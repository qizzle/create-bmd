/*
    //name// mod by //author//
    Licensed under MIT License

    //description//
*/
module.exports = {
  data: {
    name: "//name//",
  },
  info: {
    source: "https://github.com/RatWasHere/bmods/tree/master/Actions",
    creator: "//author//",
    description: "//description//",
    donate: "//donation//",
  },
  category: "//category//",
  UI: [
    // This is the UI for the Action
    {
      element: "input",
      storeAs: "myinput",
      name: "Input",
    },
    "-",
  ],

  async run(values, interaction, client, bridge) {
    // This is where your code will go
    // Documentation: https://github.com/RatWasHere/bmods/blob/master/MODS.md
    console.log("Hello //name//!");
  },
};
