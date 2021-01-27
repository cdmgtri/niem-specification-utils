
# NIEM Specification Utils

Extracts rule and definition information from NIEM specifications into JSON and YAML files.

[![Build Status](https://travis-ci.org/cdmgtri/niem-specification-utils.svg?branch=dev)](https://travis-ci.org/cdmgtri/niem-specification-utils)
[![Coverage Status](https://coveralls.io/repos/github/cdmgtri/niem-specification-utils/badge.svg?branch=dev)](https://coveralls.io/github/cdmgtri/niem-specification-utils?branch=dev)

## Install

```bash
npm install cdmgtri/niem-specification-utils
```

## Usage

```bash
npm run build
```

This will generate separate rules and definition files for each version of each specification in the output directory.

## Test changes

```bash
npm test
```

## Add a new version of a specification

- Save the specification HTML file to the src/assets/specifications directory

  - Rename the file if necessary so the name follows the same pattern as the other versions of the spec

- In the custom specification class, add the new version number to the class's static version array:

  ```js
  // File src/ndr/index.js
  NDR.versions = ["3.0", "4.0", "5.0"];
  ```
