
let Specification = require("./specification");

class NDR extends Specification {

  /**
   * Clean up unclosed tags, simplify rule applicability values, and otherwise
   * prepare the file for rule processing.
   *
   * @param {string} html
   */
  format(html) {
    html = super.format(html);
    html = convertRuleApplicability(html);
    return html;
  }

  /**
   * Handles inconsistencies in NDR rules.
   */
  postProcessParsedData() {
    if (this.version === "3.0") {
      let rule = this.rules.find( rule => rule.number === "9-83" );
      rule.text = "The value of the attribute targetNamespace MUST match the production <absolute-URI> as defined by RFC 3986.";
    }
  }

}

module.exports = NDR;


/**
 * Replaces hyperlinks to conformance targets in rule applicabilities to simple strings.
 *
 * @param {string} xml
 * @returns {string}
 */
function convertRuleApplicability(xml) {

  // Convert REF
  xml = xml.replace(/<a href="https:\/\/reference.niem.gov\/niem\/specification\/naming-and-design-rules\/4.0\/niem-ndr-4.0.html#conformance_target_REF">REF<\/a>/g, "REF");
  xml = xml.replace(/<a href="https:\/\/reference.niem.gov\/niem\/specification\/naming-and-design-rules\/5.0\/niem-ndr-5.0.html#conformance_target_REF">REF<\/a>/g, "REF");

  // Convert EXT
  xml = xml.replace(/<a href="https:\/\/reference.niem.gov\/niem\/specification\/naming-and-design-rules\/4.0\/niem-ndr-4.0.html#conformance_target_EXT">EXT<\/a>/g, "EXT");
  xml = xml.replace(/<a href="https:\/\/reference.niem.gov\/niem\/specification\/naming-and-design-rules\/5.0\/niem-ndr-5.0.html#conformance_target_EXT">EXT<\/a>/g, "EXT");

  // Convert SET
  xml = xml.replace(/<a href="https:\/\/reference.niem.gov\/niem\/specification\/naming-and-design-rules\/4.0\/niem-ndr-4.0.html#conformance_target_SET">SET<\/a>/g, "SET");
  xml = xml.replace(/<a href="https:\/\/reference.niem.gov\/niem\/specification\/naming-and-design-rules\/5.0\/niem-ndr-5.0.html#conformance_target_SET">SET<\/a>/g, "SET");

  // Convert INS
  xml = xml.replace(/<a href="https:\/\/reference.niem.gov\/niem\/specification\/naming-and-design-rules\/4.0\/niem-ndr-4.0.html#conformance_target_INS">INS<\/a>/g, "INS");
  xml = xml.replace(/<a href="https:\/\/reference.niem.gov\/niem\/specification\/naming-and-design-rules\/5.0\/niem-ndr-5.0.html#conformance_target_INS">INS<\/a>/g, "INS");

  return xml;

}
