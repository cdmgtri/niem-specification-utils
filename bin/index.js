#!/usr/bin/env node

// Parse rule and definition info from NIEM specifications and save results to /output/
require("../src/index").parse("output", true);
