/**
 * document_validation.js
 *
 * Test that mongoimport works with document validation and can bypass it.
 */

(function() {
    'use strict';
    if (typeof getToolTest === 'undefined') {
        load('jstests/configs/plain_28.config.js');
    }

    jsTest.log('Testing importing with and while bypassing document validation');

    var toolTest = getToolTest('documentvalidation');
    var commonToolArgs = getCommonToolArguments();

    // The db and collection we will use.
    var testDB = toolTest.db.getSiblingDB('test');
    var testColl = testDB.coll;

    for (var i = 0; i < 15; i++) {
        testColl.insert({ a: i });
    }

    // Sanity check the data was inserted.
    assert.eq(15, testColl.count());

    // Dump the data.
    var ret = toolTest.runTool.apply(
            toolTest,
            ['export',
	     '--out', toolTest.extFile,
	     '-d', 'test',
	     '-c', 'coll'
	     ].concat(commonToolArgs)
    );
    assert.eq(0, ret);

    // Drop the collection.
    testColl.drop();
    // Sanity check that the drop worked.
    assert.eq(0, testColl.count());
    assert.eq(0, testColl.getIndexes().length);

    // Create a document validator.
    testDB.createCollection('coll', {
        validator: { a: { $type: "string" } },
        validationLevel: 'strict',
        validationAction: 'error'
    });

    // Import the data with document validation turned on.
    ret = toolTest.runTool.apply(
            toolTest,
            ['import',
	     '--file', toolTest.extFile,
	     '--db', 'test',
	     '-c', 'coll'].concat(commonToolArgs)
    );
    assert.eq(0, ret);

    // Make sure no data was inserted.
    assert.eq(0, testColl.count());

    // Drop the collection.
    testColl.drop();
    // Sanity check that the drop worked.
    assert.eq(0, testColl.count());
    assert.eq(0, testColl.getIndexes().length);

    // Create a document validator.
    db.createCollection('test', {
        validator: { a: { $type: "string" } },
        validationLevel: 'strict',
        validationAction: 'error'
    });

    // Import the data while bypassing document validation.
    ret = toolTest.runTool.apply(
            toolTest,
            ['import',
	     '--file', toolTest.extFile,
	     '--db', 'test',
	     '-c', 'coll',
	     '--bypassDocumentValidation'].concat(commonToolArgs)
    );
    assert.eq(0, ret);

    // Make sure the data was imported correctly.
    assert.eq(15, testColl.count());

    // Success
    toolTest.stop();

}());
