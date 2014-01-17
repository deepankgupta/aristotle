#!/usr/bin/env node

const argv = require('optimist').argv;
const _ = require('lodash');
const traverse = require('traverse');
const util = require('util')
var config;



function isPrimitive(type) {
  return _.has(JAVASCRIPT_TO_AVRO_TYPE, type);
}

// TODO: Convert string to bytes, enum or fixed as well.
var JAVASCRIPT_TO_AVRO_TYPE = {
  'null': 'null',
  'boolean': 'boolean',
  'number': getNumberAvroType,
  'string': getStringAvroType,
}

function getNumberAvroType(datum, key) {
  if (datum % 1 === 0) {
    return 'int';
  } else {
    return 'float';
  }
}

function getStringAvroType(datum, key) {
  var enumWhitelistedProperties = traverse.get(config, ['enums', 'whitelistedProperties']);
  if (enumWhitelistedProperties && _.contains(enumWhitelistedProperties, key)) {
    return 'enum';
  } else {
    return 'string';
  }
}

function generateSchema(datum, key) {
  console.log('generateSchema: ', datum, key);
  var type = typeof datum;
  if (isPrimitive(type)) {
    var avroType = JAVASCRIPT_TO_AVRO_TYPE[type]
    if (_.isFunction(avroType)) {
      avroType = avroType(datum, key);
    }
    return {
      name: key,
      type: avroType,      
      doc: ''
    };
  } else {
    // TODO: Handle complex types
    return _.map(datum, generateSchema);
  }
}

function generate(data) {
  // TODO: Add the generation code.
  var result = _.map(data, function(jsons, namespacePrefix) {
    // TODO: Combine schemas from multiple samples.
    return _.map(jsons, function(json) {
      // TODO: Write these schemas out in the output directory. 
      return generateSchema(json, namespacePrefix);
    });
  });
  console.log('Data: ', JSON.stringify(result, undefined, 2));
}

function main() {
  try {
    config = require('./configs/' + argv.config);
  } catch (e) {
    console.log('Incorrect config option.',
      ' Please supply valid filename from config/ folder using --config option.');
    return -1;
  }
  if (_.some(['fetcher', 'outputDirectory'], function(key) { return !_.has(config, key);})) {
    console.log('Some fields are absent from the config.');
    return -1;
  }
  var fetcher;
  try {
    fetcher = require(config.fetcher);
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