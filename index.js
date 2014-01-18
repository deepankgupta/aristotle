#!/usr/bin/env node
const argv = require('optimist').argv;
const _ = require('lodash');
const util = require('util')
const primitives = require('./lib/primitives');
var config;

function getAllTypes(datum) {
  var allTypes = _.uniq(_.map(datum, function (element, key) {
    var s = generateSchema(element, key);
    if (isPrimitiveAvro(s.type)) {
      return s.type;
    } else {
      return s;
    }
  }), false, uniqTransformer);

  return allTypes;
}

function isPrimitiveAvro(avroType) {
  return _.contains(['int', 'string', 'enum', 'float', 'null', 'boolean'], avroType);
}

function uniqTransformer(el) {
  delete el.name;
  return JSON.stringify(el);
}

function getAllSchemas(datum) {
  return _.map(datum, generateSchema);
}

function generateObjectSchema(datum, key) {
  var allTypes = getAllTypes(datum);
  console.log('doing object, datum: ', datum, 'key: ', key,  'data types:',  allTypes);
  if (allTypes.length === 1) {
    //map
    return {
      name: key,
      type: {
        type: 'map',
        items: _.first(allTypes)
      }
    };
  } else {
    //record
    return {
      name: key,
      type: 'record',
      fields: getAllSchemas(datum)
    };
  }
}

function generateArraySchema(datum, key) {
  var allTypes = getAllTypes(datum);

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
  var avroType = primitives.JAVASCRIPT_TO_AVRO_TYPE[jsType];
  if (_.isFunction(avroType)) {
    avroType = avroType(datum, key);
  }
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
      console.log('doing array');
      return generateArraySchema(datum, key);
    } else  {
      //map or record
      console.log('doing object');
      return generateObjectSchema(datum, key);
    }
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
