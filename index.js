const core = require('@actions/core');
const exec = require('@actions/exec')
const pypi = require('./pypi');
const anaconda = require('./anaconda');
const azure = require('./azure');


async function getInstalledVersion(name) {
  let details = '';
  const options = {};
  options.listeners = {
    stdout: function (data) {
      details += data.toString();
    }
  };
  options.ignoreReturnCode = true;
  const errorCode = await exec.exec('python',
      ['-m', 'pip', 'show', name], options);
  if (errorCode !== 0) {
    core.setFailed(`${name} not found with pip show`)
  }
  console.error("Not Implemented")
}


function parseDate(date_input) {
  let date;
  if (/^\d+$/.test(date_input)) {
    let days = parseInt(date_input);
    date = new Date.now();
    date.setDate(date.getDate() + days);
  } else {
    date = new Date.parse(date_input);
  }
  return date;
}


async function run() {
  try {

    // Select index
    const indexes = {
      'pypi': pypi.find,
      'anaconda': anaconda.find,
      'azure': azure.find,
    };
    const index = core.getInput('index');
    const find = indexes[index];
    if (typeof find === 'undefined') {
      core.setFailed(`Index ${index} not recognised. Must be one of ${Object.keys(indexes)}`);
    }

    const packageName = core.getInput('package');
    const version = getInstalledVersion(packageName);
    core.setOutput('version', version);

    const datePublished = find(packageName, version);
    core.setOutput('date-published', datePublished.toString());

    // Parse best before date
    const bestBefore = core.getInput('best-before');
    if (bestBefore.length > 0) {
      const date = parseDate(bestBefore);
      if (datePublished < date) {
        core.error(`${packageName} is stale. ${version} was published at ${datePublished}`)
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
