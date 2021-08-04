
# NIEM Specification Utils

Extracts rule and definition information from NIEM specifications into XML, JSON, YAML, and CSV files.

**Branch status**:
[![Build Status](https://github.com/cdmgtri/niem-specification-utils/workflows/build/badge.svg?branch=dev)](https://github.com/cdmgtri/niem-specification-utils/actions)
[![Coverage Status](https://coveralls.io/repos/github/cdmgtri/niem-specification-utils/badge.svg?branch=dev)](https://coveralls.io/github/cdmgtri/niem-specification-utils?branch=dev)

This project parses [NIEM HTML specifications](https://reference.niem.gov/niem/specification/) to extract rule and definition information that is used on <https://niem.github.io>.

Additional metadata has been added to support linking specific NDR rules with their applicable [NIEM model concepts](https://niem.github.io/reference/concepts/).  See the [modeling references](https://niem.github.io/reference/concepts/augmentation/element/modeling/#references) information in the [augmentation elements section](https://niem.github.io/reference/concepts/augmentation/element/) for an example.

**Contents**

- [Supported specifications](#supported-specifications)
- [Output](#output)
- [Install](#install)
- [Usage](#usage)
- [Load a new specification](#load-a-new-specification)
- [Update metadata for existing specifications](#update-metadata-for-existing-specifications)
- [Add a new specification class](#add-a-new-specification-class)
- [Test changes](#test-changes)

## Supported specifications

The following NIEM specifications are supported:

- [Naming and Design Rules (NDR)](https://niem.github.io/NIEM-NDR/), versions 3.0, 4.0, and 5.0
- [Model Package Description (MPD)](https://reference.niem.gov/niem/specification/model-package-description), version 3.0.1
- [Code Lists](https://reference.niem.gov/niem/specification/code-lists/), version 4.0
- [Conformance Targets Attribute Specification](https://reference.niem.gov/niem/specification/conformance-targets-attribute/), version 3.0
- [NIEM JSON Specification](https://niem.github.io/NIEM-JSON-Spec/), version 4.0

See the update instructions below for information about adding a new set of specifications, or adding a new version of a specification to an existing set.

## Output

Information about rules and definitions are saved as XML, JSON, YAML, and CSV files to the `output/` directory

**Sample rule information from niem-rules.yaml**

Rule information includes basic info about the specification section of the specification in which the rule appears, the rule number, title, full text, link, applicable conformance targets, and whether or not the rule is defined as text or schematron.

> Note: Schematron rules are capable of being validated by the [Conformance Testing Assistant (ConTesA)](https://niem.github.io/reference/tools/contesa/) or by using the schematron validation feature in the Oxygen XML Editor ([see instructions for NIEM](https://niem.github.io/reference/tools/oxygen/ndr/)).  Text rules require manual evaluation.

```yaml
-
    specificationID: NDR-5.0
    sectionID: section_9.2.4
    sectionLabel: 'Section 9.2.4. Notation declaration'
    sectionURL: 'https://reference.niem.gov/niem/specification/naming-and-design-rules/5.0/niem-ndr-5.0.html#section_9.2.4'
    ruleNumber: 9-59
    ruleTitle: 'No use of element xs:notation'
    ruleName: ""
    ruleID: rule_9-59
    ruleURL: 'https://reference.niem.gov/niem/specification/naming-and-design-rules/5.0/niem-ndr-5.0.html#rule_9-59'
    ruleTargets: [REF, EXT]
    ruleClassification: Constraint
    ruleStyle: schematron
    ruleText: 'The schema MUST NOT contain the element xs:notation.'
-
    specificationID: NDR-5.0
    sectionID: section_9.3.1
    sectionLabel: 'Section 9.3.1. Model group'
    sectionURL: 'https://reference.niem.gov/niem/specification/naming-and-design-rules/5.0/niem-ndr-5.0.html#section_9.3.1'
    ruleNumber: 9-60
    ruleTitle: 'Model group does not affect meaning'
    ruleName: ""
    ruleID: rule_9-60
    ruleURL: 'https://reference.niem.gov/niem/specification/naming-and-design-rules/5.0/niem-ndr-5.0.html#rule_9-60'
    ruleTargets: [EXT]
    ruleClassification: Interpretation
    ruleStyle: text
    ruleText: 'The use of model groups xs:all, xs:sequence, and xs:choice MUST NOT define the semantics of an instance. The meaning of an element occurrence within an element occurrence MUST be identical, regardless of the model group used to define a schema component.'
```

**Sample definition information from niem-defs.yaml**

Definition information includes basic info about the section of the specification in which the definition appears, the definition term, full text, link, and whether or not the definition is defined locally by the specification or is a reference to another source.

```yaml
-
    specificationID: NDR-3.0
    sectionID: section_10.4.1
    sectionLabel: 'Section 10.4.1. Augmentable types'
    sectionURL: 'https://reference.niem.gov/niem/specification/naming-and-design-rules/3.0/niem-ndr-3.0.html#section_10.4.1'
    definitionID: definition_augmentable_type
    definitionURL: 'https://reference.niem.gov/niem/specification/naming-and-design-rules/3.0/niem-ndr-3.0.html#definition_augmentable_type'
    definitionTerm: 'augmentable type'
    definitionText: 'An augmentable type is complex type definition that is defined by either a reference schema document or by an extension schema document, and is either an association type, or an object type that has complex content and is not an external adapter type.'
    definitionIsLocal: true
-
    specificationID: NDR-3.0
    sectionID: section_10.4
    sectionLabel: 'Section 10.4. Augmentations'
    sectionURL: 'https://reference.niem.gov/niem/specification/naming-and-design-rules/3.0/niem-ndr-3.0.html#section_10.4'
    definitionID: definition_augmentation
    definitionURL: 'https://reference.niem.gov/niem/specification/naming-and-design-rules/3.0/niem-ndr-3.0.html#definition_augmentation'
    definitionTerm: augmentation
    definitionText: 'An augmentation is an element that is a child of an element that is an instance of an augmentable type, and is a member of the substitution group of the augmentation point element declaration for the augmentable type.'
    definitionIsLocal: true
```

## Install

```bash
npm install cdmgtri/niem-specification-utils
```

## Usage

The following will generate rule and definition files to the `output/` directory in XML, JSON, YAML, and CSV:

- for each set of specifications (e.g., `ndr-rules.json`, and
- for all NIEM specifications combined (e.g., `niem-rules.json`).

```bash
$ npm run build
# NDR-3.0 (239 rules, 54 defs)
# NDR-4.0 (255 rules, 52 defs)
# NDR-5.0 (260 rules, 52 defs)
# MPD-3.0.1 (60 rules, 44 defs)
# CodeLists-4.0 (29 rules, 56 defs)
# CTAS-3.0 (6 rules, 5 defs)
```

## Load a new specification

Basic metadata about the specification must be manually entered.

- Save the specification HTML file to the `/specifications/` directory.

  - Rename the specification file with the same pattern as other specifications in this class (e.g., `NDR-5.0.html`).

- Add metadata about the new specification:

  - *Copy and un-comment the template located at the top of the file or copy an existing entry and modify the values*

  - Add metadata to `/data/specifications.yaml`.  This will include information like version number and URL for the HTML file.

    - Use the same abbreviation as other specifications in this class for the `classID` field (e.g., "NDR")
    - Quote the version value to prevent it from being converted to a number (e.g., "4.0" instead of number 4)
    - Update the value of `current` to `false` for the previous version of the specification

- Run the continuous integration script from `package.json` to build outputs, run tests, generate a code coverage report, and update documentation:

  ```sh
  npm run ci
  ```

  - A message with the new specification ID, number of parsed rules, and number of parsed definitions should appear in the console.
  - The `/output/` directory should contain new specification-specific rule and definitions files, and the combined `niem-*` files should contain new data.  Scan through the changes to confirm.

- Update the `Supported specifications` section of this `README.md` file to add the new information.

## Update metadata for existing specifications

To update information like where to view a specification or submit an issue, update the appropriate fields in the `data/specifications.yaml` file.

## Add a new specification class

To add a brand new class of NIEM specification, the following edits will need to be made:

- Choose a standard abbreviation to use for the new specification class

  - For example, "NDR" is used for the Naming and Design Rules.

- Save the specification HTML file to the `/specifications/` directory.

  - Rename the specification file with the pattern `ABBREVIATION-VERSION.html` (e.g., `NDR-5.0.html`).

- Add metadata about the new specification class and the specific versions of the specification.

  - *Copy and un-comment the template located at the top of the files or copy an existing entry and modify the values*

  - Add specification class metadata to `/data/classes.yaml/`.  This is for general information that should be applicable across multiple versions of the specification.

  - Add specific specification metadata to `/data/specifications.yaml`.  This will include information like version number and URL for the HTML file.

    - Use the new abbreviation for the `classID` field
    - Quote the version value to prevent it from being converted to a number (e.g., "4.0" instead of number 4)

- Create a new class that extends class `Specification` (`/src/specification.js`).

  - See `/src/specification-ctas.js` for an example.
  - Save as `/src/specification-{new abbrev}.js`.

- In the `/src/index.js` file:

  - Import the new class
  - Add the new class to the constructor
  - Add the new class to the `SpecificationConstructors` object in function `loadSpecificationMetadata()`
  - Add the new abbreviation to the JSDoc enumerations for the classID parameter in function `specificationClass()`
  - Return the new class in the array in the `specificationClasses()` getter function

- Run the continuous integration script from `package.json` to build outputs, run tests, generate a code coverage report, and update documentation:

  ```sh
  npm run ci
  ```

  - A message with the new specification ID, number of parsed rules, and number of parsed definitions should appear in the console.
  - The `/output/` directory should contain new specification-specific rule and definitions files, and the combined `niem-*` files should contain new data.  Scan through the changes to confirm.

- Update the `Supported specifications` section of this `README.md` file to add the new information.

- Commit and push changes.  Check the results from GitHub Actions to confirm all checks pass.

## Test changes

The Jest tests in `test/index.test.js` primarily ensure that changes to the code set do not break existing functionality by comparing newly-generated output files in `test/output/` against the files in the root `output/` which have already been approved.

Review any differences between the test output and the expected output to determine if the changes are valid.  If so, run `npm run build` to update the files in the root `output/` directory.

```bash
npm test
```

Tests also include such things as checking for valid parsed IDs and truncated rule and definition text fields.
