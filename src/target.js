
class Target {

  /**
   * @param {Specification} [specification]
   * @param {String} [code]
   * @param {String} [target]
   * @param {String} [definitionFragment]
   * @param {String} [description]
   * @param {String} [tutorial]
   */
  constructor(specification, code, target, definitionFragment, description, tutorial) {

    this.specification = specification;
    this.code = code;
    this.target = target;
    this.definitionFragment = definitionFragment;
    this.description = description;
    this.tutorial = tutorial;

  }

  get url() {
    return this.specification.url + "#" + this.definitionFragment;
  }

  toJSON() {
    return {
      specificationID: this.specification.id,
      specificationSelector: this.specification.selector,
      suiteID: this.specification.suiteID,
      targetCode: this.code,
      targetName: this.target,
      targetURL: this.url,
      targetDescription: this.description,
      targetTutorial: this.tutorial,
      targetStatus: this.specification.status
    }
  }

}

let Specification = require("./specification");

module.exports = Target;
