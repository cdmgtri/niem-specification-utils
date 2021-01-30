
let cheerio = require("cheerio");
let debug = require("debug")("niem");

let Rule = require("./rule");
let Section = require("./section");
let Definition = require("./definition");
let utils = require("./utils");

/** @type {CheerioStatic} */
let $;

class Parser {

  /**
   * @param {Specification} spec
   */
  constructor(spec) {

    this.spec = spec;

    // Clean up tags and then run specification-specific formatting adjustments
    let html = this.cleanUp(spec.html);
    this.html = spec.format(html);

    $ = cheerio.load(this.html, {
      normalizeWhitespace: true,
      xmlMode: true,
      decodeEntities: true,
      recognizeSelfClosing: true,
      ignoreWhitespace: true
    });

  }

  /**
   * Parse rules and definitions from a NIEM specification html file
   */
  parseHTML() {

    this.parseRules();
    this.parseDefinitions();

    // Apply any necessary special fixes
    this.spec.processExceptions();

    console.log(`${this.spec.id} (${this.spec.rules.length} rules, ${this.spec.defs.length} defs)`);

  }

  /**
   * Parses rules from the specification HTML.
   */
  parseRules() {

    debug("\nLoading %s rules", this.spec.id);

    // Process each div with class="rule-section"
    $("div .rule-section").each( (index, ruleSectionNode) => {

      let section = this.parseSection(ruleSectionNode);

      let rule = new Rule(this.spec, section);

      this.parseRuleHeading(rule, ruleSectionNode);
      this.parseRuleLabel(rule, ruleSectionNode);
      this.parseRuleDescription(rule, ruleSectionNode);

      this.spec.rules.push(rule);
      debug("%s %s %s %s %s", index, this.spec.id, rule.id, rule.title, rule.title);

    });

  }


  /**
   * Generates the JSON rules file from the specification HTML.
   * @returns {Definition[]}
   */
  parseDefinitions() {

    debug("\nLoading %s definitions", this.spec.id);

    // Process each div with class="rule-section"
    $("a[name*='definition_']").each( (index, defIDNode) => {

      let section = this.parseSection(defIDNode);

      let def = new Definition(this.spec, section);
      def.isLocal = false;

      // def.id = defIDNode.attribs["name"];

      // Parse the definition term and descriptive text
      let defNormativeNode = $(defIDNode).closest(".normativeHead");
      let defPNode = $(defIDNode).closest("p");

      if (defNormativeNode.length > 0) {
        // Definition style 1 (div.normativeHead)
        def.term = this.parseDefinitionTerm(defNormativeNode);
        def.text = defNormativeNode.next().text();
        def.isLocal = true;
      }
      else if (defPNode.length) {
        // Definition style 2 (paragraph)
        def.term = this.parseDefinitionTerm(defPNode);
        def.text = defPNode.text();
      }
      else {
        //  Definition style 3 (li)
        let defLiNode = $(defIDNode).closest("li");
        def.term = this.parseDefinitionTerm(defLiNode);
        def.text = defLiNode.text().split(": ")[1];

        if (! def.text) {
          def.text = defLiNode.text();
        }
      }

      // Check for a following blockquote
      if (def.text.endsWith(":")) {
        def.text += " " + $(defPNode).next("blockquote").text();
      }

      this.spec.defs.push(def);
      debug("%s %s %s %s %s", index, this.spec.id, def.id, def.name, def.title);
    });

    // Sort definitions by term
    this.spec.defs = this.spec.defs.sort( (a, b) => ( a.term.toLowerCase() < b.term.toLowerCase() ) ? -1 : 1 );

  }


  /**
   * Parses a node for the definition term inside the <dfn></dfn> tags.
   *
   * @param {CheerioElement} parentNode
   * @returns {string}
   */
  parseDefinitionTerm(parentNode) {
    let defNode = $(parentNode).find("dfn");
    return defNode.text();
  }

  /**
   * Given a node, converts the <li> elements to a string delimited by " \n- "
   * @param {CheerioElement} node
   */
  appendListString(node, object) {
    let separator = " \n- ";
    let listText = $(node).find("li").map( (i, li) => $(li).text() ).get().join(separator);

    if (listText) {
      object["text"] += separator + listText;
    }
  }

  /**
   * Sets basic rule fields.
   * Parses the rule id, name, and title, if available.
   *
   * @param {Rule} rule
   * @param {CheerioElement} ruleSectionNode
   */
  parseRuleHeading(rule, ruleSectionNode) {

    // Parse the rule title
    let title = $(ruleSectionNode).find("div .heading").text();
    rule.number = title.split(". ")[0].replace("Rule ", "");
    rule.title = title.split(". ")[1];

    let ruleNameNodes = $(ruleSectionNode).find(".heading a[name]");

    // Parse the rule id and name
    ruleNameNodes.each( (i, ruleNameNode) => {

      let val = ruleNameNode.attribs["name"];

      // Not all rules have names.  Set default value.
      // rule.name = "";

      if (val.startsWith("rule_")) {
        // Example: rule_9-1
        // rule.ruleID = val;
      }
      else if (val.startsWith("rule-")) {
        // Example: rule-base-type-not-xml-ns
        rule.name = val || "";
      }
    });

  }

  /**
   * Sets the rule applicability and classification fields.
   *
   * @param {Rule} rule
   * @param {CheerioElement} ruleSectionNode
   */
  parseRuleLabel(rule, ruleSectionNode) {

    // Example: [Rule 9-1] (REF, EXT) (Constraint)
    let label = $(ruleSectionNode).find(".normativeHead").text();

    rule.targets = this.parseRuleTargets(label);
    rule.classification = this.parseRuleClassification(label);
  }

  /**
   * Parses the rule label for the rule applicable conformance targets array.
   *
   * @param {string} label - Example: "[Rule 4-3] (REF, EXT) (Constraint)"
   * @returns {string[]}
   */
  parseRuleTargets(label) {
    let re = /] \(([^)]*)\)/;
    // let targetsText = label.match(re)[1];

    let results = label.match(re);
    return results ? results[1].split(", ") : ""
  }

  /**
   * Parses the rule label for the rule classification string.
   *
   * @param {string} label
   * @returns {string}
   */
  parseRuleClassification(label) {
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
   * @param {Rule} rule
   * @param {CheerioElement} ruleSectionNode
   */
  parseRuleDescription(rule, ruleSectionNode) {

    let ruleBoxNode = $(ruleSectionNode).find(".box");

    let ruleTextNode = $(ruleBoxNode).find("p");
    let ruleSchematronNode = $(ruleBoxNode).find("pre");

    let listSeparator = " \n- ";

    if ( ruleTextNode.length > 0 ) {
      // console.log(rule.id, rule.number);
      rule.style = "text";
      rule.text = $(ruleBoxNode).find("> p").text();

      // Parse potential lists (`<ul>`) following the paragraph node with additional rule text
      // let listText = $(ruleBoxNode).find("li").map( (i, li) => $(li).text() ).get().join(listSeparator);

      // if (listText) {
      //   rule.text += listSeparator + listText;
      // }

      this.appendListString(ruleBoxNode, rule);

    }
    else {
      rule.style = "schematron";
      rule.text = ruleSchematronNode.text().replace("\n", " ").trim();

      // Capture the text between the <sch:assert> or <sch:report> tags
      // let re = /(?:assert|report)[^>]*>([^<]*)</;
      // let matches = re.exec(rule.schematron);
      // rule.ruleText = matches[1];
    }

  }

  /**
   * Sets the information about the section that the rule or definition appears under.
   *
   * @param {CheerioElement} childNode
   */
  parseSection(childNode) {

    let sectionNode = $(childNode).closest(".section");
    let sectionHeadingNode = $(sectionNode).find("> .heading");

    let label = "Section " + sectionHeadingNode.text()
    let id = "";

    // Set the section ID
    $(sectionHeadingNode)
      .find("a")
      .each( (i, aNode) => {
        let name = aNode.attribs["name"];
        if (name.startsWith("section_")) {
          id = name;
        }
      });

    return new Section(this.spec, id, label);

  }

  /**
    * Cleans up the HTML text for processing
    *
    * @param {String} html
    * @returns {String}
    */
  cleanUp(html) {

    // Replace escaped characters
    html = html.replace(/&lt;/g, "<");
    html = html.replace(/&gt;/g, ">");

    // Remove the HTML doctype header
    html = html.replace(/<!DOCTYPE .*>/, "");

    // Close the meta tag
    html = html.replace(/<meta ([^>]*)>/, "<meta $1/>");

    // Remove contents from image tags and close (unneeded)
    html = html.replace(/<img src=[^>]*>/g, "<img/>");

    // Fix tags disappearing from the parsed text
    html = html.replace(/<absolute-URI>/g, "&lt;absolute-URI&gt;")

    return html;

  }

}

let Specification = require("./specification");


/**
 * Parses the HTML text of the given NIEM specification for rules and definitions.
 * @param {Specification} spec
 */
function parseSpecification(spec) {
  let parser = new Parser(spec);
  parser.parseHTML();
}

module.exports = parseSpecification;
