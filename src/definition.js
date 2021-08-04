
let Utils = require("./utils");

class Definition {

  /**
   * Information about a term defined by a NIEM specification.
   *
   * @param {Specification} [specification]
   * @param {Section} [section]
   *
   * @param {string} [id=""]
   * @param {string} [term=""]
   * @param {string} [text=""]
   * @param {Boolean} [local=true] - True if the definition originates from the spec; false if its a reference
   */
  constructor(specification, section, id="", term="", text="", local=true) {

    this.specification = specification;
    this.section = section;
    this.id = id;
    this.term = term;
    this.text = text;
    this.local = local;

  }

  get url() {
    return this.specification.url + "#" + this.id
  }

  toJSON() {

    return {
      specificationID: this.specification.id,
      specificationSelector: this.specification.selector,
      suiteID: this.specification.suiteID,
      sectionID: this.section.id,
      sectionLabel: this.section.label,
      sectionURL: this.section.url,
      definitionID: this.id,
      definitionUID: this.specification.id + "-" + this.id,
      definitionURL: this.url,
      definitionTerm: this.term,
      definitionText: Utils.formatText(this.text),
      definitionLocal: this.local,
      definitionStatus: this.specification.status,
    }
  }

}

let Specification = require("./specification");
let Section = require("./section");

module.exports = Definition;
