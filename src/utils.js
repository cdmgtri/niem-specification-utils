
let fs = require("fs-extra");
let json2csv = require("json2csv");
let path = require("path");
let trash = require("trash");
let xmlConverter = require("xml-js");
let yaml = require("yamljs");

/**
 * General utility functions to support the project.
 */
class Utils {

  /**
   * Formats text to remove leading, trailing, and double spaces.
   */
   static formatText(text) {
    return text
    .trim()
    .replace(/  /g, " ")
    .replace(/^xs(:)(?=\w)/, ": ");
  }

  /**
   * Flattens an array of arrays
   * @template T
   * @param {T[][]} arrays - An array of arrays
   * @returns {T[]}
   */
  static flatten(arrays) {
    return [].concat.apply([], arrays);
  }

  /**
   * Saves given data as JSON and YAML to the default or given output directory.
   * Also constructs the file name from the given fields.
   *
   * @param {"all"|"suite"|"spec"} scope
   * @param {"rules"|"defs"|"suites"|"specs"|"targets"} style
   * @param {string} [label] - Suite ID or tag, e.g,. "NDR" or "IEPD"
   * @param {String} [version]
   */
  static nameFile(scope, style, label, version) {

    if (scope == "all") {
      return `niem-${style}`.toLowerCase();
    }
    else if (scope == "suite") {
      return `${label.replace("MPD", "IEPD")}-${style}`.toLowerCase();
    }
    else if (scope == "spec") {
      return `${label}-${style}-${version}`.toLowerCase();
    }

    console.log("Given scope not supported:", scope);
    return;

  }

  /**
   * Saves given data as JSON and YAML to the default or given output directory.
   * Also constructs the file name from the given fields.
   *
   * @param {"all"|"suite"|"spec"} scope
   * @param {"rules"|"defs"|"targets"|"suites"|"specs"} style
   * @param {string} label - Suite ID or tag, e.g., "NDR" or "IEPD"
   * @param {String} version
   */
  static nameFileAndSave(scope, style, label, version, data, folder="./output/") {
    let fileName = Utils.nameFile(scope, style, label, version);
    return Utils.save(fileName, data, folder, style);
  }

  /**
   * Reads the specification html file in the specifications directory with the given tag and version
   */
  static readSpecificationHTMLText(tag, version) {
    let filePath = path.resolve(__dirname, `../specifications/${tag}-${version}.html`);
    try {
      let html = fs.readFileSync(filePath, {encoding: "utf8"});
      return html;
    }
    catch {
    }
  }

  /**
   * Reads in a YAML file at the given path and returns the data as an object.
   *
   * @param {String} filePath
   * @returns {Object}
   */
  static readYAML(filePath) {
    let normalizedPath = path.join(__dirname, filePath);
    let text = fs.readFileSync(normalizedPath, "utf-8");
    return yaml.parse(text);
  }

  /**
   * Saves given data as JSON and YAML to the default or given output directory.
   *
   * @param {String} fileName - Base file name, no extension or path
   * @param {Object} data - Data to save
   * @param {String} [folder='./output/'] - Folder to save output files.  Defaults to /output.
   * @param {"rules"|"defs"|"targets"|"suites"|"specs"} [style] - Used to generate additional XML tags to wrap the data
   */
  static save(fileName, data, folder="./output/", style) {

    let originalJSON = JSON.stringify(data);
    let convertedData = JSON.parse(originalJSON);

    // Create custom subfolders for each export format
    let subfolder = (extension) => path.join(folder, extension, fileName.toLowerCase() + "." + extension);

    // Save JSON
    fs.outputJSONSync( subfolder("json"), data, {spaces: 2} );

    // Save YAML (library isn't calling toJSON on stringify so do it manually)
    fs.outputFileSync( subfolder("yaml"), yaml.stringify(convertedData) );

    // Save XML
    let xmlData = convertObjectToXML(data, style);
    fs.outputFileSync( subfolder("xml"), xmlData );

    // Save CSV
    if (convertedData.length > 0) {
      let csvData = json2csv.parse(convertedData);
      fs.outputFileSync( subfolder("csv"), csvData );
    }

  }

  /**
   * Sends files in the given folder to the OS-specific recycle bin.
   */
  static async trash(folder) {
    let normalizedPath = path.resolve(__dirname, folder);
    return trash(normalizedPath);
  }

}

/**
 * Converts an array of objects to an XML string.
 * Wraps the array with a root element and adds tags for each element of the array.
 *
 * @private
 * @param {Array<Object>} dataArray
 * @param {String} rootTag - Word (plural form) to use as the root tag for the XML document
 */
function convertObjectToXML(dataArray, rootTag) {

  let xmlObject = {};

  // Adjust tag name
  if (rootTag == "suites") rootTag = "suites";
  if (rootTag == "specs" ) rootTag = "specifications";
  if (rootTag == "defs") rootTag = "definitions";

  // Root-level tag for the XML
  xmlObject[rootTag] = {};

  // Generate a tag name to use for the anonymous array elements
  let elementTag = rootTag.replace(/s$/, "");
  xmlObject[rootTag][elementTag] = dataArray;

  // Convert XML-formatted object to an XML string
  let json = JSON.stringify(xmlObject);
  let xmlText = xmlConverter.json2xml(json, {compact: true, spaces: 2});

  return `<?xml version="1.0" encoding="UTF-8"?>\n` + xmlText;

}

module.exports = Utils;
