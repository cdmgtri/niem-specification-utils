
let utils = require("./utils");
let Parser = require("./parser");
let { parseSpecification } = Parser;

class Specification {

  /**
   * @param {Suite} suite - The series or suite that this versioned specification is a member of
   * @param {String} version - Version number (e.g., "3.0")
   * @param {String} url - URL for reading the spec
   * @param {String} year - Year the spec was published
   * @param {String} applicableReleases - NIEM releases for which this spec applies
   * @param {String} changeHistory - URL for a description of changes since the last version
   * @param {String} resources - URL to view or download additional resources for this spec
   * @param {String} examples - URL to view examples associated with this spec
   * @param {"current"|"draft"|"archived"|""} status - current, draft, archived, or blank for a previous version
   * @param {String} html - The HTML text of the specification.
   */
  constructor(suite, version="", url="", year="", applicableReleases="", changeHistory, resources="", examples="", status="", html="") {

    this.suite = suite;
    this.version = version;
    this.url = url;
    this.year = year;
    this.applicableReleases = applicableReleases;
    this.changeHistory = changeHistory;
    this.resources = resources;
    this.examples = examples;
    this.status = status;
    this.html = html;

    /** @type {Rule[]} */
    this.rules = [];

    /** @type {Definition[]} */
    this.defs = [];

    /** @type {Target[]} */
    this.targets = [];

    // Apply any needed specification-specific adjustments to the HTML text and parse
    parseSpecification(this);

  }

  /**
   * Specification tag and version
   * @example "NDR-4.0"
   */
  get id() {
    return this.customID + "-" + this.version.replace("release candidate ", "rc");
  }

  /**
   * Replaces the id with a valid string to use for a CSS selector.
   */
  get selector() {
    return this.id.replace(/\./g, "_").replace(/ /g, "");
  }

  /**
   * The standard name for this specific version of the specification.
   * Adds support for the legacy "MPD" name.
   */
  get name() {
    if (!this.suite) return "";

    if (this.suite.id == "IEPD" && this.version.startsWith("3.0")) {
      return "Model Package Description";
    }
    return this.suite.name;
  }

  /**
   * Gets the identifier for the suite this specification belongs to (e.g., "NDR", "IEPD")
   */
  get suiteID() {
    return this.suite.id;
  }

  /**
   * The standard abbreviation for this specific version of the specification.
   * Adds support for the legacy "MPD" abbreviation.
   */
  get customID() {
    if (!this.suite) return;

    if (this.suiteID == "IEPD" && this.version.startsWith("3.0")) {
      return "MPD";
    }
    return this.suiteID;
  }

  /**
   * Gets the rule with the given rule number
   * @param {string} ruleNumber
   */
  rule(ruleNumber) {
    return this.rules.find( rule => rule.number == ruleNumber );
  }

  /**
   * Gets the url of the rule with the given rule number
   * @param {string} ruleNumber
   */
  ruleURL(ruleNumber) {
    let rule = this.rule(ruleNumber);
    return rule.url;
  }

  /**
   * Cleans up and reformats the specification HTML as needed for processing.
   * Specification-specific.
   *
   * @abstract
   * @param {string} html
   * @returns {string} - Reformatted HTML
   */
  preProcessHTML(html) {
    return html;
  }

  /**
   * Handles inconsistencies in rules or definitions.  Specification-specific.
   * @abstract
   */
  postProcessData() {
  }

  /**
   * Saves all rules and definitions for the specification (e.g., `ndr-rules-3.0.json`).
   *
   * @param {String} [folder] - Save to the given or default folder
   */
  save(folder) {
    utils.nameFileAndSave("spec", "rules", this.customID, this.version, this.rules, folder);
    utils.nameFileAndSave("spec", "defs", this.customID, this.version, this.defs, folder);
  }

  toJSON() {
    return {
      id: this.id,
      suiteID: this.suite.id,
      suiteName: this.suite.name,
      suiteRepo: this.suite.repo,
      suiteLandingPage: this.suite.landingPage,
      suiteIssueTracker: this.suite.issueTracker,
      suiteDescription: this.suite.description,
      specID: this.id,
      specCustomID: this.customID,
      specName: this.name,
      specVersion: this.version,
      specURL: this.url,
      specYear: this.year.toString(),
      specApplicableReleases: this.applicableReleases,
      specChangeHistory: this.changeHistory,
      specResources: this.resources,
      specExamples: this.examples,
      specStatus: this.status,
      specRuleCount: this.rules.length,
      specDefinitionCount: this.defs.length,
      specSelector: this.selector,
      specTargetCount: this.targets.length
    }
  }

}

let Rule = require("./rule");
let Definition = require("./definition");
let Target = require("./target");
let Suite = require("./suite");

module.exports = Specification;
