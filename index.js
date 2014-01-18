#!/usr/bin/env node
const argv = require('optimist').argv;
const _ = require('lodash');
const util = require('util')
const primitives = require('./lib/primitives');
var config;

function generateArraySchema(datum, key) {
  //TODO: fix uniqing of complex types
  var allTypes = _.uniq(_.map(datum, function (element) {
    var s = generateSchema(element);
    if (_.contains(['int', 'string', 'enum', 'float', 'null', 'boolean'], s.type)) {
      return s.type;
    } else {
      return s;
    }
  }));

  if (allTypes.length === 1) {
    allTypes = _.first(allTypes);
  }

  return {
    name: key,
    type: {
      type: 'array',
      items: allTypes
    }
  };
}

function getAvroType(jsType, datum, key) {
  console.log(arguments);
  var avroType = primitives.JAVASCRIPT_TO_AVRO_TYPE[jsType];
  if (_.isFunction(avroType)) {
    avroType = avroType(datum, key);
  }
  console.log(avroType);
  return avroType;
}

function generateSchema(datum, key) {
  console.log('generateSchema: ', datum, key);
  var type = typeof datum;
  if (primitives.isPrimitive(type)) {
    var avroType = getAvroType(type, datum, key);
    return {
      name: key,
      type: avroType,
      doc: ''
    };
  } else {
    if (Array.isArray(datum)) {
      return generateArraySchema(datum, key);
    }
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
  primitives.configure(config);
  var dataPromise = fetcher.fetch();
  dataPromise.then(generate).fail(console.log);
}

if (require.main === module) {
  main();
}

module.exports.generate = generate
