#!/usr/bin/env node

const argv = require('optimist').argv;
const _ = require('lodash');

function generate(data) {
  // TODO: Add the generation code.
  console.log('Data: ', data);
}

function main() {
  var config;
  try {
    config = require('./configs/' + argv.config);
  } catch (e) {
    console.log('Incorrect config option.',
      ' Please supply valid filename from config/ folder using --config option.');
    return -1;
  }
  console.log(JSON.stringify(config));
  if (_.some(['fetcher', 'outputDirectory'], function(key) { return !_.has(config, key);})) {
    console.log('Some fields are absent from the config.');
    return -1;
  }
  var fetcher;
  try {
    fetcher = require(config.fetcher);
    console.log('Fetcher: ', fetcher);
  } catch (e) {
    console.log('Could not require ', config.fetcher);
    return -1;
  }
  var dataPromise = fetcher.fetch();
  dataPromise.then(generate).fail(console.log);
}

if (require.main === module) {
  main();
}

module.exports.generate = generate