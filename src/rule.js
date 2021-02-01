
/**
 * Information about a rule in a NIEM specification.
 */
class Rule {

  /**
   * Information about a specific requirement for a NIEM artifact as defined by a NIEM specification.
   *
   * @param {Specification} [specification]
   * @param {Section} [section]
   *
   * @param {string} [number=""] - Rule number, e.g., "3-1"
   * @param {string} [title=""] - Rule title
   * @param {string} [name=""] - Rule name, e.g., "rule-genericode-implementation"
   * @param {String[]} [targets=[]] - Rule conformance targets
   * @param {"Constraint"|"Interpretation"} [classification=""] Rule classification
   * @param {"text"|"schematron"} [style=""] Rule style
   * @param {string} [text=""] Rule text
   * @param {string} [schematron=""] Rule schematron snippet
   */
  constructor(specification, section, number="", title="", name="", targets=[], classification="", style="", text="", schematron="") {

    this.specification = specification;
    this.section = section;

    /** @example "3-1" */
    this.number = number;

    this.title = title;
    this.name = name;
    this.targets = targets;

    /** @type{"Constraint"|"Interpretation"} */
    this.classification = classification;

    /** @type{"text"|"schematron"} */
    this.style = style;

    this.text = text;
    this.schematron = schematron;

  }

  /**
   * @example "rule_3-1"
   */
  get id() {
    return "rule_" + this.number;
  }

  get url() {
    return this.specification.url + "#" + this.id;
  }

  toJSON() {
    return {
      specificationID: this.specification.id,
      classID: this.specification.classID,
      sectionID: this.section.id,
      sectionLabel: this.section.label,
      sectionURL: this.section.url,
      ruleNumber: this.number,
      ruleTitle: this.title,
      ruleName: this.name,
      ruleID: this.id,
      ruleUID: this.specification.id + "-" + this.id,
      ruleURL: this.url,
      ruleTargets: this.targets,
      ruleClassification: this.classification,
      ruleStyle: this.style,
      ruleText: this.text,
      ruleCurrent: this.specification.current
    }
  }

}

let Specification = require("./specification");
let Section = require("./section");

module.exports = Rule;
