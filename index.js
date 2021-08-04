
module.exports = {
    NIEMSpecificationLibrary: require("./src/index"),
    Suite: require("./src/suite"),
    Specification: require("./src/specification"),
    Rule: require("./src/rule"),
    Definition: require("./src/definition"),

    TypeDefs: require("./src/typedefs"),

    NDR: require("./src/specification-ndr"),
    IEPD: require("./src/specification-iepd"),
    CodeLists: require("./src/specification-code-lists"),
    Conformance: require("./src/specification-conformance"),
    CTAS: require("./src/specification-ctas"),
    JSON: require("./src/specification-json"),
    HLVA: require("./src/specification-hlva"),

    Utils: require("./src/utils")
};
