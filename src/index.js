
let cheerio = require("cheerio");
let debug = require("debug")("niem");

/** @type {CheerioStatic} */
let $;

let { NIEMRule, NIEMDefinition, NIEMSection } = require("./assets/typedefs/index");

class NIEMSpec {

  /**
   * @param {string} version - The version of the specification.
   * @param {string} html - The HTML text of the specification.
   */
  constructor(version, html="") {

    this.version = version;

    this.html = this.format(html);
    loadHTMLProcessor(html);

    this.rules = this.generateRules();
    this.defs = this.generateDefinitions();

    this.handleExceptions();
  }

  static url(version) {
    return "";
  }

  /**
   * Get the URL for the rendered-HTML version of this specification.
   * @abstract
   */
  get url() {
    return this.constructor.url(this.version);
  }

  /**
   * Return true if this version of the specification is the latest stable version.
   * @abstract
   */
  get current() {
    return false;
  }

  /**
   * Return an array of NIEM release numbers to which this specification may apply.
   * @abstract
   */
  get niem() {
    return [];
  }

  static ruleURL(version, number) {
    return undefined;
  }

  /**
   * @param {String} number - Rule number ("4-1")
   */
  ruleURL(number) {
    return this.constructor.ruleURL(this.version, number);
  }

  static defURL(version, number) {
    return undefined;
  }

  /**
   * @param {String} term - Definition term ("application information")
   */
  defURL(term) {
    return this.constructor.defURL(this.version, term);
  }

  /**
   * Cleans up and reformats the specification HTML as needed for processing.
   * @abstract
   * @param {string} html
   * @returns {string} - Reformatted HTML
   */
  format(html) {
    return this.cleanUp(html);
  }

  /**
   * Generates the JSON rules file from the specification HTML.
   * @returns {NIEMRule[]}
   */
  generateRules() {

    /** @type {NIEMRule[]} */
    let rules = [];

    let specification = this.specificationData;

    debug("\nLoading %s %s rules", this.constructor.name, this.version);

    // Process each div with class="rule-section"
    $("div .rule-section").each( (index, ruleSectionNode) => {

      /** @type {NIEMRule} */
      let rule = {};

      // Define basic specification information for the rule
      rule.specification = specification;
      rule.section = getSection(ruleSectionNode, this.url);

      processRuleHeading(rule, ruleSectionNode, this.url);
      processRuleLabel(rule, ruleSectionNode);
      processRuleDescription(rule, ruleSectionNode);

      rules.push(rule);
      debug("%s %s %s %s %s", index, this.version, rule.id, rule.name, rule.title);
    });

    return rules;
  }

  /**
   * Generates the JSON rules file from the specification HTML.
   * @returns {NIEMDefinition[]}
   */
  generateDefinitions() {

    /** @type {NIEMDefinition[]} */
    let defs = [];

    let specification = this.specificationData;

    debug("\nLoading %s %s definitions", this.constructor.name, this.version);

    // Process each div with class="rule-section"
    $("a[name*='definition_']").each( (index, defIDNode) => {

      /** @type {NIEMDefinition} */
      let def = {};

      // Define basic information for the rule
      def.specification = specification;
      def.id = defIDNode.attribs["name"];
      def.link = this.url + "#" + def.id;
      def.section = getSection(defIDNode, this.url);
      def.term = "";

      // Parse the definition term and descriptive text
      let defNormativeNode = $(defIDNode).closest(".normativeHead");
      let defPNode = $(defIDNode).closest("p");

      if (defNormativeNode.length > 0) {
        // Definition style 1 (div.normativeHead)
        def.term = parseDefinitionTerm(defNormativeNode);
        def.text = defNormativeNode.next().text();
      }
      else if (defPNode.length) {
        // Definition style 2 (paragraph)
        def.term = parseDefinitionTerm(defPNode);
        def.text = defPNode.text();
      }
      else {
        //  Definition style 3 (li)
        let defLiNode = $(defIDNode).closest("li");
        def.term = parseDefinitionTerm(defLiNode);
        def.text = defLiNode.text().split(": ")[1];

        if (! def.text) {
          def.text = defLiNode.text();
        }
      }

      defs.push(def);
      debug("%s %s %s %s %s", index, this.version, def.id, def.name, def.title);
    });

    // Sort definitions by term
    defs = defs.sort( (a, b) => ( a.term.toLowerCase() < b.term.toLowerCase() ) ? -1 : 1 );

    return defs;
  }

  /**
   * Handles inconsistencies in rules and definitions.
   * @abstract
   */
  handleExceptions() {
  }

  /**
   * Cleans up the XML for processing
   *
   * @param {string} xml
   * @returns {string}
   */
  cleanUp(xml) {

    // Replace escaped characters
    xml = xml.replace(/&lt;/g, "<");
    xml = xml.replace(/&gt;/g, ">");

    // Add a newline between tags
    // xml = xml.replace(/></g, ">\n<");

    // Remove the HTML doctype header
    xml = xml.replace(/<!DOCTYPE .*>/, "");

    // Close the meta tag
    xml = xml.replace(/<meta ([^>]*)>/, "<meta $1/>");

    // Remove contents from image tags and close (unneeded)
    xml = xml.replace(/<img src=[^>]*>/g, "<img/>");

    return xml;
  }

  /**
   * Generates and returns an array of rules for the given version.
   *
   * @static
   * @param {string} version
   * @returns {NIEMRule[]}
   */
  static generateRules(version) {
    let fs = require("fs-extra");
    let path = require("path");

    // Load the specification HTML text
    let filePath = path.join(__dirname, `./assets/specifications/${this.fileNameRoot}-${version}.html`);

    let html = fs.readFileSync(filePath, {encoding: "utf8"});

    let spec = new this(version, html);
    return spec.rules;
  }

  /**
   * Generates rule files for all available specification versions.
   * @static
   * @param {NIEMSpec} spec
   * @param {string[]} versions
   * @returns {NIEMRule[]}
   */
  static generateAllRules() {

    /** @type {NIEMRule[][]} */
    let allRules = [];

    debug(`\nCompiling ${this.name} rules into single rules file.`);

    this.versions.forEach( version => {
      let rules = this.generateRules(version);
      allRules.push( ...rules );
    });

    return allRules;
  }

  /**
   * Generates and returns an array of definitions for the given version.
   *
   * @static
   * @param {string} version
   * @returns {NIEMDefinition[]}
   */
  static generateDefinitions(version) {
    let fs = require("fs-extra");
    let path = require("path");

    // Load the specification HTML text
    let filePath = path.join(__dirname, `./assets/specifications/${this.fileNameRoot}-${version}.html`);

    let html = fs.readFileSync(filePath, {encoding: "utf8"});

    let spec = new this(version, html);
    return spec.defs;
  }

  /**
   * Generates def files for all available specification versions.
   * @static
   * @param {NIEMSpec} spec
   * @param {string[]} versions
   * @returns {NIEMDefinition[]}
   */
  static generateAllDefinitions() {

    /** @type {NIEMDefinition[][]} */
    let allDefs = [];

    debug(`\nCompiling ${this.name} defs into single defs file.`);

    this.versions.forEach( version => {
      let defs = this.generateDefinitions(version);
      allDefs.push( ...defs );
    });

    return allDefs;
  }

}

/** @type {string[]} */
NIEMSpec.versions = [];

NIEMSpec.fileNameRoot = "";

module.exports = NIEMSpec;

/**
 * Loads the cheerio HTML processor ($).
 * @param {string} html
 */
function loadHTMLProcessor(html) {

  $ = cheerio.load(html, {
    normalizeWhitespace: true,
    xmlMode: true,
    decodeEntities: true,
    recognizeSelfClosing: true,
    ignoreWhitespace: true
  });

}

/**
 * Parses a node for the definition term inside the <dfn></dfn> tags.
 *
 * @param {CheerioElement} parentNode
 * @returns {string}
 */
function parseDefinitionTerm(parentNode) {
  let defNode = $(parentNode).find("dfn");
  return defNode.text();
}

/**
 * Sets basic rule fields.
 * Parses the rule id, name, and title, if available.
 *
 * @param {NIEMRule} rule
 * @param {CheerioElement} ruleSectionNode
 * @param {string} baseURL
 */
function processRuleHeading(rule, ruleSectionNode, baseURL) {

  // Parse the rule title
  let title = $(ruleSectionNode).find("div .heading").text();
  rule.number = title.split(". ")[0].replace("Rule ", "");
  rule.title = title.split(". ")[1];

  let ruleNameNodes = $(ruleSectionNode).find(".heading a[name]");

  // Parse the rule id and name
  ruleNameNodes.each( (i, ruleNameNode) => {

    let val = ruleNameNode.attribs["name"];

    // Not all rules have names.  Set default value.
    rule.name = "";

    if (val.startsWith("rule_")) {
      // Example: rule_9-1
      rule.id = val;
    }
    else if (val.startsWith("rule-")) {
      // Example: rule-base-type-not-xml-ns
      rule.name = val || "";
    }
  });

  rule.link = baseURL + "#" + rule.id;
}

/**
 * Sets the rule applicability and classification fields.
 *
 * @param {NIEMRule} rule
 * @param {CheerioElement} ruleSectionNode
 */
function processRuleLabel(rule, ruleSectionNode) {

  // Example: [Rule 9-1] (REF, EXT) (Constraint)
  let label = $(ruleSectionNode).find(".normativeHead").text();

  rule.applicability = parseApplicability(label);
  rule.classification = parseClassification(label);
}

/**
 * Parses the rule label for the rule applicability array.
 *
 * @param {string} label - Example: "[Rule 4-3] (REF, EXT) (Constraint)"
 * @returns {string[]}
 */
function parseApplicability(label) {
  let re = /] \(([^)]*)\)/;
  let applicabilityString = label.match(re)[1];
  return applicabilityString.split(", ");
}

/**
 * Parses the rule label for the rule classification string.
 *
 * @param {string} label
 * @returns {string}
 */
function parseClassification(label) {
  if (label.includes("(Constraint)")) {
    return "Constraint";
  }
  else if (label.includes("(Interpretation)")) {
    return "Interpretation";
  }
  return "";
}

/**
 * Sets the rule description field from text that may precede the rule box.
 *
 * @param {NIEMRule} rule
 * @param {CheerioElement} ruleSectionNode
 */
function processRuleDescription(rule, ruleSectionNode) {

  let ruleBoxNode = $(ruleSectionNode).find(".box");

  rule.pre = $(ruleBoxNode).prev("p").text();
  rule.post = $(ruleBoxNode).next("p").text();


  let ruleTextNode = $(ruleBoxNode).find("p");
  let ruleSchematronNode = $(ruleBoxNode).find("pre");

  if ( ruleTextNode.length > 0 ) {
    rule.style = "text";
    rule.text = $(ruleBoxNode).find("> p").text();
  }
  else {
    rule.style = "schematron";
    rule.schematron = ruleSchematronNode.text().replace("\n", " ");

    // Capture the text between the <sch:assert> or <sch:report> tags
    let re = /(?:assert|report)[^>]*>([^<]*)</;
    let matches = re.exec(rule.schematron);
    rule.text = matches[1];
  }

}

/**
 * Sets the information about the section that the rule or definition appears under.
 *
 * @param {CheerioElement} childNode
 * @param {String} baseURL
 */
function getSection(childNode, baseURL) {

  let sectionNode = $(childNode).closest(".section");
  let sectionHeadingNode = $(sectionNode).find("> .heading");

  /** @type {NIEMSection} */
  let section = {
    name: sectionHeadingNode.text()
  }

  // Set the section ID
  $(sectionHeadingNode)
    .find("a")
    .each( (i, aNode) => {
      let name = aNode.attribs["name"];
      if (name.startsWith("section_")) {
        section.id = name;
      }
    });

  // Set the section link
  section.link = baseURL + "#" + section.id;

  return section;
}
