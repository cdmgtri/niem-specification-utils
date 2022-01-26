
let Specification = require("./specification");

/**
 * Information about the NIEM Code Lists Specification
 */
class CodeListsSpecification extends Specification {

  /**
   * Handles inconsistencies in Code Lists rules and definitions.
   */
  postProcessData() {
    if (this.version === "3.0") {
      let rule = this.rules.find( rule => rule.number === "9-83" );
      if (rule) {
        rule.text = "The value of the attribute targetNamespace MUST match the production <absolute-URI> as defined by RFC 3986.";
      }
    }

    // Fix term "uniform resource identifierURI"
    let def = this.defs.find( def => def.id == "definition_URI" );
    if (def) {
      def.term = "URI";
    }

    // Fix term "uniform resource identifierURI"
    def = this.defs.find( def => def.id == "definition_uniform_resource_identifier");
    if (def) {
      def.term = "uniform resource identifier";
    }

  }

}

module.exports = CodeListsSpecification;
