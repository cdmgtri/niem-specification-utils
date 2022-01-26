
let utils = require("./utils");

let Suite = require("./suite");
let Specification = require("./specification");
let Target = require("./target");
let Rule = require("./rule");
let Definition = require("./definition");
let Section = require("./section");

/**
 * Information about the set of NIEM specifications.
 */
class NIEMSpecificationLibrary {

  constructor() {

    this.suitesObject = {
      NDR: new Suite(),
      IEPD: new Suite(),
      CodeLists: new Suite(),
      Conformance: new Suite(),
      CTAS: new Suite(),
      JSON: new Suite(),
      HLVA: new Suite()
    }

  }

  /**
   * Loads metadata about specification suites and individual versioned specifications
   * from the information in the `/data` directory.
   *
   * @param {boolean} [parseHTML=false]
   */
  load(parseHTML=false) {
    this.loadSuiteMetadata(parseHTML);
    this.loadSpecificationMetadata(parseHTML);
    this.loadTargets(parseHTML);
  }

  /**
   * Loads metadata about specification suites from `/data/suites.yaml`.
   *
   * @param {boolean} [parseHTML=false]
   */
  loadSuiteMetadata(parseHTML=false) {

    let metadata = require("../output/json/niem-suites.json");

    if (parseHTML) {
      // Load metadata from data files
      // @ts-ignore
      metadata = utils.readYAML("../data/suites.yaml");
    }

    metadata.forEach( entry => {

      // @ts-ignore
      this.suitesObject[entry.id] = new Suite(entry.id, entry.name, entry.repo, entry.landingPage, entry.issueTracker, entry.tutorial, entry.changeHistory, entry.description, entry.note);

    });

  }

  /**
   * Loads metadata about specifications from `/data/specifications.yaml`.
   *
   * @param {boolean} [parseHTML=false]
   */
  loadSpecificationMetadata(parseHTML=false) {

    let metadata = require("../output/json/niem-specs.json");

    if (parseHTML) {
      // @ts-ignore
      metadata = utils.readYAML("../data/specifications.yaml");
    }

    metadata.forEach( entry => {

      // Get the text from the HTML specification
      let html = parseHTML ? utils.readSpecificationHTMLText(entry.suiteID, entry.specVersion) : "";

      // Find the corresponding suite for this specification
      let suite = this.suitesObject[entry.suiteID];

      // Create the new specification from the metadata
      let SpecializedSpecificationConstructor = this.specificationConstructors[entry.suiteID];

      /** @type {Specification} */
      let specification = new SpecializedSpecificationConstructor(suite, entry.specVersion, entry.specURL, entry.specYear, entry.specApplicableReleases, entry.specChangeHistory, entry.specResources, entry.specExamples, entry.specStatus, html);


      // Add the specification to its series
      suite.specifications.push(specification);

    });

    // Load pre-parsed rules and definitions
    if (!parseHTML) {
      this.loadParsedRulesDefs();
    }

  }

  loadParsedRulesDefs() {

    let ruleData = require("../output/json/niem-rules.json");

    for (let entry of ruleData) {
      let spec = this.specification(entry.specificationID);
      let section = new Section(spec, entry.sectionID, entry.sectionLabel);

      // @ts-ignore
      let rule = new Rule(spec, section, entry.ruleNumber, entry.ruleTitle, entry.ruleName, entry.ruleTargets, entry.ruleClassification, entry.ruleStyle, entry.ruleText, "");

      spec.rules.push(rule);
    }

    let definitionData = require("../output/json/niem-defs.json");

    for (let entry of definitionData) {
      let spec = this.specification(entry.specificationID);
      let section = new Section(spec, entry.sectionID, entry.sectionLabel);

      let def = new Definition(spec, section, entry.definitionID, entry.definitionTerm, entry.definitionText, entry.definitionLocal);

      spec.defs.push(def);
    }

  }

  /**
   * Loads metadata about targets from `/data/targets.yaml`.
   *
   * Default targets are defined for a suite but can be overridden by a specific
   * version of a specification when it differs from the default.
   *
   * @param {boolean} [parseHTML=false]
   */
  loadTargets(parseHTML=false) {

    let metadata = require("../output/json/niem-targets.json");

    if (parseHTML) {
      // @ts-ignore
      metadata = utils.readYAML("../data/targets.yaml");
    }

    for (let entry of metadata) {

      // @ts-ignore
      let definitionFragment = entry.targetDefinitionFragment || entry?.targetURL.split("#")[1];
      let target = new Target( null, entry.targetCode, entry.targetName, definitionFragment, entry.targetDescription, entry.targetTutorial);

      if (parseHTML && entry.suiteID) {
        // Add suite-default targets to specifications that do not override the defaults
        let specs = this.suite(entry.suiteID).specifications;
        for (let spec of specs) {
          // Add target to spec if that spec does not override the suite defaults
          if (!metadata.some( entry => entry.specificationID == spec.id )) {
            // Make sure to create a separate target object per spec
            let specTarget = Object.assign(new Target(), target);
            specTarget.specification = spec;
            spec.targets.push(specTarget);
          }
        }
      }
      else {
        // Add specification-specific target
        let spec = this.specification(entry.specificationID);
        target.specification = spec;
        spec.targets.push(target);
      }

    }

  }

  get rules() {
    return utils.flatten(this.suites.map( suite => suite.rules ));
  }

  get definitions() {
    return utils.flatten(this.suites.map( suite => suite.defs ));
  }

  get targets() {
    return utils.flatten(this.suites.map( suite => suite.targets ));
  }

  /**
   * Saves rules and definitions for all NIEM specifications together (e.g,. `niem-rules.json`).
   * Also calls each suite individually to save its rules and defs.
   *
   * @param {String} [folder] - Saves to the given or default folder.
   */
  save(folder) {
    // Save all metadata about specifications and their suites
    utils.nameFileAndSave("all", "suites", null, null, this.suites, folder);
    utils.nameFileAndSave("all", "specs", null, null, this.specifications, folder);

    // Save all NIEM rules, definitions, and targets
    utils.nameFileAndSave("all", "rules", null, null, this.rules, folder);
    utils.nameFileAndSave("all", "defs", null, null, this.definitions, folder);
    utils.nameFileAndSave("all", "targets", null, null, this.targets, folder);

    // Save each set of rules and definitions
    this.suites.forEach( suite => suite.save(folder) );
  }

  /**
   * Returns the specification with the given ID.
   * @example "NDR-3.0"
   * @param {String} specificationID
   */
  specification(specificationID) {

    if (!specificationID.includes("-")) return;

    // Parse the specification tag and version from the specification ID
    let [suiteID, versionID] = specificationID.split("-");

    // Adjust the specification suite ID for MPDs.
    suiteID = suiteID.replace("MPD", "IEPD");

    return this.suite(suiteID)?.version(versionID);

  }

  get specificationConstructors() {

    let NDR = require("./specification-ndr");
    let IEPD = require("./specification-iepd");
    let CodeLists = require("./specification-code-lists");
    let Conformance = require("./specification-conformance");
    let CTAS = require("./specification-ctas");
    let JSON = require("./specification-json");
    let HLVA = require("./specification-hlva");

    return {NDR, IEPD, CodeLists, Conformance, CTAS, JSON, HLVA};
  }

  /**
   * @param {string} suiteID
   * @returns {Suite}
   */
  suite(suiteID) {
    return this.suitesObject[suiteID];
  }

  /**
   * All specification suites
   */
  get suites() {
    return Object.values(this.suitesObject);
  }

  /**
   * All specifications from all specification suites
   */
  get specifications() {
    return utils.flatten( this.suites.map( suite => suite.specifications ) );
  }

  /**
   * Returns the URL for the rule with the given suite ID, version ID, and rule number
   */
  ruleURL(suiteID, versionID, ruleNumber) {
    return this.suite(suiteID)?.version(versionID)?.ruleURL(ruleNumber);
  }

  /**
   * Loads and parses NIEM specifications, and saves rules and definitions.
   *
   * @param {String} [folder='./output/'] - Folder to save output files.  Defaults to /output.
   * @param {boolean} [parseHTML=false]
   */
  static parse(folder="./output/", parseHTML=false) {
    let specsLib = new NIEMSpecificationLibrary();
    specsLib.load(parseHTML);
    specsLib.save(folder);
    return specsLib;
  }

}

module.exports = NIEMSpecificationLibrary;
