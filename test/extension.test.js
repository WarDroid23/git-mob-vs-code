const vscode = require("vscode");
const expect = require("chai").expect;
const {
  getAllAuthors,
  getSelectedCoAuthors,
} = require("../src/git/git-mob-api");
const { CoAuthor } = require("../src/co-author-tree-provider/co-authors");
const { RepoAuthor } = require("../src/co-author-tree-provider/repo-authors");
const { GitExt } = require("../src/vscode-git-extension/git-ext");

function wait(timeMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}

describe("GitMob core tests", function () {
  // this.timeout(5000);
  let allAuthors = [];
  let author0, author1, author2;
  before(async function () {
    allAuthors = await getAllAuthors();
    author0 = allAuthors[0];
    author1 = allAuthors[1];
    author2 = allAuthors[2];
  });

  this.afterEach(async function () {
    await vscode.commands.executeCommand("gitmob.solo");
    await wait(20); // needed for solo to complete
  });

  it("should have 3 co-authors", function () {
    expect(allAuthors).to.have.lengthOf(3);
  });

  it("add a co-author to commit and metadata is appended to SCM input", async function () {
    const coAuthor = new CoAuthor(
      author2.name,
      author2.email,
      false,
      author2.key
    );
    await vscode.commands.executeCommand("gitmob.addCoAuthor", coAuthor);
    const gitExt = new GitExt();
    const selected = getSelectedCoAuthors(allAuthors);
    expect(selected[0].key).to.equal(coAuthor.commandKey);
    expect(selected).to.have.lengthOf(1);
    expect(gitExt.selectedRepository.inputBox.value).to.contain(
      `Co-authored-by: ${coAuthor.name} <${coAuthor.email}>`
    );
  });

  it("remove one of the two co-authors from commit message", async function () {
    const addCoAuthor = new CoAuthor(
      author1.name,
      author1.email,
      false,
      author1.key
    );
    const removeCoAuthor = new CoAuthor(
      author0.name,
      author0.email,
      false,
      author0.key
    );
    await vscode.commands.executeCommand("gitmob.addCoAuthor", removeCoAuthor);
    await vscode.commands.executeCommand("gitmob.addCoAuthor", addCoAuthor);
    await vscode.commands.executeCommand(
      "gitmob.removeCoAuthor",
      removeCoAuthor
    );

    const selected = getSelectedCoAuthors(allAuthors);
    expect(selected[0].key).to.equal(addCoAuthor.commandKey);
    expect(selected).to.have.lengthOf(1);
  });

  it("run solo no co-authors should be selected", async function () {
    const coAuthor = new CoAuthor(
      author0.name,
      author0.email,
      false,
      author0.key
    );
    await vscode.commands.executeCommand("gitmob.addCoAuthor", coAuthor);
    await vscode.commands.executeCommand("gitmob.solo");
    await wait(20);

    const gitExt = new GitExt();
    expect(gitExt.selectedRepository.inputBox.value).to.not.contain(
      "Co-authored-by"
    );
    const selected = getSelectedCoAuthors(allAuthors);
    expect(selected).to.have.lengthOf(0);
  });

  it("add a contributor from repo as a new selected co-author by default", async function () {
    const coAuthor = new RepoAuthor(
      "Jessica Jones",
      "jessica-j@gitmob.com",
      "jj"
    );
    await vscode.commands.executeCommand(
      "gitmob.addRepoAuthorToCoAuthors",
      coAuthor
    );
    const allAuthors = await getAllAuthors();
    const gitExt = new GitExt();
    const selected = getSelectedCoAuthors(allAuthors);

    expect(allAuthors).to.have.lengthOf(4);
    expect(allAuthors).to.deep.contain({
      key: "jj",
      name: "Jessica Jones",
      email: "jessica-j@gitmob.com",
    });
    expect(selected[0].key).to.equal(coAuthor.commandKey);
    expect(selected).to.have.lengthOf(1);
    expect(gitExt.selectedRepository.inputBox.value).to.contain(
      `Co-authored-by: ${coAuthor.name} <${coAuthor.email}>`
    );
  });
});