
let utils = require("./utils");

/**
 * Information about a versioned series of related NIEM specifications.
 */
class Suite {

  /**
   * A series of versioned specifications in the same specification family, such as NDR.
   *
   * @param {SuiteIDType} [id] - The id of the specification suite, e.g., "NDR"
   * @param {String} [name] - The name of the specification suite, e.g., "Naming and Design Rules"
   * @param {String} [repo] - The code repository where files are tracked and issues are logged
   * @param {String} [landingPage] - Top-level landing page
   * @param {String} [issueTracker] - URL for a project that shows the status of issues
   * @param {String} [tutorial] - URL for page on niem.github.io or other general info page
   * @param {String} [changeHistory] - URL for a description of version changes
   * @param {String} [description] - A basic description of the specification suite
   * @param {String} [note] - An additional note about the specification suite
   */
  constructor(id, name="", repo="", landingPage="", issueTracker="", tutorial="", changeHistory="", description="", note="") {

    /** @type {SuiteIDType} */
    this.id = id;
    this.name = name;
    this.repo = repo;
    this.landingPage = landingPage;
    this.issueTracker = issueTracker;
    this.tutorial = tutorial,
    this.changeHistory = changeHistory;
    this.description = description;
    this.note = note;

    if (this.repo) {
      this.repo = this.repo.replace(/\/$/, "");  // Make sure the URL does not end with a trailing '/'
    }

    /** @type {Specification[]} */
    this.specifications = [];

  }

  get rules() {
    return utils.flatten( this.specifications.map( spec => spec.rules ) );
  }

  get defs() {
    return utils.flatten( this.specifications.map( spec => spec.defs ) );
  }

  get targets() {
    return utils.flatten( this.specifications.map( spec => spec.targets ) );
  }

  /**
   * URL to view all issues
   */
  get issueList() {
    if (this.repo) {
      return this.repo + "/issues";
    }
  }

  /**
   * URL to submit a new issue
   */
  get issueSubmit() {
    if (this.repo) {
      return this.repo + "/issues/new";
    }
  }

  ruleURL(versionID, ruleNumber) {
    return this.version(versionID)?.ruleURL(ruleNumber);
  }

  /**
   * Saves rules and definitions for all versions of the specification together (e.g., `ndr-rules.json`).
   *
   * @param {String} [folder] - Save to the given or default folder.
   * @param {Boolean} [saveSpecificationsIndividually=false] - Defaults to false
   */
  save(folder, saveSpecificationsIndividually=false) {
    // Save all versions of the specification rules and definitions together
    utils.nameFileAndSave("suite", "rules", this.id, null, this.rules, folder);
    utils.nameFileAndSave("suite", "defs", this.id, null, this.defs, folder);

    // Save each specification's rules and definitions separately
    if (saveSpecificationsIndividually) {
      this.specifications.forEach( spec => spec.save(folder) );
    }
  }

  /**
   * Returns the specification with the given version.
   * @param {String} version
   */
  version(version) {
    return this.specifications.find( spec => spec.version == version );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      repo: this.repo,
      landingPage: this.landingPage,
      issueList: this.issueList,
      issueSubmit: this.issueSubmit,
      issueTracker: this.issueTracker,
      tutorial: this.tutorial,
      tutorialRelativeURL: convertURL(this.tutorial),
      changeHistory: this.changeHistory,
      changeHistoryRelativeURL: convertURL(this.changeHistory),
      description: this.description,
      note: this.note,
      versionCount: this.specifications.length,
      versionNumbers: this.specifications.map( spec => spec.version ).join(", ")
    }
  }

}

/**
 * @typedef {"NDR"|"IEPD"|"CodeLists"|"Conformance"|"CTAS"|"JSON"|"HLVA"} SuiteIDType
 * @type {SuiteIDType}
 */
 Suite.SuiteIDTypeDef;

/**
 * Converts a full niem.github.io URL to a relative URL.
 *
 * Relative URLs to internal pages are used in the NIEM/niem.github.io project in order to
 * support development testing.  Locally hosted pages and pages hosted on forks will not
 * appear at the expected https://niem.github.io/... URLs.
 *
 * @private
 * @param {String} fullURL
 */
function convertURL(fullURL) {
  if (fullURL) {
    return fullURL.replace("https://niem.github.io", "")  ;
  }
}

let Specification = require("./specification");

module.exports = Suite;
