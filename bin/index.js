#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from 'url';

// Configuration constants
const APP_NAME = "create-bmd";
const CONFIG_FILE_NAME = "config.json";

/**
 * Common Bot Maker for Discord installation paths
 * Ordered by likelihood of installation
 */
const COMMON_BMD_PATHS = [
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Bot Maker For Discord",
  "C:\\Program Files\\Steam\\steamapps\\common\\Bot Maker For Discord",
];

/**
 * Mod type configurations defining supported mod types and their properties
 */
const MOD_TYPES = {
  Action: {
    name: "Action",
    requiresCategory: true,
    defaultCategory: "Message",
    outputPath: "AppData/Actions",
  },
  Event: {
    name: "Event",
    requiresCategory: false,
    outputPath: "AppData/Events",
  },
  Automation: {
    name: "Automation",
    requiresCategory: false,
    outputPath: "Automations",
    isFolder: true,
  },
  Theme: {
    name: "Theme",
    requiresCategory: false,
    outputPath: "Themes",
    isFolder: true,
  },
  Translation: {
    name: "Translation",
    requiresCategory: false,
    outputPath: "Translations",
    isFolder: true,
  },
};

// ESM __dirname/__filename (so template paths resolve correctly when run via npx)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize configuration paths
const configFolder = getAppDataFolder();
const configFile = path.join(configFolder, CONFIG_FILE_NAME);

/**
 * Gets the appropriate application data folder for the current platform
 *
 * @param {string} appName - The application name for the folder
 * @returns {string} The full path to the application data folder
 */
function getAppDataFolder(appName = APP_NAME) {
  const platform = os.platform();
  let basePath;

  switch (platform) {
    case "win32":
      basePath = process.env.APPDATA;
      break;
    case "darwin":
      basePath = path.join(os.homedir(), "Library", "Application Support");
      break;
    default:
      // Linux & other Unix-like systems
      basePath = path.join(os.homedir(), ".config");
      break;
  }

  if (!basePath) {
    throw new Error(
      `Unable to determine application data folder for platform: ${platform}`
    );
  }

  return path.join(basePath, appName);
}

/**
 * Searches for Bot Maker for Discord installation in common locations
 *
 * @returns {string|null} The BMD installation path if found, null otherwise
 */
function findBMDInstallation() {
  for (const installPath of COMMON_BMD_PATHS) {
    if (fs.existsSync(installPath)) {
      console.log(chalk.gray(`Found BMD installation at: ${installPath}`));
      return installPath;
    }
  }

  return null;
}

/**
 * Prompts the user to provide a custom BMD installation path
 *
 * @returns {Promise<string>} The user-provided BMD installation path
 */
async function promptForBMDPath() {
  const { customPath } = await inquirer.prompt([
    {
      name: "customPath",
      type: "input",
      message:
        "Please enter the path to your Bot Maker for Discord installation:",
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return "BMD installation path is required!";
        }

        const trimmedPath = input.trim();
        if (!fs.existsSync(trimmedPath)) {
          return "The specified path does not exist!";
        }

        // Basic validation - check if it looks like a BMD installation
        const expectedFiles = ["Bot Maker For Discord.exe", "resources"];
        const hasExpectedFiles = expectedFiles.some((file) =>
          fs.existsSync(path.join(trimmedPath, file))
        );

        if (!hasExpectedFiles) {
          return "This doesn't appear to be a valid Bot Maker for Discord installation!";
        }

        return true;
      },
    },
  ]);

  return customPath.trim();
}

/**
 * Gets the BMD installation path, either from config, auto-detection, or user input
 *
 * @param {Object} config - Current configuration object
 * @returns {Promise<string>} The BMD installation path
 */
async function getBMDPath(config) {
  // First, check if we have a saved path in config
  if (config.bmdPath && fs.existsSync(config.bmdPath)) {
    console.log(chalk.gray(`Using saved BMD path: ${config.bmdPath}`));
    return config.bmdPath;
  }

  // Try to auto-detect BMD installation
  const autoDetectedPath = findBMDInstallation();
  if (autoDetectedPath) {
    return autoDetectedPath;
  }

  // If not found, prompt user for path
  console.log(
    chalk.yellow(
      "❌ Bot Maker for Discord installation not found in common locations."
    )
  );
  const userPath = await promptForBMDPath();

  // Save the user-provided path to config for future use
  const updatedConfig = { ...config, bmdPath: userPath };
  saveConfig(updatedConfig);
  console.log(chalk.green("✓ BMD path saved to configuration for future use."));

  return userPath;
}

/**
 * Ensures the configuration folder exists, creating it if necessary
 */
function ensureConfigFolderExists() {
  if (!fs.existsSync(configFolder)) {
    fs.mkdirSync(configFolder, { recursive: true });
  }
}

/**
 * Saves configuration data to the config file
 *
 * @param {Object} config - Configuration object to save
 */
function saveConfig(config) {
  ensureConfigFolderExists();
  try {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  } catch (error) {
    console.warn(
      chalk.yellow(`Warning: Could not save config file: ${error.message}`)
    );
  }
}

/**
 * Loads configuration data from the config file
 *
 * @returns {Object} Configuration object, empty object if file doesn't exist
 */
function loadConfig() {
  if (!fs.existsSync(configFile)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(configFile, "utf-8"));
  } catch (error) {
    console.warn(
      chalk.yellow(`Warning: Could not load config file: ${error.message}`)
    );
    return {};
  }
}

/**
 * Converts a string to camelCase format
 * Handles spaces, hyphens, and underscores as word separators
 *
 * @param {string} str - The string to convert
 * @returns {string} The camelCase formatted string
 */
function toCamelCase(str) {
  return str
    .trim()
    .split(/[\s-_]+/) // Split by spaces, hyphens, or underscores
    .map((word, index) => {
      const lowerWord = word.toLowerCase();
      return index === 0
        ? lowerWord // First word stays lowercase
        : lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
    })
    .join("");
}

/**
 * Sanitizes a folder name by removing spaces and special characters
 *
 * @param {string} name - The name to sanitize
 * @returns {string} The sanitized folder name
 */
function sanitizeFolderName(name) {
  return name.replace(/\s+/g, "").replace(/[^\w-]/g, "");
}

/**
 * Prompts user for initial mod information
 *
 * @returns {Promise<Object>} Object containing mod name and type
 */
async function promptForInitialInfo() {
  return await inquirer.prompt([
    {
      name: "modName",
      type: "input",
      message: "What is your mod called?",
      default: "My Mod",
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return "Mod name is required!";
        }
        return true;
      },
    },
    {
      name: "modType",
      type: "list",
      message: "What type of mod is this?",
      choices: Object.keys(MOD_TYPES),
    },
  ]);
}

/**
 * Prompts user for detailed mod information
 *
 * @param {Object} initialAnswers - Initial answers containing mod type
 * @param {Object} config - Current configuration
 * @returns {Promise<Object>} Object containing detailed mod information
 */
async function promptForDetailedInfo(initialAnswers, config) {
  const questions = [
    {
      name: "modDescription",
      type: "input",
      message: "How would you describe your mod?",
      default: "Created with create-bmd",
    },
    {
      name: "modAuthor",
      type: "input",
      message: "Who is the author of this mod?",
      default: config.author || "Your Name",
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return "Author name is required!";
        }
        return true;
      },
    },
    {
      name: "modDonation",
      type: "input",
      message: "Where can users donate to support you? (Leave empty if none)",
      default: config.donation || "",
    },
  ];

  // Add category question for Action mods
  const modTypeConfig = MOD_TYPES[initialAnswers.modType];
  if (modTypeConfig.requiresCategory) {
    questions.unshift({
      name: "modCategory",
      type: "input",
      message: "What category does your action mod belong to?",
      default: modTypeConfig.defaultCategory,
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return "Category is required for Action mods!";
        }
        return true;
      },
    });
  }

  return await inquirer.prompt(questions);
}

/**
 * Reads and processes a template file with placeholder replacements
 *
 * @param {string} templatePath - Path to the template file
 * @param {Object} replacements - Object containing placeholder-value pairs
 * @returns {string} Processed template content
 */
function processTemplate(templatePath, replacements) {
  try {
    let content = fs.readFileSync(templatePath, "utf-8");

    // Replace placeholders in the format //placeholder//
    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(`//${placeholder}//`, "g");
      content = content.replace(regex, value || "");
    }

    return content;
  } catch (error) {
    throw new Error(
      `Failed to process template ${templatePath}: ${error.message}`
    );
  }
}

/**
 * Creates an Action mod
 *
 * @param {string} bmdPath - BMD installation path
 * @param {Object} modInfo - Mod information object
 */
function createActionMod(bmdPath, modInfo) {
  const fileName = `${toCamelCase(modInfo.modName)}_MOD.js`;
  const templatePath = path.join(__dirname, "templates", "Action.js");

  const content = processTemplate(templatePath, {
    name: modInfo.modName,
    author: modInfo.modAuthor,
    description: modInfo.modDescription,
    category: modInfo.modCategory,
    donation: modInfo.modDonation,
  });

  const outputPath = path.join(bmdPath, MOD_TYPES.Action.outputPath, fileName);
  fs.writeFileSync(outputPath, content);

  console.log(chalk.green(`✓ Action mod created: ${outputPath}`));
}

/**
 * Creates an Event mod
 *
 * @param {string} bmdPath - BMD installation path
 * @param {Object} modInfo - Mod information object
 */
function createEventMod(bmdPath, modInfo) {
  const fileName = `${toCamelCase(modInfo.modName)}_MOD.js`;
  const templatePath = path.join(__dirname, "templates", "Event.js");

  const content = processTemplate(templatePath, {
    name: modInfo.modName,
    author: modInfo.modAuthor,
    description: modInfo.modDescription,
    donation: modInfo.modDonation,
  });

  const outputPath = path.join(bmdPath, MOD_TYPES.Event.outputPath, fileName);
  fs.writeFileSync(outputPath, content);

  console.log(chalk.green(`✓ Event mod created: ${outputPath}`));
}

/**
 * Creates an Automation mod
 *
 * @param {string} bmdPath - BMD installation path
 * @param {Object} modInfo - Mod information object
 */
function createAutomationMod(bmdPath, modInfo) {
  const folderName = sanitizeFolderName(modInfo.modName);
  const outputPath = path.join(
    bmdPath,
    MOD_TYPES.Automation.outputPath,
    folderName
  );

  // Create the automation folder
  fs.mkdirSync(outputPath, { recursive: true });

  // Template files to process
  const templates = [
    { name: "data.json", template: "Automation/data.json" },
    { name: "main.js", template: "Automation/main.js" },
    { name: "startup.js", template: "Automation/startup.js" },
    { name: "startup_info.json", template: "Automation/startup_info.json" },
  ];

  const replacements = {
    name: modInfo.modName,
    author: modInfo.modAuthor,
    description: modInfo.modDescription,
    donation: modInfo.modDonation,
  };

  // Process and write each template
  templates.forEach(({ name, template }) => {
  const templatePath = path.join(__dirname, "templates", template);
    const content = processTemplate(templatePath, replacements);
    fs.writeFileSync(path.join(outputPath, name), content);
  });

  console.log(chalk.green(`✓ Automation mod created: ${outputPath}`));
}

/**
 * Creates a Theme mod
 *
 * @param {string} bmdPath - BMD installation path
 * @param {Object} modInfo - Mod information object
 */
function createThemeMod(bmdPath, modInfo) {
  const folderName = sanitizeFolderName(modInfo.modName);
  const outputPath = path.join(bmdPath, MOD_TYPES.Theme.outputPath, folderName);

  // Create the theme folder
  fs.mkdirSync(outputPath, { recursive: true });

  // Process data.json template
  const dataTemplate = path.join(__dirname, "templates", "Theme", "data.json");
  const dataContent = processTemplate(dataTemplate, {
    name: modInfo.modName,
    author: modInfo.modAuthor,
    description: modInfo.modDescription,
    donation: modInfo.modDonation,
  });

  // Copy theme.css template
  const cssTemplate = path.join(__dirname, "templates", "Theme", "theme.css");
  const cssContent = fs.readFileSync(cssTemplate, "utf-8");

  fs.writeFileSync(path.join(outputPath, "data.json"), dataContent);
  fs.writeFileSync(path.join(outputPath, "theme.css"), cssContent);

  console.log(chalk.green(`✓ Theme mod created: ${outputPath}`));
}

/**
 * Creates a Translation mod
 *
 * @param {string} bmdPath - BMD installation path
 * @param {Object} modInfo - Mod information object
 */
function createTranslationMod(bmdPath, modInfo) {
  const folderName = sanitizeFolderName(modInfo.modName);
  const outputPath = path.join(
    bmdPath,
    MOD_TYPES.Translation.outputPath,
    folderName
  );

  // Create the translation folder
  fs.mkdirSync(outputPath, { recursive: true });

  // Process data.json template
  const dataTemplate = path.join(__dirname, "templates", "Translation", "data.json");
  const dataContent = processTemplate(dataTemplate, {
    name: modInfo.modName,
    author: modInfo.modAuthor,
    description: modInfo.modDescription,
    donation: modInfo.modDonation,
  });

  // Copy strings.json template
  const stringsTemplate = path.join(__dirname, "templates", "Translation", "strings.json");
  const stringsContent = fs.readFileSync(stringsTemplate, "utf-8");

  fs.writeFileSync(path.join(outputPath, "data.json"), dataContent);
  fs.writeFileSync(path.join(outputPath, "strings.json"), stringsContent);

  console.log(chalk.green(`✓ Translation mod created: ${outputPath}`));
}

/**
 * Creates a mod based on the specified type
 *
 * @param {string} modType - The type of mod to create
 * @param {string} bmdPath - BMD installation path
 * @param {Object} modInfo - Complete mod information
 */
function createMod(modType, bmdPath, modInfo) {
  switch (modType) {
    case "Action":
      createActionMod(bmdPath, modInfo);
      break;
    case "Event":
      createEventMod(bmdPath, modInfo);
      break;
    case "Automation":
      createAutomationMod(bmdPath, modInfo);
      break;
    case "Theme":
      createThemeMod(bmdPath, modInfo);
      break;
    case "Translation":
      createTranslationMod(bmdPath, modInfo);
      break;
    default:
      throw new Error(`Unsupported mod type: ${modType}`);
  }
}

/**
 * Main application entry point
 */
async function main() {
  try {
    console.log(" ");

    // Ensure config folder exists
    ensureConfigFolderExists();

    // Load existing configuration
    const config = loadConfig();

    // Get initial mod information
    const initialAnswers = await promptForInitialInfo();

    // Get detailed mod information
    const detailedAnswers = await promptForDetailedInfo(initialAnswers, config);

    // Combine all answers
    const modInfo = {
      ...initialAnswers,
      ...detailedAnswers,
    };

    // Update and save configuration
    const updatedConfig = {
      ...config,
      author: modInfo.modAuthor,
      donation: modInfo.modDonation,
    };
    saveConfig(updatedConfig);

    // Find BMD installation
    const bmdPath = findBMDInstallation();
    if (!bmdPath) {
      console.error(
        chalk.red("❌ Bot Maker for Discord installation not found!")
      );
      console.log(
        chalk.yellow("📁 Please install Bot Maker for Discord from Steam or")
      );
      console.log(
        chalk.yellow(
          "   manually set the installation path in the config file."
        )
      );
      console.log(chalk.gray(`   Config location: ${configFile}`));
      return;
    }

    // Create the mod
    console.log(
      chalk.blue(`\n🔨 Creating ${modInfo.modType} mod: "${modInfo.modName}"`)
    );
    createMod(modInfo.modType, bmdPath, modInfo);

    console.log(chalk.green.bold("\n✅ Mod creation completed successfully!"));
    console.log(
      chalk.gray("Your mod is now ready to use in Bot Maker for Discord.")
    );
  } catch (error) {
    // Handle user cancellation
    if (error.name === "ExitPromptError") {
      console.log(chalk.yellow("\n❌ Operation cancelled by user"));
      process.exit(0);
    }

    // Handle other errors
    console.error(chalk.red.bold("\n💥 An error occurred:"));
    console.error(chalk.red(error.message));

    if (process.env.NODE_ENV === "development") {
      console.error(chalk.gray("\nStack trace:"));
      console.error(chalk.gray(error.stack));
    }

    process.exit(1);
  }
}

// Run the application
main();
